# HumanEgo Integration Setup Guide

This guide walks you through setting up the full HumanEgo pipeline integration with your dashboard.

## Overview

The integration consists of three main parts:
1. **HumanEgo Repository** - The core ML pipeline
2. **Python Backend** - FastAPI service for processing
3. **Next.js Frontend** - UI for triggering and monitoring

## Prerequisites

- Python 3.11+
- Conda (for HumanEgo environment)
- Node.js 18+
- CUDA-capable GPU (recommended for processing)

## Step 1: Install HumanEgo

```bash
# Clone HumanEgo (already done)
cd ~/HumanEgo

# Create conda environment
conda create -n humanego python=3.11 -y
conda activate humanego

# Install dependencies
bash setup.sh

# Optional: Pre-download model weights
PREDOWNLOAD=1 bash setup.sh
```

## Step 2: Set Up Python Backend

```bash
cd data-dashboard/python-backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp ../.env.local .env

# Add Python backend URL
echo "PYTHON_BACKEND_URL=http://localhost:8000" >> .env
```

## Step 3: Configure Next.js

```bash
cd data-dashboard

# Update .env.local with Python backend URL
echo "PYTHON_BACKEND_URL=http://localhost:8000" >> .env.local
```

## Step 4: Database Setup (Optional)

To persist processing jobs and results:

```sql
-- Add to your Supabase database

CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  task_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  results JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_processing_jobs_video_id ON processing_jobs(video_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
```

## Running the Full Stack

### Terminal 1: Python Backend
```bash
cd data-dashboard/python-backend
conda activate humanego
uvicorn main:app --reload --port 8000
```

### Terminal 2: Next.js Frontend
```bash
cd data-dashboard
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Python API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Usage

### 1. Upload a Video
Go to the gallery and upload an egocentric video (MOV or MP4).

### 2. Trigger Processing
Click "Process with HumanEgo" on any uploaded video.

### 3. Monitor Progress
A processing status modal will appear showing real-time progress.

### 4. View Results
Once complete, you can:
- View hand and object trajectories
- Download processed data
- Use trajectories for robot training

## API Endpoints

### Start Processing
```bash
curl -X POST http://localhost:8000/process/url \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "video-123",
    "video_path": "/path/to/video.mp4",
    "task_name": "pick_and_place"
  }'
```

### Check Status
```bash
curl http://localhost:8000/status/video-123
```

## Troubleshooting

### Python backend won't start
- Ensure conda environment is activated: `conda activate humanego`
- Check CUDA availability if using GPU
- Verify all dependencies installed: `pip list`

### Processing fails
- Check Python backend logs
- Ensure video format is supported (MP4, MOV)
- Verify HumanEgo models are downloaded

### Frontend can't connect to backend
- Check PYTHON_BACKEND_URL in .env.local
- Ensure Python backend is running on port 8000
- Verify CORS settings in Python backend

## Next Steps

1. **Customize Processing** - Modify `python-backend/humanego/processor.py` to integrate actual HumanEgo preprocessing
2. **Add Visualization** - Create components to display trajectories and tracking results
3. **Training Integration** - Connect processed data to model training pipeline
4. **Deploy** - Set up production deployment with Docker

## Resources

- [HumanEgo GitHub](https://github.com/TX-Leo/HumanEgo)
- [HumanEgo Paper](https://arxiv.org/abs/2605.24934)
- [HumanEgo Website](https://humanego-ai.github.io)
- [Dataset on HuggingFace](https://huggingface.co/datasets/Leo-TX/HumanEgo)
