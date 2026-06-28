"use client"

import { useRef, useEffect, useState } from "react"

interface Point3D {
  x: number
  y: number
  z: number
  timestamp: number
}

interface TrajectoryData {
  handTrajectory: Point3D[]
  objectTrajectory: Point3D[]
  currentFrame: number
}

interface TrajectoryVisualizationProps {
  trajectoryData?: TrajectoryData
  width?: number
  height?: number
}

export default function TrajectoryVisualization({
  trajectoryData,
  width = 400,
  height = 300
}: TrajectoryVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1

    // Vertical grid lines
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    if (!trajectoryData) {
      // Draw sample trajectory data
      drawSampleTrajectory(ctx, canvas.width, canvas.height)
      return
    }

    // Draw actual trajectory data
    drawTrajectory(ctx, trajectoryData.handTrajectory, '#00ff88', canvas.width, canvas.height)
    drawTrajectory(ctx, trajectoryData.objectTrajectory, '#ff6b6b', canvas.width, canvas.height)

  }, [trajectoryData, width, height])

  const drawSampleTrajectory = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const points = 50
    const trajectories: Array<{color: string, offset: number}> = [
      { color: '#00ff88', offset: 0 },
      { color: '#0088ff', offset: 50 },
      { color: '#ff6b6b', offset: 100 },
      { color: '#ffaa00', offset: 150 }
    ]

    trajectories.forEach(({ color, offset }) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let i = 0; i < points; i++) {
        const x = (i / points) * w
        const y = h / 2 + Math.sin((i + offset) * 0.1) * (h / 4) + Math.random() * 10

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      // Draw points
      ctx.fillStyle = color
      for (let i = 0; i < points; i += 5) {
        const x = (i / points) * w
        const y = h / 2 + Math.sin((i + offset) * 0.1) * (h / 4)

        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }

  const drawTrajectory = (
    ctx: CanvasRenderingContext2D,
    points: Point3D[],
    color: string,
    w: number,
    h: number
  ) => {
    if (points.length === 0) return

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    points.forEach((point, i) => {
      // Project 3D to 2D (simple orthographic projection)
      const x = (point.x + 1) * (w / 2)
      const y = (1 - point.y) * (h / 2)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw points
    ctx.fillStyle = color
    points.forEach(point => {
      const x = (point.x + 1) * (w / 2)
      const y = (1 - point.y) * (h / 2)

      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  return (
    <div className="relative w-full h-full bg-[#1a1a1a] rounded-lg overflow-hidden border border-slate-700">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Trajectory Analysis
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
              <span className="text-[9px] font-mono text-slate-400">Hand</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#0088ff]" />
              <span className="text-[9px] font-mono text-slate-400">Object 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#ff6b6b]" />
              <span className="text-[9px] font-mono text-slate-400">Object 2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#ffaa00]" />
              <span className="text-[9px] font-mono text-slate-400">Tool</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full"
      />

      {/* Stats overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="grid grid-cols-4 gap-2 text-[9px] font-mono">
          <div>
            <div className="text-slate-500 uppercase">Frames</div>
            <div className="text-white font-bold">2,340</div>
          </div>
          <div>
            <div className="text-slate-500 uppercase">Duration</div>
            <div className="text-white font-bold">1:18</div>
          </div>
          <div>
            <div className="text-slate-500 uppercase">Avg Speed</div>
            <div className="text-white font-bold">0.42 m/s</div>
          </div>
          <div>
            <div className="text-slate-500 uppercase">Smoothness</div>
            <div className="text-white font-bold">94%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
