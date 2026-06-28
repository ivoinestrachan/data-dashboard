"use client"

import { useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { Video } from "@/types/video"
import VideoCard from "./VideoCard"
import VideoPlayerModal from "./VideoPlayerModal"

export interface VideoGalleryRef {
  refresh: () => void
}

const VideoGallery = forwardRef<VideoGalleryRef>((props, ref) => {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  useImperativeHandle(ref, () => ({
    refresh: fetchVideos
  }))

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/videos")
      const data = await response.json()

      if (data.success) {
        setVideos(data.videos)
      } else {
        setError(data.error || "Failed to fetch videos")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch videos")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center col-span-full text-black py-8">
        <p>Loading videos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center col-span-full text-red-600 py-8">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center col-span-full text-black py-8">
        <p>No videos yet. Connect your glasses to see your recordings here.</p>
      </div>
    )
  }

  return (
    <>
      {videos.map((video: any) => (
        <VideoCard
          key={video.id}
          title={video.title}
          duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : "0:00"}
          thumbnail={video.thumbnail_url || video.thumbnailUrl}
          date={new Date(video.uploaded_at || video.uploadedAt).toLocaleDateString()}
          videoUrl={video.video_url || video.videoUrl}
          onPlay={() => setSelectedVideo(video)}
        />
      ))}

      <VideoPlayerModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoUrl={selectedVideo?.video_url || selectedVideo?.videoUrl || ''}
        title={selectedVideo?.title || ''}
      />
    </>
  )
})

VideoGallery.displayName = 'VideoGallery'

export default VideoGallery
