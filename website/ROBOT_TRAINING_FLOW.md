# Robot Training Data Pipeline

## Overview
This system allows **anyone** to upload egocentric videos (from Ray-Ban Meta glasses or manual uploads) which are then processed into trajectory datasets for training robots.

## Complete Flow

### 1. Video Upload (Public Access)
**Who:** Any authenticated user
**Where:** `/dashboard/gallery` - Upload Zone
**What happens:**
1. User uploads video (drag-drop or file select)
2. System converts video to MP4 format using FFmpeg
3. Generates thumbnail at 1-second mark
4. Uploads to Supabase Storage bucket `videos/`
5. Creates database record in `videos` table with metadata

**API:** `POST /api/upload`
- Accepts: FormData with video file, title, description, metadata
- Returns: Video ID and public URLs
- Storage: Supabase Storage + PostgreSQL

**File:** `/app/api/upload/route.ts`

---

### 2. Video Processing (HumanEgo Pipeline)
**Who:** System (triggered manually or automatically)
**Where:** Backend Python service
**What happens:**
1. Video is sent to Python backend for HumanEgo processing
2. Preprocessing:
   - Hand pose tracking (keypoints)
   - Object detection & segmentation
   - Point tracking across frames
3. Trajectory extraction:
   - 6DoF hand trajectory
   - 6DoF object trajectory
   - Interaction points
4. Dataset generation:
   - JSON format with timestamps
   - Visualization data for UI
   - Exportable format for robot training

**API:** `POST /api/humanego/process`
- Accepts: `{ video_id, video_path, task_name }`
- Triggers: Python backend processing
- Returns: Processing job ID

**Files:**
- `/app/api/humanego/process/route.ts` (Next.js API)
- `/python-backend/humanego/processor.py` (Python processor)
- `/python-backend/main.py` (FastAPI server)

---

### 3. Dataset Storage & Visualization
**Where:** `/dashboard/humanego` - Multi-panel view
**What's shown:**
- 4-panel video grid with tracking overlays
- Real-time trajectory visualization (canvas-based)
- Hand/object paths in 3D space
- Statistics: frames, duration, avg speed, smoothness

**Components:**
- `MultiPanelView` - 4 video panels + trajectory graph
- `VideoVisualization` - Video player with HumanEgo overlays
- `TrajectoryVisualization` - Canvas rendering of motion paths

---

### 4. Marketplace & Distribution
**Where:** `/dashboard/marketplace`
**What:**
- Browse trained trajectory datasets
- Filter by task category (Pick & Place, Welding, Packaging, etc.)
- Download/purchase datasets with credits system
- Publish your own processed datasets

**Features:**
- Free and paid datasets
- Model versioning
- Accuracy metrics
- Size and sample count info

---

## Data Flow Diagram

```
User Upload → FFmpeg Conversion → Supabase Storage
                                        ↓
                                  Videos Table
                                        ↓
                              HumanEgo Processing
                                        ↓
                     ┌──────────────────┴────────────────┐
                     ↓                                    ↓
            Trajectory Dataset                   Visualization Data
                     ↓                                    ↓
              Marketplace                         Multi-Panel View
```

---

## Technical Stack

### Frontend
- **Next.js 16** with Turbopack
- **React** with TypeScript
- **Framer Motion** for animations
- **Tailwind CSS** for styling
- **Zustand** for state management

### Backend
- **Next.js API Routes** (Node.js)
- **FastAPI** (Python) for HumanEgo processing
- **FFmpeg** for video conversion
- **Supabase** for storage and database

### Storage
- **Supabase Storage** - Videos and thumbnails
- **PostgreSQL** - Video metadata and datasets
- **File System** - Temporary processing workspace

---

## Database Schema

### `videos` table
```sql
- id (uuid, primary key)
- title (text)
- description (text, nullable)
- filename (text)
- storage_path (text)
- video_url (text)
- thumbnail_url (text, nullable)
- source (text) - 'rayban' | 'uploaded'
- status (text) - 'pending' | 'processing' | 'analyzed' | 'error'
- duration (integer) - seconds
- size (bigint) - bytes
- mime_type (text)
- category (text, nullable) - task category
- recorded_at (timestamp)
- uploaded_at (timestamp)
- metadata (jsonb, nullable)
- humanego_data (jsonb, nullable) - processed trajectories
```

