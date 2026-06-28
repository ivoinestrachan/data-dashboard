# HumanEgo Processing Backend

Python FastAPI service for processing egocentric videos through the HumanEgo pipeline.

## Setup

1. **Install Python dependencies:**
```bash
cd python-backend
pip install -r requirements.txt
```

2. **Install HumanEgo:**
```bash
cd ~/HumanEgo
conda create -n humanego python=3.11 -y
conda activate humanego
bash setup.sh
```

3. **Configure environment:**
Create `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Running

```bash
# Activate HumanEgo conda environment
conda activate humanego

# Run the FastAPI server
cd python-backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### `POST /process`
Upload and process a video file
- Accepts: multipart/form-data with video file
- Returns: Processing job ID and status

### `GET /status/{video_id}`
Get processing status for a video
- Returns: Current status and results

### `POST /process/url`
Process a video from existing file path
- Accepts: JSON with video_id and video_path
- Returns: Processing job ID and status

## Integration with Next.js

The Next.js app can call these endpoints to:
1. Trigger video processing when uploaded
2. Poll for processing status
3. Retrieve and display results
