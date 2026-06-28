"use client"

import { useEffect, useRef } from "react"
import { FiX } from "react-icons/fi"

interface VideoPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  title: string
}

export default function VideoPlayerModal({ isOpen, onClose, videoUrl, title }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-20 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-[1000px] h-[700px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <FiX className="text-3xl" />
        </button>

        <div className="bg-white rounded-2xl overflow-hidden h-full flex flex-col shadow-2xl">
          <div className="flex-1 flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              autoPlay
              className="max-w-full max-h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="p-4 bg-white">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
