"use client"

import { VideoStatus } from "@/types/video"

interface StatusBadgeProps {
  status: VideoStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    analyzed: {
      label: "Analyzed",
      bgClass: "bg-bg-success",
      textClass: "text-text-success"
    },
    pending: {
      label: "Pending",
      bgClass: "bg-bg-warning",
      textClass: "text-text-warning"
    },
    processing: {
      label: "Processing",
      bgClass: "bg-bg-accent",
      textClass: "text-text-accent"
    },
    error: {
      label: "Error",
      bgClass: "bg-bg-danger",
      textClass: "text-text-danger"
    }
  }

  const current = config[status] || config.pending

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide leading-none select-none ${current.bgClass} ${current.textClass}`}>
      {current.label}
    </span>
  )
}
