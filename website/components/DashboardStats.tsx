"use client"

import { useEffect, useState } from "react"
import { FiVideo, FiDatabase, FiClock } from "react-icons/fi"

interface Stats {
  totalVideos: number
  storageUsed: string
  lastConnected: string
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalVideos: 0,
    storageUsed: "0 GB",
    lastConnected: "Never"
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/videos")
      const data = await response.json()

      if (data.success) {
        // Calculate total storage used
        const totalBytes = data.videos.reduce((acc: number, video: any) => acc + (video.size || 0), 0)
        const storageGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2)

        setStats({
          totalVideos: data.total || 0,
          storageUsed: `${storageGB} GB`,
          lastConnected: data.videos.length > 0
            ? new Date(data.videos[0].uploaded_at || data.videos[0].uploadedAt).toLocaleDateString()
            : "Never"
        })
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-black text-sm font-medium">Total Videos</h3>
          <FiVideo className="text-black text-xl" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats.totalVideos}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-black text-sm font-medium">Storage Used</h3>
          <FiDatabase className="text-black text-xl" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats.storageUsed}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-black text-sm font-medium">Last Connected</h3>
          <FiClock className="text-black text-xl" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats.lastConnected}</p>
      </div>
    </div>
  )
}
