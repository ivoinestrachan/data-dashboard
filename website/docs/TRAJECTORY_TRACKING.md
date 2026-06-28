# Robot Trajectory Tracking System

## Overview

The RamArm platform now includes a comprehensive robot trajectory tracking system that transforms raw videos into structured robot training datasets. This system extracts 3D hand trajectories, keypoints, gripper states, and task phase annotations from video demonstrations.

## Architecture

### Frontend Components

1. **VideoAnnotator** (`/components/trajectory/VideoAnnotator.tsx`)
   - Real-time hand tracking with MediaPipe
   - Canvas overlay showing 21 hand landmarks
   - Task phase annotation interface
   - Video timeline controls
   - Export trajectory data to database

2. **TrajectoryVisualization** (`/components/trajectory/TrajectoryVisualization.tsx`)
   - 3D trajectory visualization with Three.js
   - Color-coded task phases (reach, grasp, transport, place, retract)
   - Direction arrows showing motion flow
   - Gripper state indicators
   - Interactive orbit controls

3. **GalleryGrid Integration**
   - "Track Hand Trajectory" button in video details panel
   - Embedded VideoAnnotator in side drawer
   - Save trajectories directly from UI

### Backend Infrastructure

1. **Database Schema** (`/supabase/migrations/004_add_robot_trajectory_schema.sql`)
   - `video_trajectories`: Main trajectory records
   - `trajectory_waypoints`: Individual waypoint data (normalized)
   - `trajectory_keypoints`: MediaPipe landmarks (21 per hand)
   - `video_annotations`: Manual task phase labels

2. **API Routes**
   - `POST /api/trajectories`: Save trajectory data
   - `GET /api/trajectories?video_id=X`: Fetch trajectories for a video
   - `GET /api/models/[id]/download`: Download dataset with trajectories

### Core Libraries

1. **HandTracker** (`/lib/mediapipe/hand-tracker.ts`)
   - MediaPipe hand detection (GPU-accelerated)
   - 21 keypoints per hand
   - Gripper state estimation
   - Orientation calculation (roll, pitch, yaw)

2. **TrajectoryProcessor** (`/lib/trajectory/trajectory-processor.ts`)
   - Waypoint extraction from hand tracking
   - Velocity and acceleration calculation
   - Trajectory smoothing (moving average)
   - Automatic task phase segmentation

## Features

### Real-Time Hand Tracking
- **21 Hand Landmarks**: Wrist, thumb, index, middle, ring, pinky (4 joints each)
- **3D World Coordinates**: Metric coordinates in camera space
- **Handedness Detection**: Separate left/right hand tracking
- **Confidence Scores**: Per-hand tracking quality

### Trajectory Data Extraction
- **Position**: (x, y, z) coordinates of hand center
- **Orientation**: Roll, pitch, yaw (Euler angles in radians)
- **Gripper State**: open, closed, partial (estimated from finger distance)
- **Gripper Width**: Normalized 0-1 (thumb-index distance)
- **Velocity**: Calculated from position changes
- **Acceleration**: Rate of velocity change
- **Task Phase**: Automatic segmentation (reach, grasp, transport, place, retract)

### Task Phase Segmentation
Automatically segments trajectories based on:
- **Reach**: High velocity, gripper open
- **Grasp**: Low velocity, gripper closing
- **Transport**: High velocity, gripper closed
- **Place**: Low velocity, gripper opening
- **Retract**: High velocity, gripper open (after place)

### Manual Annotations
Users can add:
- Action labels (pick, place, push, pull, rotate, slide, pour)
- Task phases (reach, grasp, transport, place, retract)
- Object labels (cup, box, tool, etc.)
- Free-form notes

## Database Schema

### video_trajectories
```sql
- id: UUID
- video_id: UUID (FK to videos)
- user_id: TEXT
- trajectory_name: TEXT
- task_phase: TEXT
- keypoints: JSONB (raw hand tracking results)
- poses: JSONB (optional pose estimation)
- waypoints: JSONB (processed trajectory waypoints)
- objects: JSONB (optional object detection)
- depth_maps: JSONB (optional depth estimation)
- total_frames: INTEGER
- duration: FLOAT
- fps: FLOAT
- processing_status: TEXT
- created_at, updated_at, processed_at: TIMESTAMPTZ
```

