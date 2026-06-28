/**
 * Automatic trajectory processing pipeline
 * Inspired by HumanEgo: https://github.com/TX-Leo/HumanEgo
 *
 * Automatically processes uploaded videos to extract:
 * - Hand trajectories
 * - Keypoints (21 landmarks per hand)
 * - Task phase segmentation
 * - Gripper states
 */

import { HandTracker } from '@/lib/mediapipe/hand-tracker'
import { TrajectoryProcessor } from '@/lib/trajectory/trajectory-processor'

export interface AutoProcessConfig {
  videoUrl: string
  videoId: string
  fps?: number
  skipFrames?: number // Process every Nth frame for speed
  onProgress?: (progress: number) => void
}

export interface ProcessedVideoData {
  videoId: string
  trajectories: any[]
  waypoints: any[]
  keypoints: any[]
  statistics: {
    totalFrames: number
    duration: number
    avgVelocity: number
    smoothnessScore: number
  }
}

export class AutoTrajectoryProcessor {
  private handTracker: HandTracker
  private isInitialized = false

  constructor() {
    this.handTracker = new HandTracker()
  }

  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await this.handTracker.initialize()
      this.isInitialized = true
    }
  }

  /**
   * Automatically process a video file (like HumanEgo pipeline)
   */
  async processVideo(config: AutoProcessConfig): Promise<ProcessedVideoData> {
    await this.initialize()

    const {
      videoUrl,
      videoId,
      fps = 30,
      skipFrames = 1, // Process every frame by default
      onProgress
    } = config

    // Load video
    const video = await this.loadVideo(videoUrl)
    const duration = video.duration
    const totalFrames = Math.floor(duration * fps)

    console.log(`🎬 Processing video: ${videoId}`)
    console.log(`   Duration: ${duration.toFixed(2)}s`)
    console.log(`   Frames: ${totalFrames}`)
    console.log(`   FPS: ${fps}`)

    const trackingResults = []
    let processedFrames = 0

    // Process video frame by frame
    for (let frame = 0; frame < totalFrames; frame += skipFrames) {
      const timeSeconds = frame / fps
      video.currentTime = timeSeconds

      // Wait for frame to load
      await new Promise((resolve) => {
        video.onseeked = resolve
      })

      // Detect hands in this frame
      try {
        const timestamp = performance.now()
        const result = await this.handTracker.detectHands(video, timestamp, frame)

        if (result.hands.length > 0) {
          trackingResults.push(result)
        }

        processedFrames++

        // Report progress
        if (onProgress && processedFrames % 30 === 0) {
          const progress = (processedFrames / (totalFrames / skipFrames)) * 100
          onProgress(progress)
        }
      } catch (error) {
        console.warn(`Frame ${frame} failed:`, error)
      }
    }

    console.log(`✅ Processed ${processedFrames} frames`)
    console.log(`   Detected hands in ${trackingResults.length} frames`)

    // Process trajectory data
    const processed = TrajectoryProcessor.processHandTracking(trackingResults, 'Right')

    // Convert to database format
    const waypoints = processed.waypoints.map((wp) => ({
      timestamp_ms: wp.timestamp_ms,
      frame_number: wp.frame_number,
      position_x: wp.position_x,
      position_y: wp.position_y,
      position_z: wp.position_z,
      roll: wp.roll,
      pitch: wp.pitch,
      yaw: wp.yaw,
      gripper_state: wp.gripper_state,
      gripper_width: wp.gripper_width,
      task_phase: wp.task_phase,
      action_label: wp.action_label,
      position_confidence: wp.confidence
    }))

    const keypoints = trackingResults.flatMap((result) =>
      result.hands.map((hand) => ({
        timestamp_ms: result.timestamp,
        frame_number: result.frameNumber,
        keypoint_type: hand.handedness === 'Left' ? 'left_hand' : 'right_hand',
        landmarks: hand.landmarks,
        world_landmarks: hand.worldLandmarks,
        label: hand.handedness,
        confidence: hand.confidence
      }))
    )

    return {
      videoId,
      trajectories: [
        {
          video_id: videoId,
          trajectory_name: `${videoId}_auto`,
          task_phase: null,
          total_frames: processedFrames,
          duration,
          fps,
          processing_status: 'completed',
          waypoints: processed.waypoints,
          keypoints: trackingResults
        }
      ],
      waypoints,
      keypoints,
      statistics: {
        totalFrames: processedFrames,
        duration,
        avgVelocity: processed.statistics.average_velocity,
        smoothnessScore: processed.statistics.smoothness_score
      }
    }
  }

  /**
   * Load video element from URL
   */
  private async loadVideo(url: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.src = url
      video.preload = 'metadata'
      video.muted = true

      video.onloadedmetadata = () => {
        resolve(video)
      }

      video.onerror = () => {
        reject(new Error(`Failed to load video: ${url}`))
      }
    })
  }

  /**
   * Save processed data to database
   */
  async saveToDatabase(data: ProcessedVideoData, userId: string): Promise<void> {
    const response = await fetch('/api/trajectories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: data.videoId,
        trajectory_name: `${data.videoId}_auto`,
        total_frames: data.statistics.totalFrames,
        duration: data.statistics.duration,
        fps: 30,
        waypoints: data.waypoints,
        keypoints: data.keypoints
      })
    })

    if (!response.ok) {
      throw new Error('Failed to save trajectory data')
    }

    console.log('✅ Trajectory data saved to database')
  }

  close(): void {
    this.handTracker.close()
  }
}
