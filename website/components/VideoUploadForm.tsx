"use client"

import { useState, useRef } from "react"
import { FiUpload } from "react-icons/fi"

interface VideoUploadFormProps {
  onUploadSuccess?: () => void
}

export default function VideoUploadForm({ onUploadSuccess }: VideoUploadFormProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [title, setTitle] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError("Please select a video file")
      return
    }

    await uploadVideo(file)
  }

  const uploadVideo = async (file: File) => {
    setUploading(true)
    setError(null)
    setSuccess(false)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('title', title || file.name.replace(/\.[^/.]+$/, ""))
      formData.append('recordedAt', new Date().toISOString())

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTitle("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        // Call the callback to refresh the video list
        onUploadSuccess?.()
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <FiUpload className="text-black text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upload Video
          </h2>
          <p className="text-black max-w-md mx-auto">
            Upload videos from your Meta Ray-Ban glasses
          </p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          {/* Title Input */}
          <input
            type="text"
            placeholder="Video title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
            disabled={uploading}
          />

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload Button */}
          <button
            onClick={handleButtonClick}
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiUpload />
            {uploading ? `Uploading... ${progress}%` : 'Select Video'}
          </button>

          {/* Progress Bar */}
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="text-green-600 text-sm font-medium">
              ✓ Video uploaded successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm font-medium">
              ✗ {error}
            </div>
          )}

          <div className="text-sm text-black">
            <p>Accepted formats: MP4, MOV, AVI, WebM</p>
          </div>
        </div>
      </div>
    </div>
  )
}
