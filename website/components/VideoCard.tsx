"use client"

import { FiPlay, FiClock } from "react-icons/fi"
import { useRef, useState } from "react"

interface VideoCardProps {
  title: string
  duration: string
  thumbnail?: string
  date: string
  videoUrl: string
  onPlay: () => void
}

export default function VideoCard({ title, duration, thumbnail, date, videoUrl, onPlay }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseEnter = () => {
    setIsHovering(true)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play()
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div
      onClick={onPlay}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <div className="aspect-video bg-gray-100 relative">
        {/* Thumbnail */}
        {thumbnail && (
          <img
            src={thumbnail}
            alt={title}
            className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${isHovering ? 'opacity-0' : 'opacity-100'}`}
          />
        )}

        {/* Video preview */}
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          loop
          playsInline
          className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Play icon overlay when not hovering */}
        {!isHovering && !thumbnail && (
          <div className="w-full h-full flex items-center justify-center absolute inset-0">
            <FiPlay className="text-4xl text-gray-400" />
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <FiClock className="text-xs" />
          {duration}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{date}</p>
      </div>
    </div>
  )
}