### trajectory_waypoints (normalized)
```sql
- id: UUID
- trajectory_id: UUID (FK)
- timestamp_ms: FLOAT
- frame_number: INTEGER
- position_x, position_y, position_z: FLOAT
- roll, pitch, yaw: FLOAT
- gripper_state: TEXT (open/closed/partial)
- gripper_width: FLOAT (0-1)
- position_confidence: FLOAT
- task_phase: TEXT
- action_label: TEXT
```

### trajectory_keypoints
```sql
- id: UUID
- trajectory_id: UUID (FK)
- timestamp_ms: FLOAT
- frame_number: INTEGER
- keypoint_type: TEXT (left_hand, right_hand, pose)
- landmarks: JSONB (array of {x, y, z, visibility})
- world_landmarks: JSONB (3D metric coordinates)
- label: TEXT (handedness)
- confidence: FLOAT
```

### video_annotations
```sql
- id: UUID
- video_id: UUID (FK)
- user_id: TEXT
- start_time, end_time: FLOAT (seconds)
- action_label: TEXT
- task_phase: TEXT
- object_label: TEXT
- notes: TEXT
- metadata: JSONB
```

## Usage Workflow

### 1. Upload Video
Upload a video showing a robot manipulation task to the gallery.

### 2. Track Trajectory
1. Click on video in gallery to open details panel
2. Click "Track Hand Trajectory" button
3. Video player appears with canvas overlay
4. MediaPipe loads and initializes hand tracking

### 3. Process Video
**Option A: Real-time Preview**
- Click play to see real-time hand tracking
- Green landmarks for left hand, blue for right hand
- Gripper state shown below wrist

**Option B: Full Processing**
- Click "Process Full Video"
- System extracts trajectories for entire video
- Progress shown with frame count

### 4. Add Annotations (Optional)
1. Click "Start Annotation" at any timestamp
2. Select action label (pick, place, etc.)
3. Select task phase (reach, grasp, etc.)
4. Add object label and notes
5. Save annotation

### 5. Export Trajectory
Click "Export Trajectory" to:
- Save to database
- Download JSON file with all data

### 6. Publish Model
After processing trajectories:
1. Publish video to marketplace
2. Dataset download includes trajectory data

## Dataset Export Format

When users download a published model, they receive:

### videos.json
```json
[
  {
    "id": "video-123",
    "title": "picking up cups",
    "video_url": "https://...",
    "size": 14620836,
    "trajectories": [
      {
        "id": "traj-456",
        "trajectory_name": "video-123_trajectory",
        "total_frames": 450,
        "duration": 15.0,
        "fps": 30,
        "waypoints": [
          {
            "timestamp_ms": 33.33,
            "frame_number": 1,
            "position_x": 0.45,
            "position_y": 0.32,
            "position_z": 0.18,
            "roll": 0.12,
            "pitch": -0.34,
            "yaw": 1.57,
            "gripper_state": "open",
            "gripper_width": 0.85,
            "task_phase": "reach",
            "action_label": "pick",
            "confidence": 0.95
          }
        ],
        "keypoints": [
          {
            "timestamp_ms": 33.33,
            "frame_number": 1,
            "keypoint_type": "right_hand",
            "landmarks": [
              {"x": 0.45, "y": 0.32, "z": 0.001},
              // ... 20 more landmarks
            ],
            "label": "Right",
            "confidence": 0.95
          }
        ],
        "annotations": [
          {
            "start_time": 0.0,
            "end_time": 3.5,
            "action_label": "pick",
            "task_phase": "reach",
            "object_label": "cup"
          }
        ]
      }
    ]
  }
]
```

### README.md
Comprehensive documentation including:
- Dataset statistics (videos, trajectories, waypoints)
- Data format specifications
- Usage examples (Python)
- Compatible ML frameworks
- Training workflow recommendations

## Robot Training Applications

### Imitation Learning
Use waypoints directly for:
- **Behavior Cloning (BC)**: Supervised learning from demonstrations
- **GAIL**: Generative adversarial imitation learning
- **DAgger**: Dataset aggregation for interactive learning

### Vision-Language-Action Models
Compatible with:
- **RT-1, RT-2**: Robotics Transformer from Google
- **OpenVLA**: Open-source vision-language-action models
- **Octo**: Generalist robot policy
- **RoboFlamingo**: Vision-language robot control

