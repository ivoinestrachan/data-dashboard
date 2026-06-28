"use client"

import { Video, GestureCategory } from "@/types/video"
import { useGordonStore } from "@/store/useGordonStore"
import StatusBadge from "./StatusBadge"
import {
  TbScissors,
  TbFlame,
  TbStar,
  TbDroplet,
  TbUpload,
  TbEye,
  TbRobot
} from "react-icons/tb"

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const { updateVideoStatus, addToast, setGordonStatus } = useGordonStore()

  // Category visual palette configuration
  const categoriesConfig: Record<
    GestureCategory,
    { bg: string; color: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    "Pick & Place":  { bg: "#07101e", color: "#b5d4f4", icon: TbStar     },
    "Welding":       { bg: "#1e0a03", color: "#f5c4a0", icon: TbFlame    },
    "Assembly":      { bg: "#0a0f1e", color: "#c4d4f5", icon: TbScissors },
    "Packaging":     { bg: "#071a0f", color: "#9fe1a5", icon: TbDroplet  },
    "Inspection":    { bg: "#0f0a1e", color: "#d4c4f5", icon: TbEye      },
    "Generic Upload":{ bg: "#1a071a", color: "#f4c0d1", icon: TbUpload   }
  }

  // Fallback to upload categories if null
  const activeCategory = video.category || "Generic Upload"
  const design = categoriesConfig[activeCategory] || categoriesConfig["Generic Upload"]
  const CategoryIcon = design.icon

  const handleGordonClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering card modal click

    // Optimistic Update
    updateVideoStatus(video.id, "processing")
    setGordonStatus("busy")
    addToast(`Sent to Gordon RamArm: ${video.title}`, "success")

    // Mock asynchronous robot process completion
    setTimeout(() => {
      // Pick a random category for the newly analyzed video
      const categories: GestureCategory[] = [
        "Pick & Place",
        "Welding",
        "Assembly",
        "Packaging",
        "Inspection"
      ]
      const randomCat = categories[Math.floor(Math.random() * categories.length)]
      
      // Update store state on completion
      updateVideoStatus(video.id, "analyzed")
      
      // Mutate the category directly in memory (since it's a simulated backend)
      video.category = randomCat
      video.duration = video.duration === "0:00" ? "1:15" : video.duration

      setGordonStatus("online")
      addToast(`Gordon RamArm: Analysis complete [${randomCat}] for ${video.title}`, "info")
    }, 7000)
  }

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col bg-surface-1 border border-border-custom hover:border-border-strong rounded-lg overflow-hidden transition-colors duration-150 cursor-pointer select-none"
    >
      {/* 1. Thumbnail Region (106px height) */}
      <div 
        className="h-[112px] w-full relative flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: design.bg }}
      >
        {/* Category Centered Icon */}
        <div style={{ color: design.color }} className="opacity-75">
          <CategoryIcon className="text-[26px]" />
        </div>

        {/* Source Badge (top-left) */}
        <div className="absolute top-[7px] left-[7px] bg-black/55 text-white/85 text-[10px] py-[2px] px-[5px] rounded flex items-center gap-1">
          {video.source === "rayban" ? (
            <>
              <TbEye className="text-[11px]" />
              <span>Ray-Ban</span>
            </>
          ) : (
            <>
              <TbUpload className="text-[11px]" />
              <span>Upload</span>
            </>
          )}
        </div>

        {/* Duration Badge (bottom-right) */}
        <div className="absolute bottom-[7px] right-[7px] bg-black/60 text-white text-[10px] font-mono py-[2px] px-[5px] rounded tracking-tight">
          {video.duration}
        </div>

        {/* Gordon Action Button (top-right, hover only, analyzed only) */}
        {video.status === "analyzed" && (
          <button
            onClick={handleGordonClick}
            className="absolute top-[7px] right-[7px] hidden group-hover:flex items-center gap-1 bg-fill-primary text-on-primary text-[10px] font-semibold py-[3px] px-[6px] rounded hover:opacity-90 transition-opacity z-10 cursor-pointer"
          >
            <TbRobot className="text-xs" />
            <span>Gordon</span>
          </button>
        )}
      </div>

      {/* 2. Info Region (padding 9px 11px) */}
      <div className="py-2.5 px-3 flex flex-col justify-between flex-1 min-h-[56px] border-t border-border-custom/50">
        {/* Video Title */}
        <h3 className="text-[12px] font-medium text-text-primary truncate" title={video.title}>
          {video.title}
        </h3>

        {/* Status Badge + Date Row */}
        <div className="flex items-center justify-between mt-2.5">
          <StatusBadge status={video.status} />
          <span className="text-[11px] text-text-muted">
            {video.date}
          </span>
        </div>
      </div>
    </div>
  )
}
