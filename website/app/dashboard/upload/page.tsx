"use client"

import { useEffect } from "react"
import { useGordonStore } from "@/store/useGordonStore"
import UploadZone from "@/components/upload/UploadZone"
import GalleryGrid from "@/components/gallery/GalleryGrid"

export default function UploadPage() {
  const { setShowUpload } = useGordonStore()

  useEffect(() => {
    setShowUpload(true)
  }, [setShowUpload])

  return (
    <div className="flex flex-col min-h-full pb-10">
      <UploadZone />
      <GalleryGrid />
    </div>
  )
}
