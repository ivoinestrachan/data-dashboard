import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getServiceRoleClient } from "@/lib/supabase"
import JSZip from "jszip"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }

    const supabase = getServiceRoleClient()
    const { id: modelId } = await params

    // Fetch the published model
    const { data: model, error: modelError } = await supabase
      .from('published_models')
      .select('*, videos(*)')
      .eq('id', modelId)
      .single()

    if (modelError || !model) {
      return NextResponse.json(
        { error: "Model not found" },
        { status: 404 }
      )
    }

    // Get all videos in the same category
    const { data: categoryVideos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('metadata->>category', model.category || model.specialty.split(' ')[0])

    if (videosError) {
      console.error("Error fetching videos:", videosError)
    }

    // Create dataset package metadata
    const datasetMetadata = {
      model_name: model.name,
      company: model.company,
      industry: model.industry,
      specialty: model.specialty,
      category: model.category || model.specialty.split(' ')[0],
      total_videos: categoryVideos?.length || 0,
      total_trajectories: model.specs.trajectories,
      accuracy: model.specs.accuracy,
      size: model.specs.size,
      gear: model.specs.gear,
      created_at: model.created_at,
      video_format: "MP4",
      resolution: "640x480 or higher",
      frame_rate: "30fps minimum",
      recommended_use: "Robot trajectory training and motion replication",
      download_timestamp: new Date().toISOString(),
      downloaded_by: session.user?.email || session.user?.id
    }

    // Fetch trajectory data for all videos in this category
    const { data: trajectories } = await supabase
      .from('video_trajectories')
      .select(`
        *,
        waypoints:trajectory_waypoints(*),
        keypoints:trajectory_keypoints(*),
        annotations:video_annotations(*)
      `)
      .in('video_id', categoryVideos?.map(v => v.id) || [])

    // Create download URLs for videos with trajectory data
    const videoDownloadInfo = categoryVideos?.map(video => {
      const videoTrajectories = trajectories?.filter(t => t.video_id === video.id) || []

      return {
        id: video.id,
        title: video.title,
        filename: video.filename,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        size: video.size,
        recorded_at: video.recorded_at,
        metadata: video.metadata,
        trajectories: videoTrajectories.map(traj => ({
          id: traj.id,
          trajectory_name: traj.trajectory_name,
          total_frames: traj.total_frames,
          duration: traj.duration,
          fps: traj.fps,
          processing_status: traj.processing_status,
          waypoints: traj.waypoints || [],
          keypoints: traj.keypoints || [],
          annotations: traj.annotations || []
        }))
      }
    }) || []

    // Calculate trajectory statistics
    const totalTrajectories = trajectories?.length || 0
    const totalWaypoints = trajectories?.reduce((sum, t) => sum + (t.waypoints?.length || 0), 0) || 0
    const totalKeypoints = trajectories?.reduce((sum, t) => sum + (t.keypoints?.length || 0), 0) || 0

    // Create README content
    const readme = `# ${model.name} - Robot Training Dataset

## Dataset Information
- **Company**: ${model.company}
- **Industry**: ${model.industry}
- **Specialty**: ${model.specialty}
- **Category**: ${model.category || 'General'}
- **Total Videos**: ${categoryVideos?.length || 0}
- **Total Trajectories**: ${totalTrajectories}
- **Total Waypoints**: ${totalWaypoints}
- **Total Keypoints**: ${totalKeypoints}
- **Accuracy**: ${model.specs.accuracy}
- **Recording Device**: ${model.specs.gear}

## Dataset Contents

This dataset includes:
1. **Videos**: Raw video files showing robot motion demonstrations
2. **Trajectories**: Extracted 3D hand/end-effector trajectories with temporal data
3. **Waypoints**: Individual trajectory points with position, orientation, and gripper state
4. **Keypoints**: MediaPipe hand landmarks (21 points per hand) for each frame
5. **Annotations**: Task phase labels (reach, grasp, transport, place, retract)

## Video Specifications
- **Format**: MP4 (H.264)
- **Resolution**: 640x480 minimum
- **Frame Rate**: 30fps recommended
- **Audio**: AAC 128kbps

## Trajectory Data Format

Each trajectory includes:
- **Waypoints**: Position (x, y, z), orientation (roll, pitch, yaw), gripper state
- **Keypoints**: 21 hand landmarks with 3D coordinates and visibility scores
- **Annotations**: Task segmentation with start/end times and action labels

### Waypoint Fields
\`\`\`json
{
  "timestamp_ms": 1234.5,
  "frame_number": 37,
  "position_x": 0.45,
  "position_y": 0.32,
  "position_z": 0.18,
  "roll": 0.12,
  "pitch": -0.34,
  "yaw": 1.57,
  "gripper_state": "closed",
  "gripper_width": 0.25,
  "task_phase": "transport",
  "action_label": "pick",
  "position_confidence": 0.95
}
\`\`\`

## Usage for Robot Training

### Option 1: Use Pre-extracted Trajectories
\`\`\`python
import json

# Load trajectory data
with open('videos.json', 'r') as f:
    data = json.load(f)

for video in data:
    for trajectory in video['trajectories']:
        waypoints = trajectory['waypoints']
        # Use waypoints directly for imitation learning
        # Each waypoint has position, orientation, gripper state
\`\`\`

### Option 2: Process Videos with Your Own Pipeline
1. Download videos from the provided URLs
2. Extract frames at 30fps
3. Apply your own computer vision (MediaPipe, pose estimation, etc.)
4. Train your model using your preferred framework

### Training Workflow
1. **Load trajectory data** from videos.json
2. **Normalize coordinates** to your robot's workspace
3. **Split into train/val/test** sets
4. **Train imitation learning model** (BC, GAIL, RT-1, etc.)
5. **Validate on test trajectories**
6. **Deploy to real robot**

### File Structure
\`\`\`
dataset/
├── README.md (this file)
├── metadata.json (dataset information)
├── videos.json (videos with embedded trajectory data)
└── videos/ (download videos separately from URLs in videos.json)
\`\`\`

## Data Format
- **Coordinates**: Normalized 0-1 range (image space)
- **Orientation**: Euler angles in radians
- **Timestamps**: Milliseconds from video start
- **Gripper Width**: Normalized 0-1 (0 = closed, 1 = open)

## Compatible Frameworks
- **Imitation Learning**: Behavior Cloning (BC), GAIL, DAgger
- **Robot Learning**: RT-1, RT-2, OpenVLA, Octo
- **Vision-Language-Action**: RoboFlamingo, PaLM-E
- **Custom PyTorch/JAX**: Use waypoints as supervision signal

## Citation
If you use this dataset, please cite:
\`\`\`
${model.name} Robot Training Dataset
${model.company}
Downloaded from: RamArm Training Platform
Date: ${new Date().toISOString().split('T')[0]}
Videos: ${categoryVideos?.length || 0}
Trajectories: ${totalTrajectories}
Waypoints: ${totalWaypoints}
\`\`\`

## License
Please check with ${model.company} for licensing information.

## Support
For questions about using this dataset for robot training:
- Check the RamArm documentation
- Join the community Discord
- Email: support@ramarm.ai

---
Downloaded on: ${new Date().toISOString()}
By: ${session.user?.email || 'User'}
`

    // Return package metadata with download instructions
    return NextResponse.json({
      success: true,
      dataset: {
        metadata: datasetMetadata,
        readme: readme,
        videos: videoDownloadInfo,
        download_instructions: {
          step_1: "Download this metadata package",
          step_2: "Download individual videos from the video_urls provided",
          step_3: "Organize files according to the README structure",
          note: "Due to file size, videos must be downloaded individually from their URLs"
        }
      }
    })
  } catch (error: any) {
    console.error("Error creating dataset package:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create dataset package"
      },
      { status: 500 }
    )
  }
}