---

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Python Backend
PYTHON_BACKEND_URL=http://localhost:8000

# FFmpeg paths (macOS example)
FFMPEG_PATH=/usr/local/bin/ffmpeg
FFPROBE_PATH=/opt/homebrew/bin/ffprobe
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
pip install -r python-backend/requirements.txt
```

### 2. Setup Supabase
```bash
# Run migrations
npm run db:migrate

# Create storage buckets
- Create 'videos' bucket (public)
- Enable RLS policies for authenticated users
```

### 3. Start Services
```bash
# Terminal 1: Next.js Frontend
npm run dev

# Terminal 2: Python Backend
cd python-backend
python main.py
```

---

## API Endpoints

### Video Management
- `POST /api/upload` - Upload new video
- `GET /api/videos` - List all videos
- `GET /api/videos/[id]` - Get video details
- `PATCH /api/videos/[id]` - Update video metadata
- `DELETE /api/videos/[id]` - Delete video

### HumanEgo Processing
- `POST /api/humanego/process` - Start processing
- `GET /api/humanego/status/[id]` - Check processing status

### Python Backend (FastAPI)
- `POST /process/url` - Process video from URL
- `GET /status/{video_id}` - Get processing status
- `GET /results/{video_id}` - Get trajectory results

---

## Features

### ✅ Implemented
- Video upload with drag-drop
- FFmpeg video conversion to MP4
- Thumbnail generation
- Supabase storage integration
- Multi-panel video visualization
- Trajectory canvas visualization
- Marketplace UI
- Credit system
- Task categorization
- HumanEgo processing infrastructure

### 🚧 In Progress
- Full HumanEgo pipeline integration
- Real trajectory extraction
- Dataset export formats
- Automated processing triggers
- Model training integration

### 📋 Planned
- Batch video processing
- Real-time progress tracking
- Dataset versioning
- API for robot systems
- Training metrics dashboard

---

## Security & Access

### Authentication
- NextAuth.js with Google/Facebook OAuth
- Session-based authentication
- Protected API routes

### Authorization
- All authenticated users can upload videos
- Public marketplace for browsing
- Credit system for premium datasets
- RLS policies on Supabase for data isolation

### File Upload Security
- File type validation (video only)
- Size limits
- Virus scanning (TODO)
- Automatic conversion to safe format (MP4)

---

## Troubleshooting

### FFmpeg Not Found
```bash
# macOS
brew install ffmpeg

# Update paths in /app/api/upload/route.ts
```

### Python Backend Connection
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check environment variable
echo $PYTHON_BACKEND_URL
```

### Supabase Storage Issues
1. Verify bucket exists and is public
2. Check RLS policies allow authenticated inserts
3. Verify service role key has correct permissions

---

## Contributing

### Adding New Task Categories
1. Update `CATEGORIES` in `/components/layout/NavPanel.tsx`
2. Add corresponding icon in marketplace
3. Update database enum if using strict types

### Adding New Processing Features
1. Extend `HumanEgoProcessor` in Python backend
2. Update API contract in `/app/api/humanego/process/route.ts`
3. Add visualization in `TrajectoryVisualization.tsx`

---

## Performance Considerations

- Video conversion happens synchronously (may take time for large files)
- Consider background job queue for large-scale processing
- Thumbnail generation cached in storage
- Trajectory data compressed in database JSONB
- Frontend uses React memo and useMemo for expensive renders

---

## Dataset Format

### Output Structure
```json
{
  "video_id": "uuid",
  "task_name": "Pick & Place",
  "trajectories": {
    "hand": [
      {
        "timestamp": 0.033,
        "position": [x, y, z],
        "rotation": [qx, qy, qz, qw],
        "joints": [...],
        "confidence": 0.95
      }
    ],
    "objects": [
      {
        "object_id": "obj_1",
        "positions": [...],
        "rotations": [...]
      }
    ]
  },
  "metadata": {
    "fps": 30,
    "duration": 45.2,
    "frame_count": 1356
  }
}
```

This format is compatible with standard robot learning frameworks.
