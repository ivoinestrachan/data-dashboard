"use client"

import { useState } from "react"
import { useGordonStore } from "@/store/useGordonStore"
import { useRouter } from "next/navigation"
import StatusBadge from "./StatusBadge"
import { Video, GestureCategory } from "@/types/video"
import { motion, AnimatePresence } from "framer-motion"
import VideoAnnotator from "@/components/trajectory/VideoAnnotator"
import {
  TbX,
  TbPlayerPlay,
  TbRobot,
  TbEye,
  TbScissors,
  TbFlame,
  TbStar,
  TbDroplet,
  TbUpload,
  TbMovie,
  TbArrowUp,
  TbCheck,
  TbPencil,
  TbRoute
} from "react-icons/tb"

const CATEGORIES = [
  "Pick & Place",
  "Packaging",
  "Welding",
  "Visual Inspection",
  "Assembly",
  "Material Handling"
]

export default function GalleryGrid() {
  const router = useRouter()
  const {
    videos,
    sourceFilter,
    statusFilter,
    categoryFilter,
    setCategoryFilter,
    updateVideoStatus,
    updateVideoTitle,
    setGordonStatus,
    user,
    addToast,
    searchQuery,
    setShowUpload,
    publishModel
  } = useGordonStore()

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [publishingVideo, setPublishingVideo] = useState<Video | null>(null)
  const [modelName, setModelName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<GestureCategory | "">("")
  const [company, setCompany] = useState("")
  const [industry, setIndustry] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [editingVideoId, setEditingVideoId] = useState<string | number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [showTrajectoryPanel, setShowTrajectoryPanel] = useState(false)

  // Filter video listing based on active source/status/category/search selectors
  const filteredVideos = videos.filter((video) => {
    const matchesSource = sourceFilter === "all" || video.source === sourceFilter
    const matchesStatus = statusFilter === "all" || video.status === statusFilter
    const matchesCategory = categoryFilter === "all" || video.category === categoryFilter
    const matchesSearch = searchQuery.trim() === "" || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.category && video.category.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSource && matchesStatus && matchesCategory && matchesSearch
  })

  const getCategoryCount = (category: GestureCategory) => {
    return videos.filter((v) => v.category === category).length
  }

  const handleGordonClick = (e: React.MouseEvent, video: Video) => {
    e.stopPropagation() // Prevent row click details modal trigger

    updateVideoStatus(video.id, "processing")
    setGordonStatus("busy")
    addToast(`Gordon RamArm: Executing action path for ${video.title}`, "info")

    setTimeout(() => {
      // Pick a random category on completion if it was generic
      const categories: GestureCategory[] = [
        "Pick & Place",
        "Welding",
        "Assembly",
        "Packaging",
        "Inspection"
      ]
      const randomCat = categories[Math.floor(Math.random() * categories.length)]
      
      updateVideoStatus(video.id, "analyzed")
      video.category = video.category || randomCat
      video.duration = video.duration === "0:00" ? "1:15" : video.duration

      setGordonStatus("online")
      addToast(`Gordon RamArm: Analysis complete for ${video.title}`, "info")
      
      if (selectedVideo?.id === video.id) {
        setSelectedVideo((prev) => prev ? { ...prev, status: "analyzed", category: video.category } : null)
      }
    }, 7000)
  }

  const handlePublishClick = (e: React.MouseEvent, video: Video) => {
    e.stopPropagation() // Prevent row click details modal trigger

    // Pre-fill form with video data
    setPublishingVideo(video)
    setModelName(video.title)
    setSelectedCategory(video.category || "")
    setSpecialty(video.category ? `${video.category} motion path` : "")
    setCompany("")
    setIndustry("")
  }

  const handleClosePublishModal = () => {
    setPublishingVideo(null)
    setModelName("")
    setSelectedCategory("")
    setCompany("")
    setIndustry("")
    setSpecialty("")
    setSubmitted(false)
  }

  const handleStartRename = (e: React.MouseEvent, video: Video) => {
    e.stopPropagation()
    setEditingVideoId(video.id)
    setEditingName(video.title)
  }

  const handleSaveRename = async (e: React.MouseEvent, videoId: string | number) => {
    e.stopPropagation()
    if (editingName.trim() && editingName !== videos.find(v => v.id === videoId)?.title) {
      try {
        await updateVideoTitle(videoId, editingName.trim())
        addToast("Video renamed successfully", "success")
      } catch (error) {
        addToast("Failed to rename video", "error")
        return // Don't clear editing state if there was an error
      }
    }
    setEditingVideoId(null)
    setEditingName("")
  }

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingVideoId(null)
    setEditingName("")
  }

  const handleRenameKeyDown = async (e: React.KeyboardEvent, videoId: string | number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      await handleSaveRename(e as any, videoId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelRename(e as any)
    }
  }

  const handlePublishSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!publishingVideo || !modelName.trim() || !selectedCategory || !company.trim() || !industry.trim()) return

    setSubmitted(true)

    // Create model from video data
    const categoryVideos = videos.filter(v => v.category === selectedCategory)
    const trajectoryCount = categoryVideos.length || 1

    // Calculate total size from actual video files
    const totalBytes = categoryVideos.reduce((sum, video) => sum + (video.size || 0), 0)
    const totalKB = totalBytes / 1024
    const totalMB = totalBytes / (1024 * 1024)
    const totalGB = totalMB / 1024

    // Format size appropriately (KB, MB, or GB)
    const formattedSize = totalGB >= 1
      ? `${totalGB.toFixed(1)} GB`
      : totalMB >= 1
      ? `${totalMB.toFixed(0)} MB`
      : `${totalKB.toFixed(0)} KB`

    const accuracy = (92 + Math.random() * 7).toFixed(1)

    const newModel = {
      id: `model-${Date.now()}`,
      name: modelName,
      company: company,
      industry: industry,
      specialty: specialty || `${selectedCategory} motion path`,
      category: selectedCategory,
      level: parseInt(accuracy),
      cost: 0,
      avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(modelName)}`,
      videoId: publishingVideo.id,
      thumbnailUrl: publishingVideo.thumbnailUrl,
      specs: {
        trajectories: trajectoryCount.toString(),
        gear: "Custom Dataset",
        size: formattedSize,
        accuracy: accuracy + "%"
      }
    }

    try {
      await publishModel(newModel)

      setTimeout(() => {
        setPublishingVideo(null)
        setSubmitted(false)
        setModelName("")
        setSelectedCategory("")
        setCompany("")
        setIndustry("")
        setSpecialty("")
        addToast(`"${modelName}" published to marketplace!`, "success")
        router.push("/dashboard/marketplace")
      }, 1200)
    } catch (error) {
      setSubmitted(false)
      addToast("Failed to publish model. Please try again.", "error")
    }
  }

  // Folder categories list configurations
  const categoriesList: { name: GestureCategory; icon: any; color: string }[] = [
    { name: "Pick & Place", icon: TbStar,     color: "#0ea5e9" },
    { name: "Welding",      icon: TbFlame,    color: "#f97316" },
    { name: "Assembly",     icon: TbScissors, color: "#6366f1" },
    { name: "Packaging",    icon: TbDroplet,  color: "#10b981" },
    { name: "Inspection",   icon: TbEye,      color: "#a855f7" }
  ]

  // Animations
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  }

  const slideUp = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.25 } as const }
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col p-6 space-y-8 select-none bg-transparent">
      
      {/* 1. Folders Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-bold tracking-wide text-text-primary">
            Folders
          </h3>
          {categoryFilter !== "all" && (
            <button 
              onClick={() => setCategoryFilter("all")}
              className="text-xs text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
        >
          {categoriesList.map((cat) => {
            const count = getCategoryCount(cat.name)
            const isActive = categoryFilter === cat.name

            return (
              <motion.button
                key={cat.name}
                variants={slideUp}
                whileHover={{ y: -3, scale: 1.015, boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.04)" }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                onClick={() => setCategoryFilter(isActive ? "all" : cat.name)}
                className={`flex flex-col items-center justify-between p-5 rounded-[20px] bg-[#fafafb] border h-[145px] text-center cursor-pointer w-full group relative overflow-hidden transition-colors duration-150 ${
                  isActive
                    ? "border-slate-400 shadow-sm bg-white"
                    : "border-slate-200/50 hover:border-slate-350"
                }`}
              >
                {/* Apple-style shiny blue 3D folder graphic - Centered */}
                <div className="relative w-16 h-12 select-none flex justify-center items-center mx-auto mt-1">
                  {/* Rear tab background */}
                  <div className="absolute top-1.5 left-2 w-12 h-9 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg shadow-sm border-t border-blue-300 z-10" />
                  
                  {/* Dynamic Sheets peaking out when files exist (count > 0) */}
                  {count > 0 && (
                    <>
                      {/* Sheet 1 */}
                      <motion.div 
                        key={`sheet1-${count}`}
                        initial={{ y: -16, opacity: 0, rotate: -8 }}
                        animate={{ y: -3, opacity: 1, rotate: -8 }}
                        transition={{ type: "spring", stiffness: 350, damping: 20 }}
                        className="absolute left-2.5 w-7 h-8.5 bg-white border border-slate-200 rounded shadow-xs text-[5px] font-bold text-slate-400 p-0.5 flex flex-col justify-between z-20"
                      >
                        <span className="font-mono text-slate-300 scale-90">MOV</span>
                        <div className="w-full h-0.5 bg-slate-100 rounded-xs" />
                      </motion.div>
                      
                      {/* Sheet 2 */}
                      <motion.div 
                        key={`sheet2-${count}`}
                        initial={{ y: -20, opacity: 0, rotate: 6 }}
                        animate={{ y: -5, opacity: 1, rotate: 6 }}
                        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.04 }}
                        className="absolute left-6 w-7 h-8.5 bg-white border border-slate-200 rounded shadow-xs text-[5px] font-bold text-slate-500 p-0.5 flex flex-col justify-between z-20"
                      >
                        <span className="font-mono text-slate-400 scale-90">MP4</span>
                        <div className="w-full h-0.5 bg-slate-100 rounded-xs" />
                      </motion.div>
                    </>
                  )}

                  {/* Front tab face overlay */}
                  <div className="absolute bottom-0 left-1 w-[52px] h-[31px] bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg border-t border-blue-400 shadow-md flex items-end px-1.5 pb-1 z-35">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300/40" />
                  </div>
                  
                  {/* Folder Tab back */}
                  <div className="absolute top-0.5 left-2.5 w-5 h-1.5 bg-blue-400 rounded-t-sm z-0" />
                </div>

                <div className="text-center w-full mt-2">
                  <h4 className="text-[11px] font-bold text-slate-800 leading-tight truncate w-full" title={cat.name}>
                    {cat.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {count} File{count !== 1 ? "s" : ""}
                  </span>
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      </div>

      {/* 2. Files Section (List View) */}
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        <h3 className="text-[13px] font-bold tracking-wide text-text-primary">
          Files
        </h3>

        {filteredVideos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
            className="w-full h-full min-h-[400px] rounded-3xl border-2 border-dashed border-slate-200/60 bg-gradient-to-br from-white/80 via-white/60 to-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6 relative overflow-hidden group cursor-pointer"
            onClick={() => setShowUpload(true)}
          >
            {/* Subtle gradient orb background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-3xl" />
            </div>

            <motion.div
              className="relative z-10"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/80 flex items-center justify-center shadow-lg shadow-slate-900/5 group-hover:shadow-xl group-hover:shadow-blue-500/10 transition-all duration-300">
                <TbUpload className="text-3xl text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <div className="space-y-3 text-center relative z-10">
              <h3 className="text-lg font-semibold text-slate-700 group-hover:text-slate-900 transition-colors duration-300">
                No videos yet
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Drop your videos here to get started with robot motion training
              </p>
              <div className="flex items-center gap-3 justify-center pt-2">
                <span className="text-xs text-slate-400 font-medium px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60">
                  MP4
                </span>
                <span className="text-xs text-slate-400 font-medium px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60">
                  MOV
                </span>
                <span className="text-xs text-slate-400 font-medium px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60">
                  500 MB max
                </span>
              </div>
            </div>

            <motion.div
              className="absolute bottom-6 text-xs text-slate-400 font-medium relative z-10"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Click or drag files to upload
            </motion.div>
          </motion.div>
        ) : (
          /* Files Table View */
          <div className="bg-white border border-border-custom rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-5 py-3 border-b border-border-custom bg-slate-50/50 text-[10px] font-bold text-text-muted tracking-wider uppercase">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Added By</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1 text-center">Source</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Table Rows (scrollable container) */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              <AnimatePresence>
                {filteredVideos.map((video, idx) => {
                  // Mix contributors to match mockup screenshot
                  let contributorEmail = user?.email || "chef.gordon@ramarm.ai"
                  let contributorName = user?.name || "Chef Gordon"
                  let contributorAvatar = user?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=gordon"

                  if (idx % 3 === 0) {
                    contributorEmail = "kevin@mail.com"
                    contributorName = "Kevin"
                    contributorAvatar = "https://api.dicebear.com/7.x/adventurer/svg?seed=kevin"
                  } else if (idx % 3 === 1) {
                    contributorEmail = "antonwe@gmail.com"
                    contributorName = "Anton"
                    contributorAvatar = "https://api.dicebear.com/7.x/adventurer/svg?seed=anton"
                  }

                  return (
                    <motion.div
                      layout
                      key={video.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ x: 2, backgroundColor: "#fafafb" }}
                      transition={{ type: "spring", stiffness: 350, damping: 26 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedVideo(video)}
                      className="grid grid-cols-12 items-center px-5 py-3.5 border-b border-slate-100/50 cursor-pointer text-[13px] group transition-colors duration-100"
                    >
                      {/* Name */}
                      <div className="col-span-4 flex items-center gap-3 pr-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-slate-800 transition-colors flex-shrink-0">
                          <TbMovie className="text-base" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {editingVideoId === video.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => handleRenameKeyDown(e, video.id)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                className="font-semibold text-slate-800 text-[13px] bg-white border border-slate-300 rounded px-2 py-0.5 outline-none focus:border-slate-500 flex-1 min-w-0"
                              />
                              <button
                                onClick={(e) => handleSaveRename(e, video.id)}
                                className="p-1 hover:bg-emerald-50 rounded text-emerald-600"
                                title="Save (Enter)"
                              >
                                <TbCheck className="text-sm" />
                              </button>
                              <button
                                onClick={handleCancelRename}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400"
                                title="Cancel (Esc)"
                              >
                                <TbX className="text-sm" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-slate-800 block truncate group-hover:text-[#0066cc] transition-colors" title={video.title}>
                                  {video.title}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                  {video.duration}
                                </span>
                              </div>
                              <button
                                onClick={(e) => handleStartRename(e, video)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-all flex-shrink-0"
                                title="Rename video"
                              >
                                <TbPencil className="text-xs" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Added By */}
                      <div className="col-span-2 flex items-center gap-2 pr-2 min-w-0">
                        <img
                          src={contributorAvatar}
                          alt={contributorName}
                          className="w-5 h-5 rounded-full border border-slate-200 bg-slate-50 flex-shrink-0"
                        />
                        <span className="text-[11px] text-slate-600 truncate font-semibold">
                          {contributorEmail}
                        </span>
                      </div>

                      {/* Category */}
                      <div className="col-span-2 flex items-center pr-2">
                        {video.category ? (
                          <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md truncate">
                            {video.category}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No category</span>
                        )}
                      </div>

                      {/* Source */}
                      <div className="col-span-1 flex justify-center">
                        <span className="text-slate-500" title="Uploaded">
                          <TbUpload className="text-base text-purple-500" />
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex justify-center">
                        <StatusBadge status={video.status} />
                      </div>

                      {/* Action buttons on hover */}
                      <div className="col-span-1 flex justify-end gap-1.5">
                        {video.status === "analyzed" ? (
                          <>
                            <button
                              onClick={(e) => handlePublishClick(e, video)}
                              className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 bg-emerald-600 text-white rounded-lg transition-all cursor-pointer active:scale-95 hover:bg-emerald-700"
                              title="Publish to Marketplace"
                            >
                              <TbArrowUp className="text-xs" />
                            </button>
                            <button
                              onClick={(e) => handleGordonClick(e, video)}
                              className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 bg-slate-900 text-white rounded-lg transition-all cursor-pointer active:scale-95 hover:bg-slate-800"
                              title="Send to Gordon Robot"
                            >
                              <TbRobot className="text-xs" />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 group-hover:hidden font-mono">—</span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Side Details Drawer Overlay */}
      <AnimatePresence>
        {selectedVideo && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-30"
              onClick={() => setSelectedVideo(null)}
            />

            {/* Sliding Panel */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed top-0 bottom-0 right-0 w-full sm:w-[420px] bg-white border-l border-border-custom z-40 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border-custom flex items-center justify-between bg-[#f7f7f5]">
                <h3 className="text-sm font-semibold text-text-primary truncate max-w-[80%]">
                  Video Details
                </h3>
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="w-8 h-8 flex items-center justify-center border border-border-custom rounded hover:bg-white text-text-primary cursor-pointer transition-colors"
                  title="Close"
                >
                  <TbX className="text-lg" />
                </button>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {showTrajectoryPanel && selectedVideo.videoUrl ? (
                  /* Trajectory Annotation Panel */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">Trajectory Tracking</h3>
                      <button
                        onClick={() => setShowTrajectoryPanel(false)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Back to Details
                      </button>
                    </div>
                    <VideoAnnotator
                      videoUrl={selectedVideo.videoUrl}
                      videoId={selectedVideo.id.toString()}
                      onSaveTrajectory={async (data) => {
                        try {
                          const response = await fetch('/api/trajectories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                          })
                          if (!response.ok) throw new Error('Failed to save trajectory')
                          addToast('Trajectory saved successfully!', 'success')
                        } catch (error) {
                          console.error('Error saving trajectory:', error)
                          addToast('Failed to save trajectory', 'error')
                        }
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {/* HTML5 Video Player or Preview Area */}
                    <div className="aspect-video w-full rounded-xl bg-[#f7f7f5] border border-border-strong flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
                      {selectedVideo.videoUrl ? (
                        <video
                          src={selectedVideo.videoUrl}
                          poster={selectedVideo.thumbnailUrl || undefined}
                          controls
                          className="w-full h-full object-contain bg-black"
                          preload="metadata"
                        />
                      ) : (
                        <>
                          {selectedVideo.category && (
                            <div className="absolute bottom-0 inset-x-0 px-4 py-3 bg-[#f7f7f5]/80 border-t border-border-custom z-10">
                              <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide block">
                                Detected Category
                              </span>
                              <span className="text-[13px] font-semibold text-text-primary mt-0.5 block">
                                {selectedVideo.category}
                              </span>
                            </div>
                          )}

                          <div className="w-10 h-10 bg-white/8 hover:bg-white/15 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors border border-white/10 relative z-20">
                            <TbPlayerPlay className="text-lg ml-0.5" />
                          </div>
                          <span className="text-[11px] text-text-muted mt-3 relative z-20 font-medium">
                            No video available
                          </span>
                        </>
                      )}
                    </div>
                  </>
                )}

                {!showTrajectoryPanel && (
                  <>
                    {/* Video Title & Badge */}
                    <div className="space-y-2">
                      <h2 className="text-[16px] font-semibold text-text-primary leading-snug">
                        {selectedVideo.title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={selectedVideo.status} />
                      </div>
                    </div>

                    {/* Trajectory Tracking Button */}
                    {selectedVideo.videoUrl && (
                      <button
                        onClick={() => setShowTrajectoryPanel(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]"
                      >
                        <TbRoute className="text-lg" />
                        Track Hand Trajectory
                      </button>
                    )}
                  </>
                )}

                {!showTrajectoryPanel && (
                  /* Meta details list */
                  <div className="bg-[#fafafb] border border-border-custom rounded-xl p-4 space-y-3 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-text-secondary font-medium">Source</span>
                      <span className="font-semibold text-text-primary capitalize">{selectedVideo.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary font-medium">Date Created</span>
                      <span className="font-semibold text-text-primary">{selectedVideo.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary font-medium">Video Duration</span>
                      <span className="font-semibold text-text-primary">{selectedVideo.duration}</span>
                    </div>
                    {selectedVideo.category && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary font-medium">Gesture Category</span>
                        <span className="font-semibold text-text-primary">{selectedVideo.category}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Publish Model Modal */}
      <AnimatePresence>
        {publishingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={handleClosePublishModal}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-xl w-full max-w-[400px] relative space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={handleClosePublishModal}
                className="absolute top-4.5 right-4.5 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
              >
                <TbX className="text-sm stroke-[2.5]" />
              </button>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Publish to Marketplace</h3>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Share your trained trajectory dataset with the community
                </p>
              </div>

              <form onSubmit={handlePublishSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={e => setModelName(e.target.value)}
                    placeholder="e.g. Advanced Pick & Place Model"
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={e => {
                      const cat = e.target.value as GestureCategory | ""
                      setSelectedCategory(cat)
                      if (cat) {
                        setSpecialty(`${cat} motion path`)
                      }
                    }}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. AutoLine GmbH"
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    placeholder="e.g. Automotive, Stuttgart"
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Specialty <span className="text-slate-300">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    placeholder="e.g. 3-axis linear arm path"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitted}
                  className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-[12px] rounded-xl py-2.5 cursor-pointer transition-all active:scale-[0.98] disabled:cursor-default"
                >
                  {submitted ? (
                    <>
                      <TbCheck className="text-emerald-400 stroke-[2.5]" />
                      <span>Published!</span>
                    </>
                  ) : (
                    <>
                      <TbArrowUp className="text-sm stroke-[2.5]" />
                      <span>Publish to Marketplace</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