### Custom Training
Trajectory data can be used for:
- Motion planning verification
- Trajectory optimization
- Reinforcement learning rewards
- Human-robot collaboration studies

## Technical Details

### Coordinate Systems
- **Image Space**: Normalized 0-1 (MediaPipe output)
- **World Space**: Metric coordinates in meters (camera space)
- **Robot Space**: User must transform to robot coordinate frame

### MediaPipe Hand Landmarks
21 points per hand:
```
0: Wrist
1-4: Thumb (CMC, MCP, IP, TIP)
5-8: Index (MCP, PIP, DIP, TIP)
9-12: Middle (MCP, PIP, DIP, TIP)
13-16: Ring (MCP, PIP, DIP, TIP)
17-20: Pinky (MCP, PIP, DIP, TIP)
```

### Gripper State Estimation
Calculated from thumb-index distance:
- **Open**: distance > 0.7 (normalized)
- **Partial**: 0.3 < distance < 0.7
- **Closed**: distance < 0.3

### Orientation Calculation
Using palm plane (wrist, index MCP, pinky MCP):
1. Calculate palm normal vector (cross product)
2. Convert to Euler angles (roll, pitch, yaw)
3. Output in radians

### Trajectory Smoothing
Moving average filter with window size 5:
- Reduces noise from hand tracking jitter
- Preserves motion characteristics
- Configurable window size

## Performance Considerations

### Browser-Side Processing
- **MediaPipe**: Runs on GPU via WebGL
- **Frame Rate**: 30 FPS real-time tracking
- **Latency**: ~33ms per frame
- **Memory**: ~200MB for model + video buffer

### Database Storage
- **Waypoints**: ~100 bytes per waypoint
- **Keypoints**: ~500 bytes per frame (21 landmarks)
- **Typical Video**: 15 seconds = 450 frames = ~225 KB trajectory data

### Export Size
- **Video**: 14 MB (raw MP4)
- **Trajectory**: 225 KB (JSON)
- **Total**: ~14.2 MB per demonstration

## Future Enhancements

### Planned Features
1. **Depth Estimation**: Add 3D depth maps for better spatial understanding
2. **Object Detection**: Track objects being manipulated
3. **Pose Estimation**: Full body tracking for teleoperation
4. **Multi-Hand Coordination**: Bimanual manipulation tasks
5. **Force Estimation**: Infer contact forces from motion

### Advanced Processing
1. **Kalman Filtering**: Better trajectory smoothing
2. **IK Solving**: Convert to joint angles
3. **Collision Detection**: Verify safety
4. **Task Optimization**: Suggest trajectory improvements

## Migration Instructions

To add trajectory tracking to your database:

```sql
-- Run migration
psql -h your-host -d your-db -f supabase/migrations/004_add_robot_trajectory_schema.sql
```

Or use Supabase dashboard:
1. Go to SQL Editor
2. Paste contents of `004_add_robot_trajectory_schema.sql`
3. Run query

## Dependencies

```json
{
  "@mediapipe/tasks-vision": "latest",
  "@tensorflow/tfjs": "latest",
  "three": "latest",
  "@types/three": "latest"
}
```

## API Reference

### POST /api/trajectories
Save trajectory data to database.

**Request Body:**
```json
{
  "video_id": "abc-123",
  "trajectory_name": "pick_cup_demo",
  "total_frames": 450,
  "duration": 15.0,
  "fps": 30,
  "waypoints": [...],
  "keypoints": [...],
  "annotations": [...]
}
```

### GET /api/trajectories?video_id=X
Fetch all trajectories for a video.

**Response:**
```json
{
  "success": true,
  "trajectories": [...]
}
```

## Troubleshooting

### MediaPipe not loading
- Check CORS settings for CDN
- Verify WebGL is enabled in browser
- Try Chrome/Edge (best compatibility)

### Hand tracking inaccurate
- Ensure good lighting
- Keep hand in frame
- Avoid motion blur
- Check camera resolution

### Trajectory export fails
- Verify authentication
- Check database permissions
- Review browser console for errors

## Support

For issues or questions:
- GitHub Issues: [repo/issues]
- Email: support@ramarm.ai
- Discord: [community link]

---

**Version**: 1.0
**Last Updated**: June 2026
**Author**: RamArm Development Team
