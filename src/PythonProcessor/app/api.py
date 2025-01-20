# app/api.py
from flask import Flask, request, jsonify
import logging
import os
import tempfile
import requests
import cv2
import numpy as np
from datetime import datetime
from typing import Dict

# Import stage scripts from the scripts package
from app.scripts.shotput_stage1_script import main as run_stage1
from app.scripts.shotput_stage2_script import main as run_stage2
from app.scripts.shotput_stage3_script import main as run_stage3
from app.scripts.shotput_stage4_script import main as run_stage4
from app.scripts.shotput_stage5_script import main as run_stage5

from app.utils import get_local_path  # utility function to download a video if needed

# Set up Flask application
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

### UTILS ###

def download_video(url: str) -> str:
    """Download a remote video URL to a local temporary file."""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    tmp_file.write(chunk)
        local_path = tmp_file.name
        logger.info(f"Downloaded video to {local_path}")
        return local_path
    except Exception as e:
        logger.error(f"Failed to download video from {url}: {str(e)}")
        raise

def cut_video_opencv(full_video_path: str, start_sec: float, end_sec: float) -> str:
    """
    Cut a subclip from the full video using OpenCV.
    Returns the path to the subclip.
    """
    cap = cv2.VideoCapture(full_video_path)
    if not cap.isOpened():
        raise Exception("Could not open video file")

    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    start_frame = int(start_sec * fps)
    end_frame = int(end_sec * fps)

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    subclip_path = temp_file.name
    temp_file.close()

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(subclip_path, fourcc, fps, (width, height))

    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    for frame_num in range(start_frame, end_frame):
        ret, frame = cap.read()
        if not ret:
            break
        out.write(frame)
    cap.release()
    out.release()
    logger.info(f"Subclip saved to {subclip_path}")
    return subclip_path

def analyze_stage(video_path: str, stage: Dict) -> Dict:
    """
    Analyze a single stage using the appropriate stage script.
    Expects a dictionary:
      stage = {"name": "stage1", "startTime": 0.0, "endTime": 3.5}
    """
    stage_name = stage.get("name", "").lower()
    start_sec = float(stage.get("startTime", 0))
    end_sec = float(stage.get("endTime", 0))

    # Cut the subclip for the stage analysis
    subclip_path = cut_video_opencv(video_path, start_sec, end_sec)
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
            return {"error": f"Unknown stage: {stage['name']}"}
    finally:
        if os.path.exists(subclip_path):
            os.remove(subclip_path)

### ENDPOINTS ###

@app.route("/analyze", methods=["POST"])
def analyze_video():
    """
    Main endpoint for video analysis.
    Expects JSON with:
      - videoUrl (str)
      - stages (list of stage dicts)
      - exercise (optional, default 'shotput')
      - processingId (optional)
    """
    try:
        data = request.get_json(force=True)
        video_url = data["videoUrl"]
        stages = data.get("stages", [])
        exercise = data.get("exercise", "shotput")
        processing_id = data.get("processingId", "unknown")

        # Download the video
        local_video_path = download_video(video_url)

        # Initialize result dictionary
        result = {
            "processingId": processing_id,
            "exercise": exercise,
            "stageAnalysis": {},
            "metrics": {"overall_score": 0.0, "confidence": 0.0}
        }

        total_score = 0.0
        total_confidence = 0.0
        processed_stages = 0

        # Run analysis for each stage
        for stage in stages:
            stage_name = stage.get("name", "")
            stage_result = analyze_stage(local_video_path, stage)
            result["stageAnalysis"][stage_name] = stage_result

            # Try to extract score and confidence from result
            score = stage_result.get("predicted_score") or stage_result.get("score")
            confidence = stage_result.get("confidence", 0.0)
            if score is not None:
                total_score += float(score)
                total_confidence += float(confidence)
                processed_stages += 1

        if processed_stages:
            result["metrics"]["overall_score"] = total_score / processed_stages
            result["metrics"]["confidence"] = total_confidence / processed_stages

        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in /analyze endpoint: {str(e)}")
        return jsonify({"error": str(e), "status": "failed"}), 500
    finally:
        # Clean up the downloaded video file
        try:
            if os.path.exists(local_video_path):
                os.remove(local_video_path)
        except Exception as cleanup_error:
            logger.error(f"Cleanup error: {str(cleanup_error)}")

@app.route("/health", methods=["GET"])
def health_check():
    """Simple health-check endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": os.environ.get("VERSION", "dev")
    }), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)