-- Migration: Add robot trajectory tracking tables
-- This enables storing robot training data extracted from videos

-- Table for storing trajectory data from videos
CREATE TABLE IF NOT EXISTS video_trajectories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,

  -- Trajectory metadata
  trajectory_name TEXT NOT NULL,
  task_phase TEXT, -- 'reach', 'grasp', 'transport', 'place', 'retract'

  -- Keypoints and poses (stored as JSONB for flexibility)
  keypoints JSONB NOT NULL, -- [{timestamp, hand_landmarks, world_landmarks}]
  poses JSONB, -- [{timestamp, pose_landmarks, visibility}]

  -- 3D trajectory waypoints
  waypoints JSONB NOT NULL, -- [{timestamp, position: {x,y,z}, orientation: {roll,pitch,yaw}, gripper_state}]

  -- Object detection results
  objects JSONB, -- [{timestamp, label, bbox, confidence}]

  -- Depth maps (references to stored depth map files)
  depth_maps JSONB, -- [{timestamp, depth_map_url}]

  -- Statistics
  total_frames INTEGER NOT NULL,
  duration FLOAT NOT NULL, -- seconds
  fps FLOAT NOT NULL,

  -- Processing status
  processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Table for storing individual waypoints (normalized for efficient queries)
CREATE TABLE IF NOT EXISTS trajectory_waypoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trajectory_id UUID NOT NULL REFERENCES video_trajectories(id) ON DELETE CASCADE,

  -- Temporal information
  timestamp_ms FLOAT NOT NULL, -- milliseconds from video start
  frame_number INTEGER NOT NULL,

  -- 3D position (end-effector or hand center)
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  position_z FLOAT NOT NULL,

  -- Orientation (Euler angles in radians)
  roll FLOAT,
  pitch FLOAT,
  yaw FLOAT,

  -- Gripper state
  gripper_state TEXT, -- 'open', 'closed', 'partial'
  gripper_width FLOAT, -- normalized 0-1

  -- Confidence scores
  position_confidence FLOAT,
  orientation_confidence FLOAT,

  -- Task segmentation
  task_phase TEXT, -- 'reach', 'grasp', 'transport', 'place', 'retract'
  action_label TEXT, -- 'pick', 'place', 'push', 'pull', etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for storing hand/pose keypoints (21 landmarks per hand)
CREATE TABLE IF NOT EXISTS trajectory_keypoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trajectory_id UUID NOT NULL REFERENCES video_trajectories(id) ON DELETE CASCADE,

  -- Temporal information
  timestamp_ms FLOAT NOT NULL,
  frame_number INTEGER NOT NULL,

  -- Keypoint type
  keypoint_type TEXT NOT NULL, -- 'left_hand', 'right_hand', 'pose', 'object'

  -- Landmarks (JSONB array of {x, y, z, visibility})
  landmarks JSONB NOT NULL,

  -- World coordinates (3D in meters)
  world_landmarks JSONB,

  -- Handedness or pose type
  label TEXT, -- 'Left', 'Right', 'Body', etc.
  confidence FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for video annotations (manual labels)
CREATE TABLE IF NOT EXISTS video_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,

  -- Annotation data
  start_time FLOAT NOT NULL, -- seconds
  end_time FLOAT NOT NULL,

  -- Labels
  action_label TEXT NOT NULL, -- 'pick', 'place', 'push', etc.
  task_phase TEXT, -- 'reach', 'grasp', 'transport', 'place', 'retract'
  object_label TEXT, -- 'cup', 'box', 'tool', etc.

  -- Additional metadata
  notes TEXT,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_trajectories_video_id ON video_trajectories(video_id);
CREATE INDEX IF NOT EXISTS idx_video_trajectories_user_id ON video_trajectories(user_id);
CREATE INDEX IF NOT EXISTS idx_video_trajectories_status ON video_trajectories(processing_status);

CREATE INDEX IF NOT EXISTS idx_trajectory_waypoints_trajectory_id ON trajectory_waypoints(trajectory_id);
CREATE INDEX IF NOT EXISTS idx_trajectory_waypoints_timestamp ON trajectory_waypoints(timestamp_ms);
CREATE INDEX IF NOT EXISTS idx_trajectory_waypoints_task_phase ON trajectory_waypoints(task_phase);

CREATE INDEX IF NOT EXISTS idx_trajectory_keypoints_trajectory_id ON trajectory_keypoints(trajectory_id);
CREATE INDEX IF NOT EXISTS idx_trajectory_keypoints_timestamp ON trajectory_keypoints(timestamp_ms);
CREATE INDEX IF NOT EXISTS idx_trajectory_keypoints_type ON trajectory_keypoints(keypoint_type);

CREATE INDEX IF NOT EXISTS idx_video_annotations_video_id ON video_annotations(video_id);
CREATE INDEX IF NOT EXISTS idx_video_annotations_user_id ON video_annotations(user_id);

-- Enable Row Level Security
ALTER TABLE video_trajectories ENABLE ROW LEVEL SECURITY;
ALTER TABLE trajectory_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE trajectory_keypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view their own trajectories"
  ON video_trajectories FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own trajectories"
  ON video_trajectories FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own trajectories"
  ON video_trajectories FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own trajectories"
  ON video_trajectories FOR DELETE
  USING (auth.uid()::text = user_id);

-- Waypoints inherit permissions from parent trajectory
CREATE POLICY "Users can view waypoints from their trajectories"
  ON trajectory_waypoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_trajectories
      WHERE video_trajectories.id = trajectory_waypoints.trajectory_id
      AND video_trajectories.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert waypoints to their trajectories"
  ON trajectory_waypoints FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_trajectories
      WHERE video_trajectories.id = trajectory_waypoints.trajectory_id
      AND video_trajectories.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete waypoints from their trajectories"
  ON trajectory_waypoints FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM video_trajectories
      WHERE video_trajectories.id = trajectory_waypoints.trajectory_id
      AND video_trajectories.user_id = auth.uid()::text
    )
  );

-- Keypoints inherit permissions from parent trajectory
CREATE POLICY "Users can view keypoints from their trajectories"
  ON trajectory_keypoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_trajectories
      WHERE video_trajectories.id = trajectory_keypoints.trajectory_id
      AND video_trajectories.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert keypoints to their trajectories"
  ON trajectory_keypoints FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM video_trajectories
      WHERE video_trajectories.id = trajectory_keypoints.trajectory_id
      AND video_trajectories.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete keypoints from their trajectories"
  ON trajectory_keypoints FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM video_trajectories
      WHERE video_trajectories.id = trajectory_keypoints.trajectory_id
      AND video_trajectories.user_id = auth.uid()::text
    )
  );

-- Annotations RLS
CREATE POLICY "Users can view their own annotations"
  ON video_annotations FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own annotations"
  ON video_annotations FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own annotations"
  ON video_annotations FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own annotations"
  ON video_annotations FOR DELETE
  USING (auth.uid()::text = user_id);
