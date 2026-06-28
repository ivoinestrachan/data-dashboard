import { HandLandmarker, FilesetResolver, HandLandmarkerResult } from '@mediapipe/tasks-vision'

export interface HandLandmarks {
  landmarks: { x: number; y: number; z: number }[]
  worldLandmarks: { x: number; y: number; z: number }[]
  handedness: string
  confidence: number
}

export interface HandTrackingResult {
  hands: HandLandmarks[]
  timestamp: number
  frameNumber: number
}

export class HandTracker {
  private landmarker?: HandLandmarker
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      this.isInitialized = true
      console.log('✅ MediaPipe Hand Tracker initialized')
    } catch (error) {
      console.error('Failed to initialize MediaPipe Hand Tracker:', error)
      throw error
    }
  }

  async detectHands(
    video: HTMLVideoElement,
    timestamp: number,
    frameNumber: number
  ): Promise<HandTrackingResult> {
    if (!this.landmarker) {
      throw new Error('Hand tracker not initialized. Call initialize() first.')
    }

    const results: HandLandmarkerResult = await this.landmarker.detectForVideo(video, timestamp)

    const hands: HandLandmarks[] = []

    if (results.landmarks && results.landmarks.length > 0) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i].map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z
        }))

        const worldLandmarks = results.worldLandmarks?.[i]?.map((wlm) => ({
          x: wlm.x,
          y: wlm.y,
          z: wlm.z
        })) || []

        const handedness = results.handedness?.[i]?.[0]?.displayName || 'Unknown'
        const confidence = results.handedness?.[i]?.[0]?.score || 0

        hands.push({
          landmarks,
          worldLandmarks,
          handedness,
          confidence
        })
      }
    }

    return {
      hands,
      timestamp,
      frameNumber
    }
  }

  /**
   * Get the center point of the hand (palm center)
   */
  getHandCenter(landmarks: { x: number; y: number; z: number }[]): { x: number; y: number; z: number } {
    if (landmarks.length === 0) return { x: 0, y: 0, z: 0 }

    // Palm center is landmark 0 (wrist) or average of palm landmarks
    const palmLandmarks = [0, 1, 5, 9, 13, 17] // Wrist and base of each finger
    const relevantLandmarks = palmLandmarks.map((i) => landmarks[i]).filter(Boolean)

    const sum = relevantLandmarks.reduce(
      (acc, lm) => ({
        x: acc.x + lm.x,
        y: acc.y + lm.y,
        z: acc.z + lm.z
      }),
      { x: 0, y: 0, z: 0 }
    )

    return {
      x: sum.x / relevantLandmarks.length,
      y: sum.y / relevantLandmarks.length,
      z: sum.z / relevantLandmarks.length
    }
  }

  /**
   * Estimate gripper state from finger positions
   */
  estimateGripperState(landmarks: { x: number; y: number; z: number }[]): {
    state: 'open' | 'closed' | 'partial'
    width: number
  } {
    if (landmarks.length < 21) {
      return { state: 'open', width: 1 }
    }

    // Calculate distance between thumb tip and index tip
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

  /**
   * Estimate hand orientation (roll, pitch, yaw) from landmarks
   */
  estimateOrientation(landmarks: { x: number; y: number; z: number }[]): {
    roll: number
    pitch: number
    yaw: number
  } {
    if (landmarks.length < 21) {
      return { roll: 0, pitch: 0, yaw: 0 }
    }

    // Use wrist (0), index MCP (5), and pinky MCP (17) to define hand plane
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

  close(): void {
    if (this.landmarker) {
      this.landmarker.close()
      this.isInitialized = false
      console.log('🔒 MediaPipe Hand Tracker closed')
    }
  }
}
