import { HandTrackingResult } from '@/lib/mediapipe/hand-tracker'

export interface ProcessedTrajectory {
  waypoints: Waypoint[]
  statistics: TrajectoryStatistics
  taskSegments: TaskSegment[]
}

export interface Waypoint {
  timestamp_ms: number
  frame_number: number
  position_x: number
  position_y: number
  position_z: number
  roll: number
  pitch: number
  yaw: number
  gripper_state: 'open' | 'closed' | 'partial'
  gripper_width: number
  velocity?: number
  acceleration?: number
  task_phase?: string
  action_label?: string
  confidence: number
}

export interface TrajectoryStatistics {
  total_waypoints: number
  duration_seconds: number
  average_velocity: number
  max_velocity: number
  total_distance: number
  smoothness_score: number
}

export interface TaskSegment {
  start_frame: number
  end_frame: number
  start_time: number
  end_time: number
  phase: 'reach' | 'grasp' | 'transport' | 'place' | 'retract'
  confidence: number
}

export class TrajectoryProcessor {
  /**
   * Process hand tracking results into a structured trajectory
   */
  static processHandTracking(
    results: HandTrackingResult[],
    handedness: 'Left' | 'Right' = 'Right'
  ): ProcessedTrajectory {
    // Filter for the selected hand
    const filteredResults = results.map((result) => ({
      ...result,
      hands: result.hands.filter((hand) => hand.handedness === handedness)
    })).filter((result) => result.hands.length > 0)

    // Extract waypoints from hand tracking
    const waypoints = this.extractWaypoints(filteredResults)

    // Calculate velocities and accelerations
    const enrichedWaypoints = this.calculateKinematics(waypoints)

    // Smooth trajectory
    const smoothedWaypoints = this.smoothTrajectory(enrichedWaypoints)

    // Segment into task phases
    const taskSegments = this.segmentTaskPhases(smoothedWaypoints)

    // Calculate statistics
    const statistics = this.calculateStatistics(smoothedWaypoints)

    return {
      waypoints: smoothedWaypoints,
      statistics,
      taskSegments
    }
  }

  /**
   * Extract waypoints from hand tracking results
   */
  private static extractWaypoints(results: HandTrackingResult[]): Waypoint[] {
    return results.map((result, i) => {
      const hand = result.hands[0] // Already filtered to one hand

      // Calculate hand center (palm center)
      const palmLandmarks = [0, 1, 5, 9, 13, 17] // Wrist and base of each finger
      const relevantLandmarks = palmLandmarks.map((idx) => hand.landmarks[idx])

      const center = relevantLandmarks.reduce(
        (acc, lm) => ({
          x: acc.x + lm.x / relevantLandmarks.length,
          y: acc.y + lm.y / relevantLandmarks.length,
          z: acc.z + lm.z / relevantLandmarks.length
        }),
        { x: 0, y: 0, z: 0 }
      )

      // Estimate orientation
      const orientation = this.estimateOrientation(hand.landmarks)

      // Estimate gripper state
      const gripper = this.estimateGripperState(hand.landmarks)

      return {
        timestamp_ms: result.timestamp,
        frame_number: result.frameNumber,
        position_x: center.x,
        position_y: center.y,
        position_z: center.z,
        roll: orientation.roll,
        pitch: orientation.pitch,
        yaw: orientation.yaw,
        gripper_state: gripper.state,
        gripper_width: gripper.width,
        confidence: hand.confidence
      }
    })
  }

  /**
   * Calculate velocities and accelerations
   */
  private static calculateKinematics(waypoints: Waypoint[]): Waypoint[] {
    return waypoints.map((wp, i) => {
      if (i === 0) return wp

      const prev = waypoints[i - 1]
      const dt = (wp.timestamp_ms - prev.timestamp_ms) / 1000 // Convert to seconds

      if (dt === 0) return wp

      // Calculate distance
      const dx = wp.position_x - prev.position_x
      const dy = wp.position_y - prev.position_y
      const dz = wp.position_z - prev.position_z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      // Calculate velocity
      const velocity = distance / dt

      // Calculate acceleration
      const prevVelocity = prev.velocity || 0
      const acceleration = (velocity - prevVelocity) / dt

      return {
        ...wp,
        velocity,
        acceleration
      }
    })
  }

  /**
   * Smooth trajectory using moving average
   */
  private static smoothTrajectory(waypoints: Waypoint[], windowSize: number = 5): Waypoint[] {
    if (waypoints.length < windowSize) return waypoints

    const smoothed: Waypoint[] = []
    const halfWindow = Math.floor(windowSize / 2)

    for (let i = 0; i < waypoints.length; i++) {
      const start = Math.max(0, i - halfWindow)
      const end = Math.min(waypoints.length, i + halfWindow + 1)
      const window = waypoints.slice(start, end)

      const avgPosition = window.reduce(
        (acc, wp) => ({
          x: acc.x + wp.position_x / window.length,
          y: acc.y + wp.position_y / window.length,
          z: acc.z + wp.position_z / window.length
        }),
        { x: 0, y: 0, z: 0 }
      )

      smoothed.push({
        ...waypoints[i],
        position_x: avgPosition.x,
        position_y: avgPosition.y,
        position_z: avgPosition.z
      })
    }

    return smoothed
  }

