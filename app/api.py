import os
import tempfile
import requests
import cv2
import numpy as np
import logging
from datetime import datetime
from flask import Flask, request, jsonify

# Import stage scripts from the scripts package (assumed to exist)
from app.scripts.shotput_stage1_script import main as run_stage1
from app.scripts.shotput_stage2_script import main as run_stage2
from app.scripts.shotput_stage3_script import main as run_stage3
from app.scripts.shotput_stage4_script import main as run_stage4
from app.scripts.shotput_stage5_script import main as run_stage5

from app.utils import get_local_path

# Set up Flask application
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use PORT environment variable if present; default to 80
PORT = int(os.environ.get("WEBSITES_PORT", os.environ.get("PORT", 80)))

### Utility Functions ###

def download_video(url: str) -> str:
    """Download a remote video URL to a local temporary file."""
    logger.info(f"Downloading video from URL: {url}")
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    tmp_file.write(chunk)
        local_path = tmp_file.name
        file_size = os.path.getsize(local_path)
        logger.info(f"Downloaded video to {local_path} (size: {file_size} bytes)")
        return local_path
    except Exception as e:
        logger.error(f"Failed to download video from {url}: {str(e)}")
        raise

def cut_video_opencv(full_video_path: str, start_frame: int, end_frame: int) -> str:
    """
    Cut a subclip from the full video using OpenCV based on frame numbers.
    Returns the path to the temporary subclip file.
    """
    cap = cv2.VideoCapture(full_video_path)
    if not cap.isOpened():
        raise Exception(f"Could not open video file: {full_video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    subclip_path = temp_file.name
    temp_file.close()

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(subclip_path, fourcc, fps, (width, height))

    # Set the starting frame position
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    # Write frames from start_frame to end_frame - 1
    for frame_num in range(start_frame, end_frame):
        ret, frame = cap.read()
        if not ret:
            logger.warning(f"Reached end of video early at frame {frame_num}")
            break
        out.write(frame)

    cap.release()
    out.release()

    # Log file size for diagnostics
    if os.path.exists(subclip_path):
        file_size = os.path.getsize(subclip_path)
        logger.info(f"Subclip saved to {subclip_path} (size: {file_size} bytes)")
    else:
        logger.error(f"Subclip file {subclip_path} does not exist after writing.")

    # Optional: Verify that the subclip can be opened by OpenCV
    subclip_cap = cv2.VideoCapture(subclip_path)
    if not subclip_cap.isOpened():
        subclip_cap.release()
        raise Exception("Could not open subclip video file")
    subclip_cap.release()

    return subclip_path

def analyze_stage(video_path: str, stage: dict) -> dict:
    """Analyze a single stage using the appropriate stage script.
    
    This version uses the provided start_time and end_time as frame numbers.
    """
    stage_name = stage.get("name", "").lower()
    # Use start_time and end_time directly as frame numbers
    start_frame = int(stage.get("start_time", 0))
    end_frame = int(stage.get("end_time", 0))

    # Open the video to retrieve fps (for writing the subclip correctly)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise Exception(f"Could not open video file: {video_path}")
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()

    logger.info(f"Analyzing stage {stage_name} from frame {start_frame} to {end_frame} (fps: {fps}).")
    
    subclip_path = cut_video_opencv(video_path, start_frame, end_frame)

    try:
        if stage_name == "stage1":
            return run_stage1(subclip_path)
        elif stage_name == "stage2":
            return run_stage2(subclip_path)
        elif stage_name == "stage3":
            return run_stage3(subclip_path)
        elif stage_name == "stage4":
            return run_stage4(subclip_path)
        elif stage_name == "stage5":
            return run_stage5(subclip_path)
        else:
            logger.error(f"Unknown stage: {stage_name}")
            return {"error": f"Unknown stage: {stage_name}"}
    finally:
        if os.path.exists(subclip_path):
            os.remove(subclip_path)

### Endpoints ###

@app.route("/analyze", methods=["POST"])
def analyze_video():
    """Main endpoint for video analysis."""
    logger.info("Received request to /analyze")
    try:
        data = request.get_json(force=True)
        logger.info(f"Request payload: {data}")

        video_url = data.get("video_url")
        stages = data.get("stages", [])
        exercise = data.get("exercise", "shotput")
        processing_id = data.get("processing_id", "unknown")

        if not video_url or not stages:
            logger.error("Missing required fields in request.")
            return jsonify({"error": "Missing required fields (video_url, stages)", "status": "failed"}), 400

        local_video_path = download_video(video_url)
        result = {
            "processingId": processing_id,
            "exercise": exercise,
            "stageAnalysis": {},
            "metrics": {"overall_score": 0.0, "confidence": 0.0}
        }

        total_score = 0.0
        total_confidence = 0.0
        processed_stages = 0

        for stage in stages:
            stage_name = stage.get("name", "")
            stage_result = analyze_stage(local_video_path, stage)
            result["stageAnalysis"][stage_name] = stage_result

            # Attempt to get a score from either 'predicted_score' or 'score'
            score = stage_result.get("classified_score") or stage_result.get("score")
            confidence = stage_result.get("confidence", 0.0)

            if score is not None:
                total_score += float(score)
                total_confidence += float(confidence)
                processed_stages += 1

        # Instead of averaging, we want the total sum of the stages' scores.
        result["metrics"]["overall_score"] = total_score
        # Optionally you can sum the confidence values as well (or decide on another aggregation)
        result["metrics"]["confidence"] = total_confidence

        logger.info(f"Analysis completed: {result}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in /analyze endpoint: {str(e)}")
        return jsonify({"error": str(e), "status": "failed"}), 500
    finally:
        try:
            if 'local_video_path' in locals() and os.path.exists(local_video_path):
                os.remove(local_video_path)
        except Exception as cleanup_error:
            logger.error(f"Cleanup error: {str(cleanup_error)}")

@app.route("/health", methods=["GET"])
def health_check():
    """Health-check endpoint for container and app diagnostics."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": os.environ.get("VERSION", "dev")
    }), 200

# Only run if executed directly (useful for local debugging)
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)