"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  TbMenu2, TbEye, TbUpload, TbPlus, TbFlame, TbScissors,
  TbStar, TbLeaf, TbDroplet, TbArrowUp, TbX, TbCheck
} from "react-icons/tb"
import { useGordonStore } from "@/store/useGordonStore"
import { VideoSource, VideoStatus } from "@/types/video"
import { motion, AnimatePresence } from "framer-motion"

interface NavPanelProps {
  isMobileDrawer?: boolean
  onCloseMobile?: () => void
}

const CATEGORIES = [
  "Pick & Place",
  "Packaging",
  "Welding",
  "Visual Inspection",
  "Assembly",
  "Material Handling"
]

export default function NavPanel({ isMobileDrawer = false, onCloseMobile }: NavPanelProps) {
  const router   = useRouter()
  const pathname = usePathname()

  const [showPublish, setShowPublish] = useState(false)
  const [modelName,   setModelName]   = useState("")
  const [category,    setCategory]    = useState(CATEGORIES[0])
  const [company,     setCompany]     = useState("")
  const [industry,    setIndustry]    = useState("")
  const [specialty,   setSpecialty]   = useState("")
  const [isFree,      setIsFree]      = useState(true)
  const [price,       setPrice]       = useState("")
  const [submitted,   setSubmitted]   = useState(false)

  const {
    videos, sourceFilter, setSourceFilter,
    statusFilter, setStatusFilter, setShowUpload, addToast, publishModel, user
  } = useGordonStore()

  const isMarketplace = pathname.startsWith("/dashboard/marketplace")

  const totalCount    = videos.length
  const uploadedCount = videos.filter(v => v.source === "uploaded").length
  const getStatusCount = (s: VideoStatus) => videos.filter(v => v.status === s).length

  const handleUploadClick = () => {
    setShowUpload(true)
    if (pathname !== "/dashboard/gallery" && pathname !== "/dashboard/upload") {
      router.push("/dashboard/gallery")
    }
    if (onCloseMobile) onCloseMobile()
  }

  const handlePublishSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!modelName.trim() || !company.trim() || !industry.trim()) return

    setSubmitted(true)

    // Calculate model statistics from videos in the category
    const categoryVideos = videos.filter(v => v.category === category)
    const trajectoryCount = categoryVideos.length
    const totalDuration = categoryVideos.reduce((acc, v) => {
      const parts = v.duration.split(':')
      return acc + (parseInt(parts[0]) * 60) + parseInt(parts[1] || '0')
    }, 0)
    const sizeGB = (trajectoryCount * 1.5 + Math.random() * 3).toFixed(1) // Rough estimate
    const accuracy = (92 + Math.random() * 7).toFixed(1) // Random 92-99%

    const newModel = {
      id: `model-${Date.now()}`,
      name: modelName,
      company: company,
      industry: industry,
      specialty: specialty || category + " motion path",
      level: parseInt(accuracy),
      cost: isFree ? 0 : parseInt(price) || 0,
      avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(modelName)}`,
      specs: {
        trajectories: trajectoryCount.toString(),
        gear: "Custom Dataset",
        size: sizeGB + " GB",
        accuracy: accuracy + "%"
      }
    }

    publishModel(newModel)

    setTimeout(() => {
      setShowPublish(false)
      setSubmitted(false)
      setModelName("")
      setCompany("")
      setIndustry("")
      setSpecialty("")
      setCategory(CATEGORIES[0])
      setIsFree(true)
      setPrice("")
      addToast(`"${modelName}" published to the marketplace!`, "success")
      router.push("/dashboard/marketplace")
    }, 1200)
  }

  const sourceItems = [
    { id: "all",      label: "All",         icon: TbMenu2,  count: totalCount    },
    { id: "uploaded", label: "Uploaded",     icon: TbUpload, count: uploadedCount }
  ]

  const statusItems = [
    { id: "all",        label: "All",        color: null              },
    { id: "analyzed",   label: "Analyzed",   color: "bg-green-400/70" },
    { id: "pending",    label: "Pending",    color: "bg-amber-400/70" },
    { id: "processing", label: "Processing", color: "bg-blue-400/70"  }
  ]

  const marketplaceCategories = [
    { label: "All Tasks",          icon: TbMenu2    },
    { label: "Pick & Place",       icon: TbStar     },
    { label: "Packaging",          icon: TbDroplet  },
    { label: "Welding",            icon: TbFlame    },
    { label: "Inspection",         icon: TbLeaf     },
    { label: "Assembly",           icon: TbScissors }
  ]

  return (
    <>
      <div className={`flex flex-col h-full bg-white border-r border-border-custom py-4 px-2.5 w-[220px] flex-shrink-0 select-none overflow-y-auto ${
        isMobileDrawer ? "w-full border-r-0" : ""
      }`}>

        {isMarketplace ? (
          <>
            <div className="mb-6">
              <div className="px-2 mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Categories</h3>
              </div>
              <nav className="flex flex-col gap-0.5">
                {marketplaceCategories.map((cat, i) => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.label}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-100 cursor-pointer ${
                        i === 0
                          ? "bg-[#efefef] text-text-primary font-semibold"
                          : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
                      }`}
                    >
                      <Icon className="text-xs text-text-secondary shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            <hr className="border-t border-border-custom mb-6 mx-2" />

            <div className="mt-auto pt-4">
              <button
                onClick={() => setShowPublish(true)}
                className="w-full flex items-center justify-center gap-1.5 border border-border-strong text-text-primary rounded-lg py-2 px-3 text-[12px] font-semibold transition-all duration-100 hover:border-text-secondary hover:bg-slate-50 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <TbArrowUp className="text-sm" />
                <span>Publish a Model</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Recordings</h3>
                <button onClick={handleUploadClick} className="hover:text-text-primary p-0.5 text-text-muted cursor-pointer focus:outline-none" title="Add Video">
                  <TbPlus className="text-sm" />
                </button>
              </div>
              <nav className="flex flex-col gap-0.5">
                {sourceItems.map(item => {
                  const Icon = item.icon
                  const isActive = sourceFilter === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setSourceFilter(item.id as "all" | VideoSource); if (onCloseMobile) onCloseMobile() }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-100 cursor-pointer ${
                        isActive ? "bg-[#efefef] text-text-primary font-semibold" : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="text-xs text-text-secondary" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-text-muted font-mono bg-slate-100 px-1.5 py-0.5 rounded-md">{item.count}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            <hr className="border-t border-border-custom mb-6 mx-2" />

            <div className="mb-6">
              <div className="text-[10px] font-medium text-text-muted tracking-wider px-2 mb-3 uppercase">Status</div>
              <nav className="flex flex-col gap-0.5">
                {statusItems.map(item => {
                  const isActive = statusFilter === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setStatusFilter(item.id as "all" | VideoStatus); if (onCloseMobile) onCloseMobile() }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-100 cursor-pointer ${
                        isActive ? "bg-[#efefef] text-text-primary font-semibold" : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.color
                          ? <span className={`w-1.5 h-1.5 rounded-full ${item.color} opacity-80`} />
                          : <span className="w-1.5 h-1.5 rounded-full bg-transparent border border-text-muted/40" />
                        }
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-text-muted font-mono bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {item.id === "all" ? totalCount : getStatusCount(item.id as VideoStatus)}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="mt-auto pt-4">
              <button
                onClick={handleUploadClick}
                className="w-full flex items-center justify-center gap-1.5 border border-border-strong text-text-primary rounded-lg py-2 px-3 text-[12px] font-semibold transition-all duration-100 hover:border-text-secondary hover:bg-slate-50 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <TbPlus className="text-sm" />
                <span>Upload Video</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Publish Model Modal */}
      <AnimatePresence>
        {showPublish && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowPublish(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="bg-white border border-slate-200/80 rounded-[22px] p-6 shadow-xl w-full max-w-[400px] relative space-y-5"
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setShowPublish(false)}
                className="absolute top-4.5 right-4.5 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
              >
                <TbX className="text-sm stroke-[2.5]" />
              </button>

              {/* Header */}
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Publish a Model</h3>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Share your trained trajectory dataset with the community
                </p>
              </div>

              <form onSubmit={handlePublishSubmit} className="space-y-4">
                {/* Model name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={e => setModelName(e.target.value)}
                    placeholder="e.g. My Searing Pack"
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all bg-white cursor-pointer"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Company */}
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

                {/* Industry */}
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

                {/* Specialty */}
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

                {/* Price toggle */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Pricing
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100/80 rounded-xl p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setIsFree(true)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          isFree ? "bg-white text-slate-900 shadow-sm border border-slate-200/80" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFree(false)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          !isFree ? "bg-white text-slate-900 shadow-sm border border-slate-200/80" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Paid
                      </button>
                    </div>

                    <AnimatePresence>
                      {!isFree && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-1.5 overflow-hidden"
                        >
                          <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">Credits</span>
                          <input
                            type="number"
                            min="1"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            placeholder="100"
                            className="w-14 text-[12px] text-slate-800 font-bold bg-transparent outline-none"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Submit */}
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
    </>
  )
}