  /**
   * Segment trajectory into task phases using velocity and gripper state
   */
  private static segmentTaskPhases(waypoints: Waypoint[]): TaskSegment[] {
    const segments: TaskSegment[] = []
    let currentPhase: TaskSegment['phase'] = 'reach'
    let segmentStart = 0

    for (let i = 1; i < waypoints.length; i++) {
      const wp = waypoints[i]
      const velocity = wp.velocity || 0

      // Phase detection logic
      let newPhase: TaskSegment['phase'] | null = null

      // Reach: high velocity, gripper open
      if (velocity > 0.1 && wp.gripper_state === 'open') {
        newPhase = 'reach'
      }
      // Grasp: low velocity, gripper closing
      else if (velocity < 0.05 && wp.gripper_state === 'closed') {
        newPhase = 'grasp'
      }
      // Transport: high velocity, gripper closed
      else if (velocity > 0.1 && wp.gripper_state === 'closed') {
        newPhase = 'transport'
      }
      // Place: low velocity, gripper opening
      else if (velocity < 0.05 && wp.gripper_state === 'partial') {
        newPhase = 'place'
      }
      // Retract: high velocity, gripper open
      else if (velocity > 0.08 && wp.gripper_state === 'open' && currentPhase === 'place') {
        newPhase = 'retract'
      }

      // Create new segment if phase changed
      if (newPhase && newPhase !== currentPhase) {
        // Save previous segment
        if (segmentStart < i) {
          segments.push({
            start_frame: waypoints[segmentStart].frame_number,
            end_frame: waypoints[i - 1].frame_number,
            start_time: waypoints[segmentStart].timestamp_ms / 1000,
            end_time: waypoints[i - 1].timestamp_ms / 1000,
            phase: currentPhase,
            confidence: 0.8 // Placeholder confidence score
          })
        }

        currentPhase = newPhase
        segmentStart = i
      }

      // Assign phase to waypoint
      waypoints[i].task_phase = currentPhase
    }

    // Add final segment
    if (segmentStart < waypoints.length - 1) {
      segments.push({
        start_frame: waypoints[segmentStart].frame_number,
        end_frame: waypoints[waypoints.length - 1].frame_number,
        start_time: waypoints[segmentStart].timestamp_ms / 1000,
        end_time: waypoints[waypoints.length - 1].timestamp_ms / 1000,
        phase: currentPhase,
        confidence: 0.8
      })
    }

    return segments
  }

  /**
   * Calculate trajectory statistics
   */
  private static calculateStatistics(waypoints: Waypoint[]): TrajectoryStatistics {
    if (waypoints.length === 0) {
      return {
        total_waypoints: 0,
        duration_seconds: 0,
        average_velocity: 0,
        max_velocity: 0,
        total_distance: 0,
        smoothness_score: 0
      }
    }

    const velocities = waypoints.map((wp) => wp.velocity || 0).filter((v) => v > 0)
    const accelerations = waypoints.map((wp) => wp.acceleration || 0).filter((a) => !isNaN(a))

    // Calculate total distance
    let totalDistance = 0
    for (let i = 1; i < waypoints.length; i++) {
      const wp = waypoints[i]
      const prev = waypoints[i - 1]
      const dx = wp.position_x - prev.position_x
      const dy = wp.position_y - prev.position_y
      const dz = wp.position_z - prev.position_z
      totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz)
    }

    // Smoothness score (inverse of jerk - change in acceleration)
    const jerk = accelerations.map((a, i) => {
      if (i === 0) return 0
      return Math.abs(a - accelerations[i - 1])
    })
    const avgJerk = jerk.reduce((sum, j) => sum + j, 0) / jerk.length
    const smoothnessScore = 1 / (1 + avgJerk * 100) // Normalize to 0-1

    return {
      total_waypoints: waypoints.length,
      duration_seconds: (waypoints[waypoints.length - 1].timestamp_ms - waypoints[0].timestamp_ms) / 1000,
      average_velocity: velocities.reduce((sum, v) => sum + v, 0) / velocities.length,
      max_velocity: Math.max(...velocities),
      total_distance: totalDistance,
      smoothness_score: smoothnessScore
    }
  }

  /**
   * Estimate hand orientation from landmarks
   */
  private static estimateOrientation(landmarks: { x: number; y: number; z: number }[]): {
    roll: number
    pitch: number
    yaw: number
  } {
    const wrist = landmarks[0]
    const indexMCP = landmarks[5]
    const pinkyMCP = landmarks[17]

    // Calculate palm normal vector
    const v1 = {
      x: indexMCP.x - wrist.x,
      y: indexMCP.y - wrist.y,
      z: indexMCP.z - wrist.z
    }

    const v2 = {
      x: pinkyMCP.x - wrist.x,
      y: pinkyMCP.y - wrist.y,
      z: pinkyMCP.z - wrist.z
    }

    // Cross product
    const normal = {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x
    }

    // Calculate Euler angles
    const roll = Math.atan2(normal.y, normal.x)
    const pitch = Math.atan2(-normal.z, Math.sqrt(normal.x ** 2 + normal.y ** 2))
    const yaw = Math.atan2(v1.y, v1.x)

    return { roll, pitch, yaw }
  }

  /**
   * Estimate gripper state from finger positions
   */
  private static estimateGripperState(landmarks: { x: number; y: number; z: number }[]): {
    state: 'open' | 'closed' | 'partial'
    width: number
  } {
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2) +
      Math.pow(thumbTip.z - indexTip.z, 2)
    )

    // Normalize distance (typical range: 0.02 - 0.2)
    const normalized = Math.max(0, Math.min(1, (distance - 0.02) / 0.18))

    let state: 'open' | 'closed' | 'partial'
    if (normalized > 0.7) state = 'open'
    else if (normalized < 0.3) state = 'closed'
    else state = 'partial'

    return { state, width: normalized }
  }
}
