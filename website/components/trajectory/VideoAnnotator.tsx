"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { HandTracker, HandTrackingResult } from '@/lib/mediapipe/hand-tracker'
import { TbPlayerPlay, TbPlayerPause, TbPlayerSkipBack, TbPlayerSkipForward, TbDownload } from 'react-icons/tb'

interface Annotation {
  id: string
  startTime: number
  endTime: number
  actionLabel: string
  taskPhase?: string
  objectLabel?: string
  notes?: string
}

interface VideoAnnotatorProps {
  videoUrl: string
  videoId: string
  onSaveTrajectory?: (data: any) => Promise<void>
}

const TASK_PHASES = ['reach', 'grasp', 'transport', 'place', 'retract']
const ACTION_LABELS = ['pick', 'place', 'push', 'pull', 'rotate', 'slide', 'pour']

export default function VideoAnnotator({ videoUrl, videoId, onSaveTrajectory }: VideoAnnotatorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handTrackerRef = useRef<HandTracker | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showKeypoints, setShowKeypoints] = useState(true)

  // Trajectory data
  const [trackingResults, setTrackingResults] = useState<HandTrackingResult[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  // Annotation form state
  const [isAnnotating, setIsAnnotating] = useState(false)
  const [annotationStart, setAnnotationStart] = useState<number | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<string>('')
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [objectLabel, setObjectLabel] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Initialize hand tracker
  useEffect(() => {
    const tracker = new HandTracker()
    tracker.initialize().catch(console.error)
    handTrackerRef.current = tracker

    return () => {
      tracker.close()
    }
  }, [])

  // Update canvas size to match video
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    const updateSize = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.style.width = `${video.clientWidth}px`
      canvas.style.height = `${video.clientHeight}px`
    }

    video.addEventListener('loadedmetadata', updateSize)
    return () => video.removeEventListener('loadedmetadata', updateSize)
  }, [])

  // Real-time hand tracking on video frame
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !handTrackerRef.current) return
    if (!showKeypoints) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      const timestamp = performance.now()
      const frameNumber = Math.floor(video.currentTime * 30) // Assuming 30fps

      const result = await handTrackerRef.current.detectHands(video, timestamp, frameNumber)

      // Draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Draw hand landmarks
      result.hands.forEach((hand) => {
        // Draw landmarks
        hand.landmarks.forEach((landmark, i) => {
          const x = landmark.x * canvas.width
          const y = landmark.y * canvas.height

          // Draw point
          ctx.fillStyle = hand.handedness === 'Left' ? '#4ade80' : '#60a5fa'
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, 2 * Math.PI)
          ctx.fill()

          // Draw landmark index
          ctx.fillStyle = '#ffffff'
          ctx.font = '10px monospace'
          ctx.fillText(i.toString(), x + 8, y + 4)
        })

        // Draw connections
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // Index
          [0, 9], [9, 10], [10, 11], [11, 12], // Middle
          [0, 13], [13, 14], [14, 15], [15, 16], // Ring
          [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
          [5, 9], [9, 13], [13, 17] // Palm
        ]

        ctx.strokeStyle = hand.handedness === 'Left' ? '#4ade80' : '#60a5fa'
        ctx.lineWidth = 2

        connections.forEach(([start, end]) => {
          const startLm = hand.landmarks[start]
          const endLm = hand.landmarks[end]
          if (!startLm || !endLm) return

          ctx.beginPath()
          ctx.moveTo(startLm.x * canvas.width, startLm.y * canvas.height)
          ctx.lineTo(endLm.x * canvas.width, endLm.y * canvas.height)
          ctx.stroke()
        })

        // Draw hand label
        const wrist = hand.landmarks[0]
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px monospace'
        ctx.fillText(
          `${hand.handedness} (${(hand.confidence * 100).toFixed(0)}%)`,
          wrist.x * canvas.width,
          wrist.y * canvas.height - 15
        )

        // Estimate and show gripper state
        if (handTrackerRef.current) {
          const gripper = handTrackerRef.current.estimateGripperState(hand.landmarks)
          ctx.fillText(
            `Gripper: ${gripper.state}`,
            wrist.x * canvas.width,
            wrist.y * canvas.height + 30
          )
        }
      })

      // Store result if recording
      if (isProcessing) {
        setTrackingResults((prev) => [...prev, result])
      }
    } catch (error) {
      console.error('Error processing frame:', error)
    }
  }, [showKeypoints, isProcessing])

  // Animation loop for real-time tracking
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      processFrame()
    }, 1000 / 30) // 30 FPS

    return () => clearInterval(interval)
  }, [isPlaying, processFrame])

  const handlePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSkipBackward = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
  }

  const handleSkipForward = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5)
  }

  const handleStartAnnotation = () => {
    setIsAnnotating(true)
    setAnnotationStart(currentTime)
  }

  const handleSaveAnnotation = () => {
    if (annotationStart === null) return

    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      startTime: annotationStart,
      endTime: currentTime,
      actionLabel: selectedAction,
      taskPhase: selectedPhase || undefined,
      objectLabel: objectLabel || undefined,
      notes: notes || undefined
    }

    setAnnotations((prev) => [...prev, newAnnotation])

    // Reset form
    setIsAnnotating(false)
    setAnnotationStart(null)
    setSelectedPhase('')
    setSelectedAction('')
    setObjectLabel('')
    setNotes('')
  }

  const handleProcessVideo = async () => {
    if (!videoRef.current) return

    setIsProcessing(true)
    setTrackingResults([])

    // Reset video to start
    videoRef.current.currentTime = 0
    await videoRef.current.play()

    // Processing will happen in the animation loop
    // Stop when video ends
    videoRef.current.onended = () => {
      setIsProcessing(false)
      setIsPlaying(false)
    }
  }

  const handleExportTrajectory = async () => {
    if (trackingResults.length === 0) {
      alert('No trajectory data to export. Process the video first.')
      return
    }

    // Convert tracking results to waypoints
    const waypoints = trackingResults.flatMap((result) => {
      return result.hands.map((hand) => {
        const center = handTrackerRef.current?.getHandCenter(hand.landmarks) || { x: 0, y: 0, z: 0 }
        const orientation = handTrackerRef.current?.estimateOrientation(hand.landmarks) || { roll: 0, pitch: 0, yaw: 0 }
        const gripper = handTrackerRef.current?.estimateGripperState(hand.landmarks) || { state: 'open', width: 1 }

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
          handedness: hand.handedness,
          confidence: hand.confidence
        }
      })
    })

    const trajectoryData = {
      video_id: videoId,
      trajectory_name: `${videoId}_trajectory`,
      total_frames: trackingResults.length,
      duration: duration,
      fps: 30,
      waypoints,
      keypoints: trackingResults,
      annotations
    }

    // Save to backend
    if (onSaveTrajectory) {
      await onSaveTrajectory(trajectoryData)
    }

    // Also download as JSON
    const blob = new Blob([JSON.stringify(trajectoryData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trajectory_${videoId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-lg overflow-hidden border border-slate-800">
        <video
          ref={videoRef}
          src={videoUrl}
          crossOrigin="anonymous"
          className="w-full"
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSkipBackward}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <TbPlayerSkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={handlePlayPause}
          className="p-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
        >
          {isPlaying ? <TbPlayerPause className="w-5 h-5" /> : <TbPlayerPlay className="w-5 h-5" />}
        </button>
        <button
          onClick={handleSkipForward}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <TbPlayerSkipForward className="w-5 h-5" />
        </button>

        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={currentTime}
          onChange={(e) => {
            const time = parseFloat(e.target.value)
            setCurrentTime(time)
            if (videoRef.current) videoRef.current.currentTime = time
          }}
          className="flex-1"
        />

        <span className="text-sm text-slate-400 min-w-[100px]">
          {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
        </span>
      </div>

      {/* Processing controls */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showKeypoints}
            onChange={(e) => setShowKeypoints(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-slate-300">Show Keypoints</span>
        </label>

        <button
          onClick={handleProcessVideo}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Process Full Video'}
        </button>

        <button
          onClick={handleExportTrajectory}
          disabled={trackingResults.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
        >
          <TbDownload className="w-4 h-4" />
          Export Trajectory
        </button>

        {trackingResults.length > 0 && (
          <span className="text-sm text-green-400">
            {trackingResults.length} frames processed
          </span>
        )}
      </div>

      {/* Annotation interface */}
      <div className="border border-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Annotate Task Phases</h3>

        {!isAnnotating ? (
          <button
            onClick={handleStartAnnotation}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Start Annotation
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-400">
              Started at: {annotationStart?.toFixed(2)}s → Current: {currentTime.toFixed(2)}s
            </p>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="">Select Action</option>
              {ACTION_LABELS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="">Select Task Phase (optional)</option>
              {TASK_PHASES.map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={objectLabel}
              onChange={(e) => setObjectLabel(e.target.value)}
              placeholder="Object label (e.g., cup, box)"
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500"
            />

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 resize-none"
              rows={2}
            />

            <div className="flex gap-2">
              <button
                onClick={handleSaveAnnotation}
                disabled={!selectedAction}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Save Annotation
              </button>
              <button
                onClick={() => {
                  setIsAnnotating(false)
                  setAnnotationStart(null)
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Annotations list */}
        {annotations.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Saved Annotations</h4>
            <div className="space-y-2">
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className="flex items-center justify-between p-2 bg-slate-800 rounded-lg text-sm"
                >
                  <div>
                    <span className="font-semibold text-green-400">{ann.actionLabel}</span>
                    {ann.taskPhase && (
                      <span className="ml-2 text-slate-400">({ann.taskPhase})</span>
                    )}
                    {ann.objectLabel && (
                      <span className="ml-2 text-blue-400">→ {ann.objectLabel}</span>
                    )}
                  </div>
                  <span className="text-slate-500">
                    {ann.startTime.toFixed(1)}s - {ann.endTime.toFixed(1)}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
