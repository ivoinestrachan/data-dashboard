import { Video } from "@/types/video"

// Simple in-memory storage (replace with database in production)
let videos: Video[] = []

export const videoStore = {
  // Get all videos
  getAll: (): Video[] => {
    return videos
  },

  // Get video by ID
  getById: (id: string): Video | undefined => {
    return videos.find(v => v.id === id)
  },

  // Add new video
  add: (video: Video): Video => {
    videos.push(video)
    return video
  },

  // Update video
  update: (id: string, updates: Partial<Video>): Video | undefined => {
    const index = videos.findIndex(v => v.id === id)
    if (index === -1) return undefined

    videos[index] = { ...videos[index], ...updates }
    return videos[index]
  },

  // Delete video
  delete: (id: string): boolean => {
    const index = videos.findIndex(v => v.id === id)
    if (index === -1) return false

    videos.splice(index, 1)
    return true
  },

  // Get total count
  count: (): number => {
    return videos.length
  },

  // Get total storage used (in bytes)
  getTotalSize: (): number => {
    return videos.reduce((total, v) => total + (v.size || 0), 0)
  }
}

// Helper to format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}
