"""
HumanEgo Processing Backend
FastAPI service for processing egocentric videos
"""
import os
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import shutil
from pathlib import Path
from dotenv import load_dotenv

from humanego.processor import HumanEgoProcessor

# Load environment variables
load_dotenv()

app = FastAPI(title="HumanEgo Processing API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processor
processor = HumanEgoProcessor()

# Upload directory
UPLOAD_DIR = Path("/tmp/humanego-uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class ProcessRequest(BaseModel):
    video_id: str
    video_path: str
    task_name: Optional[str] = None


class ProcessStatus(BaseModel):
    video_id: str
    status: str
    progress: Optional[float] = None
    message: Optional[str] = None


@app.get("/")
async def root():
    return {
        "service": "HumanEgo Processing Backend",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/process")
async def process_video(
    background_tasks: BackgroundTasks,
    video_id: str,
    task_name: Optional[str] = None,
    file: UploadFile = File(...)
):
    """
    Upload and process a video through HumanEgo pipeline
    """
    try:
        # Save uploaded file
        upload_path = UPLOAD_DIR / f"{video_id}.mp4"
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Queue processing in background
        background_tasks.add_task(
            processor.process_video,
            video_id,
            str(upload_path),
            task_name
        )

        return {
            "message": "Processing started",
            "video_id": video_id,
            "status": "processing"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status/{video_id}")
async def get_status(video_id: str):
    """
    Get processing status for a video
    """
    try:
        status = processor.get_status(video_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process/url")
async def process_from_url(
    background_tasks: BackgroundTasks,
    request: ProcessRequest
):
    """
    Process a video from an existing file path
    """
    try:
        # Queue processing in background
        background_tasks.add_task(
            processor.process_video,
            request.video_id,
            request.video_path,
            request.task_name
        )

        return {
            "message": "Processing started",
            "video_id": request.video_id,
            "status": "processing"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
