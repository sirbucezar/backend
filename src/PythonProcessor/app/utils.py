import os
import tempfile
import requests
import logging

logger = logging.getLogger(__name__)

def get_local_path(video_url: str) -> str:
    """
    Checks if the video_url is a URL or a local file.
    If it is a URL, downloads it to a temporary file and returns the local path.
    """
    if video_url.startswith(("http://", "https://")):
        try:
            response = requests.get(video_url, stream=True)
            response.raise_for_status()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_file:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        tmp_file.write(chunk)
                local_path = tmp_file.name
                logger.info(f"Downloaded video to {local_path}")
                return local_path
        except Exception as e:
            logger.error(f"Error downloading video from {video_url}: {e}")
            raise
    else:
        if os.path.exists(video_url):
            return video_url
        else:
            raise FileNotFoundError(f"Local video file not found: {video_url}")