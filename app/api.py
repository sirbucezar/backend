import os
import tempfile
import requests
import cv2
import numpy as np
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from azure.storage.queue import QueueServiceClient, QueueClient, TextBase64EncodePolicy
from azure.storage.blob import BlobServiceClient

# Import stage scripts from the scripts package
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

# Environment Variables
PORT = int(os.environ.get("WEBSITES_PORT", os.environ.get("PORT", 80)))
AZURE_STORAGE_CONNECTION_STRING = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
QUEUE_NAME = "videoprocess-augmented"
BLOB_CONTAINER_NAME = "cropped-videos"

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
    """Cut a subclip from the full video using OpenCV based on frame numbers."""
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

    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    for frame_num in range(start_frame, end_frame):
        ret, frame = cap.read()
        if not ret:
            logger.warning(f"Reached end of video early at frame {frame_num}")
            break
        out.write(frame)

    cap.release()
    out.release()

    logger.info(f"Subclip saved to {subclip_path}")
    return subclip_path

def upload_to_blob(local_video_path, processing_id, stage_name):
    """Uploads a processed video clip to Azure Blob Storage."""
    try:
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        container_client = blob_service_client.get_container_client(BLOB_CONTAINER_NAME)

        blob_name = f"{processing_id}/{stage_name}.mp4"
        blob_client = container_client.get_blob_client(blob_name)

        with open(local_video_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)

        logger.info(f"Uploaded cropped video: {blob_name}")
        return blob_client.url
    except Exception as e:
        logger.error(f"Error uploading cropped video: {str(e)}")
        return None

def send_to_queue(message_data):
    """Sends a message to Azure Queue Storage."""
    try:
        queue_client = QueueClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING, QUEUE_NAME, message_encode_policy=TextBase64EncodePolicy())
        queue_client.send_message(message_data)
        logger.info("Message successfully added to the queue.")
    except Exception as e:
        logger.error(f"Error sending message to queue: {str(e)}")

def analyze_stage(video_path: str, stage: dict) -> dict:
    """Analyze a single stage using the appropriate script."""
    stage_name = stage.get("name", "").lower()
    start_frame = int(stage.get("start_time", 0))
    end_frame = int(stage.get("end_time", 0))

    logger.info(f"Analyzing stage {stage_name} from frame {start_frame} to {end_frame}")

    subclip_path = cut_video_opencv(video_path, start_frame, end_frame)
    video_url = upload_to_blob(subclip_path, stage.get("processing_id", "unknown"), stage_name)

    try:
        if stage_name == "stage1":
            return {**run_stage1(subclip_path), "video_url": video_url}
        elif stage_name == "stage2":
            return {**run_stage2(subclip_path), "video_url": video_url}
        elif stage_name == "stage3":
            return {**run_stage3(subclip_path), "video_url": video_url}
        elif stage_name == "stage4":
            return {**run_stage4(subclip_path), "video_url": video_url}
        elif stage_name == "stage5":
            return {**run_stage5(subclip_path), "video_url": video_url}
        else:
            logger.error(f"Unknown stage: {stage_name}")
            return {"error": f"Unknown stage: {stage_name}", "video_url": None}
    finally:
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
            return jsonify({"error": "Missing required fields"}), 400

        local_video_path = download_video(video_url)
        result = {
            "processingId": processing_id,
            "exercise": exercise,
            "stageAnalysis": {},
            "metrics": {"overall_score": 0.0, "confidence": 0.0}
        }

        for stage in stages:
            stage_name = stage.get("name", "")
            stage["processing_id"] = processing_id
            stage_result = analyze_stage(local_video_path, stage)
            result["stageAnalysis"][stage_name] = stage_result

        send_to_queue(result)

        logger.info(f"Analysis completed: {result}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in /analyze: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(local_video_path):
            os.remove(local_video_path)

@app.route("/health", methods=["GET"])
def health_check():
    """Health-check endpoint for container diagnostics."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": os.environ.get("VERSION", "dev")
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)