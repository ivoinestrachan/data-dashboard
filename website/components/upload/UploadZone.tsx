"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useGordonStore } from "@/store/useGordonStore"
import { TbUpload, TbX } from "react-icons/tb"
import { Video } from "@/types/video"
import { motion } from "framer-motion"

interface UploadZoneProps {
  onUploadComplete?: () => void
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const { addVideo, setShowUpload, addToast } = useGordonStore()
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number }[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const createdUrlsRef = useRef<string[]>([])

  useEffect(() => {
    return () => {
      createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true)
    else if (e.type === "dragleave") setIsDragActive(false)
  }, [])

  const uploadToBackend = useCallback(async (file: File) => {
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
    const objectUrl = URL.createObjectURL(file)
    createdUrlsRef.current.push(objectUrl)

    // Add optimistic video to store immediately
    const optimisticId = `optimistic_${Date.now()}`
    const optimisticVideo: Video = {
      id: optimisticId,
      title: nameWithoutExt,
      source: "uploaded",
      duration: "0:00",
      status: "pending",
      date: "Today",
      category: null,
      thumbnailUrl: objectUrl,
      videoUrl: null,
      metaId: null
    }
    addVideo(optimisticVideo)
    addToast(`Uploading: ${file.name}`, "info")
    setUploadingFiles((prev) => [...prev, { name: file.name, progress: 0 }])

    // Simulate progress during upload
    let progress = 0
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 8, 90)
      setUploadingFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, progress } : f))
      )
    }, 300)

    try {
      const formData = new FormData()
      formData.append("video", file)
      formData.append("title", nameWithoutExt)
      formData.append("source", "uploaded")

      const res = await fetch("/api/upload", { method: "POST", body: formData })

      clearInterval(progressInterval)
      setUploadingFiles((prev) => prev.map((f) => (f.name === file.name ? { ...f, progress: 100 } : f)))

      if (res.ok) {
        const data = await res.json()
        addToast(`Uploaded: ${nameWithoutExt}`, "success")

        if (onUploadComplete) {
          setTimeout(() => onUploadComplete(), 400)
        }
      } else {
        // Backend error — optimistic video stays in pending state
        addToast(`Upload saved locally: ${nameWithoutExt}`, "info")
      }
    } catch {
      clearInterval(progressInterval)
      // Backend not running — keep optimistic video in store
      addToast(`Saved locally: ${nameWithoutExt}`, "info")
      setUploadingFiles((prev) => prev.map((f) => (f.name === file.name ? { ...f, progress: 100 } : f)))
    } finally {
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name))
        setShowUpload(false)
      }, 600)
    }
  }, [addVideo, addToast, setShowUpload, onUploadComplete])

  const validateAndUpload = useCallback((files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.toLowerCase()
      const validExt = ext.endsWith(".mp4") || ext.endsWith(".mov")
      const validSize = file.size <= 500 * 1024 * 1024

      if (!validExt || !validSize) {
        addToast(`Invalid file: "${file.name}". Only MP4/MOV under 500 MB.`, "error")
        continue
      }
      uploadToBackend(file)
    }
  }, [addToast, uploadToBackend])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files?.[0]) validateAndUpload(e.dataTransfer.files)
  }, [validateAndUpload])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndUpload(e.target.files)
  }, [validateAndUpload])

  return (
    <div
      className="fixed inset-0 bg-slate-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={() => setShowUpload(false)}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp4,.mov,video/mp4,video/quicktime"
        className="hidden"
        onChange={handleFileChange}
      />

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-xl w-full max-w-[420px] relative overflow-hidden select-none space-y-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowUpload(false)}
          className="absolute top-4.5 right-4.5 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 text-slate-500 transition-colors cursor-pointer"
        >
          <TbX className="text-sm stroke-[2.5]" />
        </button>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Upload Motion Recordings</h3>
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
            Select or drag files to add motion recordings to your robot training set
          </p>
        </div>

        <motion.div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          animate={{ scale: isDragActive ? 1.015 : 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className={`flex flex-col items-center justify-center rounded-xl p-8 text-center border-2 border-dashed transition-all duration-150 cursor-pointer ${
            isDragActive
              ? "border-slate-800 bg-slate-50"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
          }`}
        >
          {uploadingFiles.length > 0 ? (
            <div className="flex flex-col items-center gap-3.5 w-full max-w-[260px]">
              <div className="w-9 h-9 rounded-full border-2 border-slate-100 border-t-slate-900 animate-spin flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              </div>
              <div className="w-full text-center space-y-1.5">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Uploading to backend...
                </span>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadingFiles[0]?.progress || 0}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 font-bold block truncate">
                  {uploadingFiles[0]?.name} ({uploadingFiles[0]?.progress}%)
                </span>
              </div>
            </div>
          ) : (
            <>
              <TbUpload className="text-[26px] text-slate-400 mb-2 block" />
              <span className="text-[12px] font-bold text-slate-700">
                Drag &amp; drop your videos here
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-semibold">
                MP4, MOV — up to 500 MB per file
              </span>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
