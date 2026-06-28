"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"

interface TrackingData {
  frame: number
  fps: number
  phase: string
  linearSpeed: number
  angularSpeed: number
  position: { x: number; y: number }
  orientation: { yaw: number }
  leftHand: string
  rightHand: string
  confidence: {
    thu: number
    wed: number
    mid: number
    ind: number
    pin: number
    vel: number
  }
}

interface VideoVisualizationProps {
  videoUrl: string
  trackingData?: TrackingData
  showOverlay?: boolean
}

export default function VideoVisualization({
  videoUrl,
  trackingData,
  showOverlay = true
}: VideoVisualizationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const fps = 30 // Assume 30 FPS
      const frame = Math.floor(video.currentTime * fps)
      setCurrentFrame(frame)
    }

    const handleLoadedMetadata = () => {
      const fps = 30
      setTotalFrames(Math.floor(video.duration * fps))
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  // Draw 3D coordinate system overlay
  useEffect(() => {
    if (!showOverlay || !canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawOverlay = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw 3D coordinate axes (simplified)
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // X axis (red)
      ctx.strokeStyle = '#ff0000'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + 60, centerY - 20)
      ctx.stroke()

      // Y axis (green)
      ctx.strokeStyle = '#00ff00'
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX - 30, centerY - 50)
      ctx.stroke()

      // Z axis (blue)
      ctx.strokeStyle = '#0000ff'
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX, centerY + 60)
      ctx.stroke()

      // Draw hand tracking points (mock)
      const handPoints = [
        { x: centerX - 30, y: centerY + 20 },
        { x: centerX - 20, y: centerY + 30 },
        { x: centerX - 10, y: centerY + 35 },
        { x: centerX, y: centerY + 40 },
        { x: centerX + 10, y: centerY + 42 }
      ]

      handPoints.forEach((point, i) => {
        ctx.fillStyle = '#ff6b6b'
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
        ctx.fill()

        // Connect points
        if (i > 0) {
          ctx.strokeStyle = '#ff6b6b'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(handPoints[i - 1].x, handPoints[i - 1].y)
          ctx.lineTo(point.x, point.y)
          ctx.stroke()
        }
      })
    }

    const interval = setInterval(drawOverlay, 33) // ~30 FPS
    return () => clearInterval(interval)
  }, [showOverlay])

  const data = trackingData || {
    frame: currentFrame,
    fps: 30.0,
    phase: "STOP",
    linearSpeed: 0.01,
    angularSpeed: 0.04,
    position: { x: -0.31, y: -0.34 },
    orientation: { yaw: 118.5 },
    leftHand: "N/A",
    rightHand: "CLOSED",
    confidence: {
      thu: 0.8,
      wed: 0.6,
      mid: 0.7,
      ind: 0.5,
      pin: 0.4,
      vel: 0.9
    }
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        controls
      />

      {/* Canvas overlay for 3D visualization */}
      {showOverlay && (
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* Header info */}
      {showOverlay && (
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-white text-xs font-mono">
          <div className="bg-black/70 px-2 py-1 rounded">
            FRAME: {String(data.frame).padStart(5, '0')} / {String(totalFrames).padStart(5, '0')}
          </div>
          <div className="bg-black/70 px-2 py-1 rounded">
            FPS: {data.fps.toFixed(1)}
          </div>
          <div className="bg-black/70 px-2 py-1 rounded">
            PHASE: {data.phase}
          </div>
        </div>
      )}

      {/* Left sidebar - Speed metrics */}
      {showOverlay && (
        <div className="absolute top-16 left-2 bg-black/80 rounded-lg p-3 text-white text-xs font-mono space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
              V
            </div>
          </div>
          <div>
            <div className="text-yellow-400 text-[10px]">LINEAR SPEED</div>
            <div className="text-sm font-bold">{data.linearSpeed.toFixed(2)} m/s</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
              W
            </div>
          </div>
          <div>
            <div className="text-yellow-400 text-[10px]">ANGULAR SPEED</div>
            <div className="text-sm font-bold">{data.angularSpeed.toFixed(2)} r/s</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-600">
            <div className="text-red-400 text-[10px]">LEFT HAND: {data.leftHand}</div>
          </div>
        </div>
      )}

      {/* Right sidebar - Position & Orientation */}
      {showOverlay && (
        <div className="absolute top-16 right-2 bg-black/80 rounded-lg p-3 text-white text-xs font-mono space-y-3 w-36">
          <div>
            <div className="text-yellow-400 text-[10px] mb-1">POSITION (X, Y)</div>
            <div className="text-[10px]">
              Abs: {data.position.x.toFixed(2)}, {data.position.y.toFixed(2)}
            </div>
            <div className="text-[10px] text-yellow-300">
              Rel: {data.position.x.toFixed(2)}, {data.position.y.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400 relative">
              <div
                className="absolute top-1/2 left-1/2 w-1 h-6 bg-cyan-400 origin-bottom"
                style={{
                  transform: `translate(-50%, -100%) rotate(${data.orientation.yaw}deg)`
                }}
              />
            </div>
          </div>

          <div>
            <div className="text-yellow-400 text-[10px]">ORIENTATION (YAW)</div>
            <div className="text-[10px]">
              Abs: {data.orientation.yaw.toFixed(1)} deg
            </div>
            <div className="text-[10px] text-yellow-300">
              Rel: +0.0 deg
            </div>
          </div>

          <div className="pt-3 border-t border-slate-600">
            <div className={`text-[10px] font-bold ${
              data.rightHand === 'CLOSED' ? 'text-red-400' : 'text-green-400'
            }`}>
              RIGHT HAND: {data.rightHand}
            </div>
            <div className="text-[10px] mt-1">CONFIDENCE: 1.00</div>
          </div>

          {/* Confidence bars */}
          <div className="space-y-1">
            {Object.entries(data.confidence).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[9px] w-6 text-cyan-400">{key}</span>
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] w-6 text-cyan-400">VEL</span>
              <div className="text-[9px] text-cyan-300">{data.linearSpeed.toFixed(2)} m/s</div>
            </div>
          </div>
        </div>
      )}

      {/* HumanEGO logo */}
      {showOverlay && (
        <div className="absolute top-2 right-2">
          <div className="text-white text-2xl font-bold tracking-tight">
            <span className="text-slate-400">HUMAN</span>
            <span className="text-orange-500">EGO</span>
          </div>
        </div>
      )}
    </div>
  )
}
