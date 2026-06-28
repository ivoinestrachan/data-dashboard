"use client"

import { useEffect, useState, useCallback } from "react"
import { useGordonStore } from "@/store/useGordonStore"
import UploadZone from "@/components/upload/UploadZone"
import GalleryGrid from "@/components/gallery/GalleryGrid"
import { Video } from "@/types/video"

function formatDate(dateString: string): string {
  if (!dateString) return "Unknown"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays <= 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = String(seconds % 60).padStart(2, "0")
  return `${m}:${s}`
}

export default function GalleryPage() {
  const { showUpload, setVideos } = useGordonStore()
  const [loading, setLoading] = useState(true)

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/videos")

      if (!res.ok) {
        // Backend unavailable — keep mock data in store
        return
      }

      const data = await res.json()

      if (data.success && Array.isArray(data.videos) && data.videos.length > 0) {
        const transformed: Video[] = data.videos.map((v: any) => ({
          id: v.id,
          title: v.title,
          source: (v.source === "rayban" ? "rayban" : "uploaded") as Video["source"],
          duration: typeof v.duration === "number" ? formatDuration(v.duration) : (v.duration || "0:00"),
          status: (["analyzed", "pending", "processing", "error"].includes(v.status)
            ? v.status
            : "analyzed") as Video["status"],
          date: formatDate(v.uploaded_at || v.uploadedAt || ""),
          category: v.metadata?.category || null,
          thumbnailUrl: v.thumbnail_url || v.thumbnailUrl || null,
          videoUrl: v.video_url || v.videoUrl || null,
          metaId: v.meta_id || v.metaId || null,
          size: v.size || 0
        }))
        setVideos(transformed)
      }
    } catch {
      // Backend not running — mock data remains
    } finally {
      setLoading(false)
    }
  }, [setVideos])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 rounded-full border-2 border-slate-100 border-t-slate-900 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full pb-10">
      {showUpload && <UploadZone onUploadComplete={fetchVideos} />}
      <GalleryGrid />
    </div>
  )
}
