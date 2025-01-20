import os
import numpy as np
import logging
import cv2
import mediapipe as mp
import json
from tensorflow.keras.models import load_model
from app.utils import get_local_path

logger = logging.getLogger(__name__)

# Constants
MODEL_SUBPATH = os.path.join("models", "2_shotput", "shotput_stage3.keras")
MAX_SEQUENCE_LENGTH = 100  # Adjust this value as needed

# Initialize Mediapipe Pose with tracking confidence parameters
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

def calculate_angle(a, b, c):
    """Calculate the angle between three points with clipping for numerical stability."""
    ba = [a[0] - b[0], a[1] - b[1]]
    bc = [c[0] - b[0], c[1] - b[1]]
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    return np.degrees(np.arccos(cosine_angle))

def calculate_velocity(coord1, coord2, fps=30):
    """Calculate velocity between two coordinate points given fps."""
    dx = coord2[0] - coord1[0]
    dy = coord2[1] - coord1[1]
    distance = np.sqrt(dx**2 + dy**2)
    return distance * fps

def extract_keypoints(video_path):
    """
    Extract left and right leg keypoints from the video.
    Each frame produces a dictionary with 'left_leg' and 'right_leg' data.
    """
    keypoints = []
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception("Could not open video file")
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(frame_rgb)
        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            left_leg = {
                "hip": [landmarks[mp_pose.PoseLandmark.LEFT_HIP].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP].y],
                "knee": [landmarks[mp_pose.PoseLandmark.LEFT_KNEE].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE].y],
                "ankle": [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].y],
            }
            right_leg = {
                "hip": [landmarks[mp_pose.PoseLandmark.RIGHT_HIP].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP].y],
                "knee": [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE].x, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE].y],
                "ankle": [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE].y],
            }
            keypoints.append({"left_leg": left_leg, "right_leg": right_leg})
    cap.release()
    return keypoints

def extract_features(keypoints):
    """
    Extract features from keypoints.
    For each frame (starting at frame 1) calculate:
      - The velocity of the left ankle.
      - The knee angle from the right leg.
      - The distance between left and right ankles.
    Returns an array of features.
    """
    features = []
    for i in range(1, len(keypoints)):
        prev_left_ankle = keypoints[i-1]["left_leg"]["ankle"]
        curr_left_ankle = keypoints[i]["left_leg"]["ankle"]
        left_velocity = calculate_velocity(prev_left_ankle, curr_left_ankle)
        
        right_leg = keypoints[i]["right_leg"]
        knee_angle = calculate_angle(right_leg["hip"], right_leg["knee"], right_leg["ankle"])
        
        left_ankle = keypoints[i]["left_leg"]["ankle"]
        right_ankle = keypoints[i]["right_leg"]["ankle"]
        ankle_distance = np.linalg.norm(np.array(left_ankle) - np.array(right_ankle))
        
        features.append([left_velocity, knee_angle, ankle_distance])
    return np.array(features)

def classify_score(predictions):
    """Map the prediction vector to a score by taking the argmax and mapping to 0, 0.5, or 1."""
    class_map = {0: 0, 1: 0.5, 2: 1}
    predicted_class = np.argmax(predictions)
    return class_map.get(predicted_class, 0)

def main(video_path):
    """Process video for stage3 and return prediction results."""
    local_path = None
    try:
        local_path = get_local_path(video_path)
        keypoints = extract_keypoints(local_path)
        if not keypoints:
            return {"video": video_path, "error": "No keypoints extracted"}
        
        features = extract_features(keypoints)
        if features.size == 0:
            return {"video": video_path, "error": "No features extracted"}
        
        features = features.reshape(1, features.shape[0], features.shape[1])
        base_dir = os.path.dirname(os.path.dirname(__file__))
        model_path = os.path.join(base_dir, MODEL_SUBPATH)
        model = load_model(model_path)
        predictions = model.predict(features)
        score = classify_score(predictions[0])
        
        return {
            "video": video_path,
            "predicted_scores": predictions.tolist(),
            "classified_score": float(score)
        }
    except Exception as e:
        logger.error(f"Error processing video in stage3: {str(e)}")
        return {"video": video_path, "error": str(e)}
    finally:
        if video_path.startswith(("http://", "https://")) and local_path and os.path.exists(local_path):
            try:
                os.unlink(local_path)
            except Exception as cleanup_e:
                logger.error(f"Error cleaning up temporary file in stage3: {str(cleanup_e)}")

if __name__ == "__main__":
    test_video = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_videos", "stage3.mp4")
    result = main(test_video)
    print(json.dumps(result, indent=2))