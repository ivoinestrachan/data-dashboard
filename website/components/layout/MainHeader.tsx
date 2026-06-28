"use client"

import { useState } from "react"
import { TbUpload, TbMenu, TbChevronDown, TbSearch, TbX } from "react-icons/tb"
import { useGordonStore } from "@/store/useGordonStore"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface MainHeaderProps {
  onToggleMobileFilters?: () => void;
}

export default function MainHeader({ onToggleMobileFilters }: MainHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const {
    videos,
    sourceFilter,
    statusFilter,
    user,
    setShowUpload,
    searchQuery,
    setSearchQuery
  } = useGordonStore()

  // Dynamic title based on section + source filter
  let title = "All Recordings"
  if (pathname.startsWith("/dashboard/marketplace")) {
    title = "Marketplace"
  } else if (sourceFilter === "rayban") {
    title = "Ray-Ban Meta"
  } else if (sourceFilter === "uploaded") {
    title = "Uploaded Recordings"
  }

  const handleUploadClick = () => {
    setShowUpload(true)
    if (pathname !== "/dashboard/gallery" && pathname !== "/dashboard/upload") {
      router.push("/dashboard/gallery")
    } else if (pathname === "/dashboard/gallery") {
      const dropzone = document.getElementById("upload-dropzone")
      if (dropzone) {
        dropzone.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  const displayName = user?.name || "Chef Gordon"
  const displayAvatar = user?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=gordon"

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border-custom px-6 py-3.5 flex items-center justify-between select-none h-[58px]">
      {/* Left side: Mobile menu toggle + dynamic title */}
      <div className="flex items-center gap-3">
        {onToggleMobileFilters && (
          <button
            onClick={onToggleMobileFilters}
            className="md:hidden w-8 h-8 flex items-center justify-center border border-border-custom rounded hover:bg-slate-50 cursor-pointer text-text-primary"
            title="Toggle Filters"
          >
            <TbMenu className="text-lg" />
          </button>
        )}

        <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-85">
          <h2 className="text-[14px] font-bold text-text-primary leading-tight">
            {title}
          </h2>
          <TbChevronDown className="text-xs text-text-muted mt-0.5" />
        </div>
      </div>

      {/* Center: Search bar */}
      <div className="flex-1 max-w-md mx-auto px-4">
        <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-lg px-3 py-1.5 h-8">
          <TbSearch className="text-slate-400 text-sm shrink-0" />
          <input
            type="text"
            placeholder="Search recordings..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (pathname !== "/dashboard/gallery") {
                router.push("/dashboard/gallery")
              }
            }}
            className="bg-transparent border-0 outline-none text-xs text-slate-800 placeholder-slate-400 w-full focus:ring-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <TbX className="text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Right side: Profile + Upload button */}
      <div className="flex items-center gap-2.5 relative">
        {/* User profile card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push("/dashboard/settings")}
          className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg p-[4px_8px] cursor-pointer transition-colors"
        >
          <img
            src={displayAvatar}
            alt="Avatar"
            className="w-4 h-4 rounded-md object-cover border border-slate-200/50 bg-slate-100"
          />
          <span className="text-[11px] font-semibold text-slate-700 leading-none truncate max-w-[80px]">
            {displayName}
          </span>
          <TbChevronDown className="text-[9px] text-slate-400" />
        </motion.div>

        {/* Upload button - shown in Creator, hidden in Marketplace */}
        {!pathname.startsWith("/dashboard/marketplace") && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUploadClick}
            className="flex items-center gap-1 bg-slate-950 text-white font-semibold text-[11px] rounded-lg py-1.5 px-3 hover:bg-slate-800 cursor-pointer transition-all"
          >
            <TbUpload className="text-[11px] stroke-[2.5]" />
            <span>Upload</span>
          </motion.button>
        )}
      </div>
    </header>
  )
}
