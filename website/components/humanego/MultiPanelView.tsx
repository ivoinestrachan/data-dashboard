"use client"

import VideoVisualization from "./VideoVisualization"
import TrajectoryVisualization from "./TrajectoryVisualization"

interface Video {
  id: string
  title: string
  videoUrl: string
  thumbnailUrl?: string
}

interface MultiPanelViewProps {
  videos: Video[]
}

export default function MultiPanelView({ videos }: MultiPanelViewProps) {
  // Show up to 4 videos in grid
  const displayVideos = videos.slice(0, 4)

  // Pad with empty slots if less than 4
  while (displayVideos.length < 4) {
    displayVideos.push({
      id: `empty-${displayVideos.length}`,
      title: "Empty Slot",
      videoUrl: ""
    })
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Top section: 4-panel video grid (takes 2/3 of height) */}
      <div className="flex-[2] p-1">
        <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
          {displayVideos.map((video, index) => (
            <div key={video.id} className="relative bg-slate-900 overflow-hidden">
              {video.videoUrl ? (
                <VideoVisualization
                  videoUrl={video.videoUrl}
                  showOverlay={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-slate-600 text-sm">Panel {index + 1}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section: Trajectory visualization (takes 1/3 of height) */}
      <div className="flex-1 p-1">
        <TrajectoryVisualization />
      </div>
    </div>
  )
}
