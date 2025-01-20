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
MODEL_SUBPATH = os.path.join("models", "2_shotput", "shotput_stage4.keras")
MAX_SEQUENCE_LENGTH = 120  # Adjust as needed

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

def extract_keypoints(video_path):
    """
    Extract keypoints for stage4.
    For each frame, extract:
      - push_leg (using right hip, knee, ankle)
      - torso (left and right shoulders)
      - arms (right elbow and wrist)
    Returns a list of dictionaries.
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
            entry = {
                "push_leg": {
                    "hip": [landmarks[mp_pose.PoseLandmark.RIGHT_HIP].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP].y],
                    "knee": [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE].x, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE].y],
                    "ankle": [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE].y]
                },
                "torso": {
                    "right_shoulder": [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y],
                    "left_shoulder": [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y]
                },
                "arms": {
                    "right_elbow": [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].x, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].y],
                    "right_wrist": [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].y]
                }
            }
            keypoints.append(entry)
    cap.release()
    return keypoints

def extract_features(keypoints):
    """
    From the extracted keypoints, compute features for stage4.
    For each frame (starting from frame 1), calculate:
      - push_leg velocity (x and y differences)
      - knee to ankle distance
      - shoulder angle (from left to right shoulder)
      - right arm angle (from right elbow to right wrist)
    Returns an array of features.
    """
    features = []
    for i in range(1, len(keypoints)):
        previous = keypoints[i - 1]["push_leg"]["hip"]
        current = keypoints[i]["push_leg"]["hip"]
        velocity = [current[0] - previous[0], current[1] - previous[1]]
        
        knee = keypoints[i]["push_leg"]["knee"]
        ankle = keypoints[i]["push_leg"]["ankle"]
        knee_ankle_dist = np.linalg.norm(np.array(knee) - np.array(ankle))
        
        right_shoulder = keypoints[i]["torso"]["right_shoulder"]
        left_shoulder = keypoints[i]["torso"]["left_shoulder"]
        shoulder_angle = np.arctan2(right_shoulder[1] - left_shoulder[1],
                                    right_shoulder[0] - left_shoulder[0])
        
        right_elbow = keypoints[i]["arms"]["right_elbow"]
        right_wrist = keypoints[i]["arms"]["right_wrist"]
        right_arm_angle = np.arctan2(right_wrist[1] - right_elbow[1],
                                     right_wrist[0] - right_elbow[0])
        
        features.append(velocity + [knee_ankle_dist, shoulder_angle, right_arm_angle])
    return np.array(features)

def classify_prediction(predictions):
    """Map prediction vector to class label."""
    class_map = {0: 0, 1: 0.5, 2: 1}
    predicted_class = np.argmax(predictions)
    return class_map.get(predicted_class, 0)

def main(video_path):
    """Process video for stage4 and return analysis results."""
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
        score = classify_prediction(predictions[0])
        return {
            "video": video_path,
            "predicted_scores": predictions.tolist(),
            "classified_score": float(score)
        }
    except Exception as e:
        logger.error(f"Error processing video in stage4: {str(e)}")
        return {"video": video_path, "error": str(e)}
    finally:
        if video_path.startswith(("http://", "https://")) and local_path and os.path.exists(local_path):
            try:
                os.unlink(local_path)
            except Exception as cleanup_e:
                logger.error(f"Error cleaning up temporary file in stage4: {str(cleanup_e)}")

if __name__ == "__main__":
    test_video = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_videos", "stage4.mp4")
    result = main(test_video)
    print(json.dumps(result, indent=2))