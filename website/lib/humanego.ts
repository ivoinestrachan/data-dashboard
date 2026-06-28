/**
 * HumanEgo Integration Client
 * Handles communication with the Python processing backend
 */

export interface ProcessingJob {
  video_id: string
  status: "processing" | "completed" | "failed" | "not_found"
  task_name?: string
  processed_at?: string
  preprocessing?: {
    hand_tracking: {
      frames_processed: number
      hand_poses: any[]
    }
    object_detection: {
      objects_detected: any[]
      segmentation_masks: any[]
    }
    point_tracking: {
      tracked_points: any[]
    }
  }
  trajectories?: {
    hand_trajectory: any[]
    object_trajectory: any[]
    interaction_points: any[]
  }
  error?: string
}

export class HumanEgoClient {
  /**
   * Start processing a video through HumanEgo pipeline
   */
  static async processVideo(
    videoId: string,
    videoPath: string,
    taskName?: string
  ): Promise<ProcessingJob> {
    const response = await fetch("/api/humanego/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_id: videoId,
        video_path: videoPath,
        task_name: taskName,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to start processing")
    }

    return response.json()
  }

  /**
   * Get processing status for a video
   */
  static async getStatus(videoId: string): Promise<ProcessingJob> {
    const response = await fetch(`/api/humanego/status/${videoId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to get status")
    }

    return response.json()
  }

  /**
   * Poll for processing completion
   */
  static async waitForCompletion(
    videoId: string,
    onProgress?: (status: ProcessingJob) => void,
    maxAttempts: number = 60,
    interval: number = 5000
  ): Promise<ProcessingJob> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getStatus(videoId)

      if (onProgress) {
        onProgress(status)
      }

      if (status.status === "completed" || status.status === "failed") {
        return status
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, interval))
    }

    throw new Error("Processing timeout")
  }
}
