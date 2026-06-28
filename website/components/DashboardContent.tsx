"use client"

import { useRef } from "react"
import DashboardStats from "./DashboardStats"
import VideoUploadForm from "./VideoUploadForm"
import VideoGallery, { VideoGalleryRef } from "./VideoGallery"

export default function DashboardContent() {
  const videoGalleryRef = useRef<VideoGalleryRef>(null)

  const handleUploadSuccess = () => {
    // Refresh the video gallery when a new video is uploaded
    videoGalleryRef.current?.refresh()
  }

  return (
    <>
      <DashboardStats />

      <VideoUploadForm onUploadSuccess={handleUploadSuccess} />

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Videos</h2>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <VideoGallery ref={videoGalleryRef} />
          </div>
        </div>
      </div>
    </>
  )
}
