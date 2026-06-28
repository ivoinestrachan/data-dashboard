# Setup: Automatic Video Processing (Like HumanEgo)

## Problem: CORS Error

The error you saw:
```
Failed to execute 'texImage2D' on 'WebGL2RenderingContext':
The video element contains cross-origin data, and may not be loaded.
```

This happens because MediaPipe can't access video pixels from Supabase Storage without proper CORS headers.

## Solution: 3 Steps

### Step 1: Fix Frontend (✅ Already Done!)

Added `crossOrigin="anonymous"` to the video element in VideoAnnotator.tsx

### Step 2: Configure Supabase Storage CORS

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
2. Click on "videos" bucket (or create it if it doesn't exist)
3. Click "Configuration" tab
4. Under "CORS Configuration", add:
   ```
   Allowed Origins: *
   Allowed Methods: GET, HEAD
   Allowed Headers: *
   Max Age: 3600
   ```
5. Make bucket **PUBLIC**
6. Click "Save"

**Option B: Using SQL Migration**

Run this in Supabase SQL Editor:

```sql
-- Copy from: supabase/migrations/005_enable_storage_cors.sql

UPDATE storage.buckets
SET public = true
WHERE id = 'videos';
```

### Step 3: Run Database Migration

Run this in Supabase SQL Editor:

```sql
-- Copy from: supabase/migrations/004_add_robot_trajectory_schema.sql
-- This creates the tables for storing trajectory data

-- Tables created:
-- - video_trajectories
-- - trajectory_waypoints
-- - trajectory_keypoints
-- - video_annotations
```

## How to Use After Setup

### Manual Processing (Current)
1. Upload video to gallery
2. Click video → "Track Hand Trajectory"
3. Click "Process Full Video"
4. Wait for processing
5. Click "Export Trajectory"

### Automatic Processing (HumanEgo Style)

Use the automatic processor in browser:

```typescript
import { AutoTrajectoryProcessor } from '@/lib/trajectory/auto-processor'

const processor = new AutoTrajectoryProcessor()

// Process a video automatically
const result = await processor.processVideo({
  videoUrl: 'https://your-supabase.com/storage/v1/object/public/videos/example.mp4',
  videoId: 'video-123',
  fps: 30,
  skipFrames: 2, // Process every 2nd frame for speed
  onProgress: (progress) => {
    console.log(`Progress: ${progress.toFixed(1)}%`)
  }
})

// Save to database
await processor.saveToDatabase(result, userId)

console.log(`✅ Processed ${result.statistics.totalFrames} frames`)
console.log(`   Trajectories: ${result.trajectories.length}`)
console.log(`   Waypoints: ${result.waypoints.length}`)
```

## Verification

After completing setup, verify everything works:

### 1. Check CORS is working
```bash
# Open browser console and run:
fetch('YOUR_VIDEO_URL', { mode: 'cors' })
  .then(r => console.log('✅ CORS working:', r.ok))
  .catch(e => console.error('❌ CORS error:', e))
```

### 2. Check tables exist
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('video_trajectories', 'trajectory_waypoints');
```

Should return 2 rows.

### 3. Test video processing
1. Go to gallery: http://localhost:3000/dashboard/gallery
2. Click on a video
3. Click "Track Hand Trajectory"
4. Click Play
5. You should see green/blue hand landmarks appear!

## Troubleshooting

### Still Getting CORS Error?

**Check 1: Is bucket public?**
```sql
SELECT id, public FROM storage.buckets WHERE id = 'videos';
```
Should show `public = true`

**Check 2: Is video URL accessible?**
- Copy video URL from browser
- Paste in new tab
- Should download/play the video

**Check 3: Browser cache**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear browser cache

### MediaPipe Not Initializing?

**Check browser console for:**
```
✅ MediaPipe Hand Tracker initialized  // Good!
Failed to initialize MediaPipe...       // Bad
```

**Common fixes:**
- Use Chrome or Edge (best WebGL support)
- Check internet connection (MediaPipe loads from CDN)
- Disable ad blockers
- Try incognito mode

### Video Won't Play?

Check video codec:
```bash
ffprobe your-video.mp4 2>&1 | grep Video
```

Should show: `Video: h264`

If not, convert it:
```bash
ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mp4
```

## Comparison: HumanEgo vs RamArm

| Feature | HumanEgo | RamArm (Your System) |
|---------|----------|---------------------|
| **Input** | Egocentric video | Any first-person video |
| **Detection** | Whole body pose | Hand tracking (21 keypoints) |
| **Outputs** | Body pose, gaze, depth | Hand trajectory, gripper state, task phases |
| **Processing** | Offline (Python) | Real-time (Browser + MediaPipe) |
| **Use Case** | AR/VR research | Robot training data |
| **Dataset** | Academic dataset | Production ML training |

## What Makes RamArm Better for Robots?

1. **Hand Focus**: Specifically tracks hands (robot end-effector)
2. **Gripper States**: Automatically estimates open/closed
3. **Task Segmentation**: Auto-labels reach, grasp, transport, place, retract
4. **3D Coordinates**: World coordinates in meters (not just pixel space)
5. **Export Ready**: Direct export to BC, GAIL, RT-1, OpenVLA formats

## Next Steps

### Production Deployment

For automatic processing at scale (like HumanEgo), you'd want:

1. **Background Jobs**: Use Inngest, BullMQ, or Trigger.dev
2. **Video Pipeline**:
   - Upload triggers automatic processing
   - Queue job for each video
   - Process in worker (can use same browser-based code)
3. **Progress Tracking**: WebSocket updates to frontend
4. **Batch Processing**: Process entire dataset overnight

Example with Inngest:
```typescript
inngest.createFunction(
  { id: "process-video" },
  { event: "video/uploaded" },
  async ({ event, step }) => {
    const processor = new AutoTrajectoryProcessor()

    const result = await step.run("process-video", async () => {
      return processor.processVideo({
        videoUrl: event.data.url,
        videoId: event.data.id,
        fps: 30
      })
    })

    await step.run("save-to-db", async () => {
      return processor.saveToDatabase(result, event.user.id)
    })
  }
)
```

## Support

If you're still getting CORS errors after following this guide:
1. Share your Supabase project URL
2. Share the video URL that's failing
3. Share browser console errors

---

**Last Updated**: June 2026
**Status**: Production Ready ✅
