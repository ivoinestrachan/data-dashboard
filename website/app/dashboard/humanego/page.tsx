"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { TbLayoutGrid, TbPlayerPlay, TbArrowLeft } from "react-icons/tb"
import MultiPanelView from "@/components/humanego/MultiPanelView"

export default function HumanEgoPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "multi">("grid")
  const [selectedVideos, setSelectedVideos] = useState<any[]>([])

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos")
      const data = await response.json()

      if (data.success) {
        const transformedVideos = data.videos.map((video: any) => ({
          id: video.id,
          title: video.title,
          videoUrl: video.video_url || video.videoUrl,
          thumbnailUrl: video.thumbnail_url || video.thumbnailUrl,
        }))
        setVideos(transformedVideos)
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err)
    }
  }

  const handleVideoSelect = (video: any) => {
    if (selectedVideos.find(v => v.id === video.id)) {
      setSelectedVideos(selectedVideos.filter(v => v.id !== video.id))
    } else if (selectedVideos.length < 4) {
      setSelectedVideos([...selectedVideos, video])
    }
  }

  if (viewMode === "multi" && selectedVideos.length > 0) {
    return (
      <div className="relative w-full h-screen">
        <button
          onClick={() => setViewMode("grid")}
          className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/80 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <TbArrowLeft className="text-lg" />
          Back to Grid
        </button>
        <MultiPanelView videos={selectedVideos} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-slate-600">HUMAN</span>
                <span className="text-orange-500">EGO</span>
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Egocentric Video Analysis & Trajectory Visualization
            </p>
          </div>

          {selectedVideos.length > 0 && (
            <button
              onClick={() => setViewMode("multi")}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <TbLayoutGrid className="text-lg" />
              Multi-Panel View ({selectedVideos.length})
            </button>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video) => {
            const isSelected = selectedVideos.find(v => v.id === video.id)

            return (
              <motion.div
                key={video.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleVideoSelect(video)}
                className={`relative bg-slate-100 rounded-xl overflow-hidden cursor-pointer transition-all ${
                  isSelected ? "ring-4 ring-orange-500" : "hover:ring-2 hover:ring-slate-300"
                }`}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-slate-200 relative">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TbPlayerPlay className="text-4xl text-slate-400" />
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                      {selectedVideos.findIndex(v => v.id === video.id) + 1}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-slate-800 truncate">
                    {video.title}
                  </h3>
                </div>
              </motion.div>
            )
          })}
        </div>

        {videos.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-sm">No videos available</p>
          </div>
        )}
      </div>
    </div>
  )
}
