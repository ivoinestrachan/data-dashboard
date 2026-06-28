"use client"

import { useState, useEffect } from "react"
import { TbCheck, TbX, TbLoader2, TbRobot } from "react-icons/tb"
import { motion, AnimatePresence } from "framer-motion"
import { HumanEgoClient, ProcessingJob } from "@/lib/humanego"

interface ProcessingStatusProps {
  videoId: string
  videoTitle: string
  onComplete?: (result: ProcessingJob) => void
  onClose?: () => void
}

export default function ProcessingStatus({
  videoId,
  videoTitle,
  onComplete,
  onClose
}: ProcessingStatusProps) {
  const [status, setStatus] = useState<ProcessingJob | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    let pollInterval: NodeJS.Timeout

    const checkStatus = async () => {
      try {
        const result = await HumanEgoClient.getStatus(videoId)

        if (isActive) {
          setStatus(result)

          if (result.status === "completed") {
            onComplete?.(result)
            clearInterval(pollInterval)
          } else if (result.status === "failed") {
            setError(result.error || "Processing failed")
            clearInterval(pollInterval)
          }
        }
      } catch (err: any) {
        if (isActive) {
          setError(err.message)
          clearInterval(pollInterval)
        }
      }
    }

    // Initial check
    checkStatus()

    // Poll every 5 seconds
    pollInterval = setInterval(checkStatus, 5000)

    return () => {
      isActive = false
      clearInterval(pollInterval)
    }
  }, [videoId, onComplete])

  const getStatusIcon = () => {
    if (error || status?.status === "failed") {
      return <TbX className="text-red-500 text-2xl" />
    }
    if (status?.status === "completed") {
      return <TbCheck className="text-green-500 text-2xl" />
    }
    return <TbLoader2 className="text-blue-500 text-2xl animate-spin" />
  }

  const getStatusText = () => {
    if (error) return "Processing Failed"
    if (status?.status === "failed") return "Processing Failed"
    if (status?.status === "completed") return "Processing Complete"
    if (status?.status === "processing") return "Processing..."
    return "Initializing..."
  }

  const getStatusColor = () => {
    if (error || status?.status === "failed") return "text-red-600"
    if (status?.status === "completed") return "text-green-600"
    return "text-blue-600"
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg max-w-md mx-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">HumanEgo Processing</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
              {videoTitle}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <TbX className="text-lg" />
          </button>
        )}
      </div>

      {/* Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Status</span>
          <span className={`text-xs font-bold ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Progress indicator */}
        {status?.status === "processing" && (
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
              }}
              style={{ width: "50%" }}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Results preview */}
        {status?.status === "completed" && status.trajectories && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
            <p className="text-xs font-bold text-green-800">Processing Complete!</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-green-600 font-medium">Hand Trajectory:</span>
                <span className="text-green-700 ml-1">
                  {status.trajectories.hand_trajectory?.length || 0} points
                </span>
              </div>
              <div>
                <span className="text-green-600 font-medium">Object Trajectory:</span>
                <span className="text-green-700 ml-1">
                  {status.trajectories.object_trajectory?.length || 0} points
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {status?.status === "completed" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <TbRobot className="text-sm" />
            View Results
          </button>
        </div>
      )}
    </motion.div>
  )
}
