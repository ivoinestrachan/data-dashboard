"use client"

import { useState, useEffect } from "react"
import { useGordonStore } from "@/store/useGordonStore"
import { TbPlus, TbCheck, TbLayoutGrid, TbDownload, TbRobot, TbFlame, TbBox, TbEye, TbScissors } from "react-icons/tb"
import { motion, AnimatePresence } from "framer-motion"

const tasks = [
  {
    id: "pick-place",
    name: "Pick & Place",
    company: "AutoLine GmbH",
    industry: "Automotive, Stuttgart",
    specialty: "3-axis linear arm path",
    level: 97,
    cost: 0,
    avatar: "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=600&q=80",
    specs: { trajectories: "340", gear: "Ray-Ban Meta v2", size: "8.2 GB", accuracy: "98.5%" }
  },
  {
    id: "packaging",
    name: "Box Packaging",
    company: "PackTech Industries",
    industry: "Food & Beverage, Lyon",
    specialty: "Fold & seal sequence",
    level: 91,
    cost: 120,
    avatar: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=600&q=80",
    specs: { trajectories: "210", gear: "Ray-Ban Meta v2", size: "6.4 GB", accuracy: "97.1%" }
  },
  {
    id: "welding",
    name: "Arc Welding",
    company: "WeldBot Corp",
    industry: "Aerospace, Toulouse",
    specialty: "Continuous bead pattern",
    level: 98,
    cost: 180,
    avatar: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80",
    specs: { trajectories: "185", gear: "Ray-Ban Meta Pro", size: "11.3 GB", accuracy: "99.1%" }
  },
  {
    id: "inspection",
    name: "Visual Inspection",
    company: "QualScan Labs",
    industry: "Electronics, Shenzhen",
    specialty: "Multi-point scan path",
    level: 94,
    cost: 150,
    avatar: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&q=80",
    specs: { trajectories: "290", gear: "Ray-Ban Meta v2", size: "9.7 GB", accuracy: "96.8%" }
  },
  {
    id: "assembly",
    name: "Screw Assembly",
    company: "AssemBot SA",
    industry: "Medical Devices, Basel",
    specialty: "Torque-controlled rotation",
    level: 88,
    cost: 90,
    avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    specs: { trajectories: "155", gear: "Ray-Ban Meta v1", size: "7.1 GB", accuracy: "95.3%" }
  }
]

const getCategoryTheme = (category: string) => {
  const themes: Record<string, { gradient: string; icon: any; iconColor: string }> = {
    "pick-place": {
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      icon: TbRobot,
      iconColor: "text-white"
    },
    "packaging": {
      gradient: "from-amber-500 via-orange-500 to-red-500",
      icon: TbBox,
      iconColor: "text-white"
    },
    "welding": {
      gradient: "from-orange-600 via-red-600 to-pink-600",
      icon: TbFlame,
      iconColor: "text-white"
    },
    "inspection": {
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      icon: TbEye,
      iconColor: "text-white"
    },
    "assembly": {
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      icon: TbScissors,
      iconColor: "text-white"
    }
  }
  return themes[category] || themes["pick-place"]
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 24 } as const
  }
}

export default function MarketplacePage() {
  const [isInstalling, setIsInstalling]       = useState<string | null>(null)
  const [installProgress, setInstallProgress] = useState(0)
  const [showCreditModal, setShowCreditModal] = useState(false)

  const {
    activeChef, purchasedChefs, robotCredits,
    setActiveChef, purchaseChef, addCredits, addToast, publishedModels, loadPublishedModels
  } = useGordonStore()

  // Load published models on mount
  useEffect(() => {
    loadPublishedModels()
  }, [])

  const handlePurchase = (taskId: string, cost: number, taskName: string) => {
    if (robotCredits < cost) {
      addToast("Insufficient credits. Please add more credits.", "error")
      return
    }
    setIsInstalling(taskName)
    setInstallProgress(0)
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setInstallProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        addCredits(-cost)
        purchaseChef(taskName)
        setActiveChef(taskName)
        setIsInstalling(null)
        addToast(`Model installed: "${taskName}" ready to deploy on robot`, "success")
      }
    }, 250)
  }

  const handleGetCredits = () => {
    setShowCreditModal(true)
    setTimeout(() => {
      addCredits(100)
      setShowCreditModal(false)
      addToast("✨ +100 credits added! (Demo mode)", "success")
    }, 1500)
  }

  const handleDownload = async (modelId: string, modelName: string) => {
    try {
      addToast("Preparing training dataset...", "info")

      const response = await fetch(`/api/models/${modelId}/download`)

      if (!response.ok) {
        throw new Error('Failed to download dataset')
      }

      const data = await response.json()

      // Create a downloadable JSON file with dataset metadata
      const blob = new Blob([JSON.stringify(data.dataset, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${modelName.replace(/\s+/g, '_')}_training_dataset.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addToast(`Dataset "${modelName}" downloaded! Check the JSON file for video URLs and instructions.`, "success")
    } catch (error) {
      console.error('Download error:', error)
      addToast("Failed to download dataset. Please try again.", "error")
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 select-none">

      {/* Credits header */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-xs"
      >
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Credits Balance</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block">{robotCredits} Credits</span>
        </div>
        <button
          onClick={handleGetCredits}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20"
        >
          <TbPlus className="text-xs stroke-[2.5]" />
          <span>Get +100 Credits</span>
        </button>
      </motion.div>

      {/* Empty State or Task cards grid */}
      {publishedModels.length === 0 ? (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <TbLayoutGrid className="text-3xl text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-2">No Models Published Yet</h3>
          <p className="text-sm text-slate-500 max-w-md">
            Publish your trained motion models from the Data page to share them in the marketplace.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {publishedModels.map((task) => {
            const isPurchased = purchasedChefs.includes(task.name)
            const isActive    = activeChef === task.name
            const theme = getCategoryTheme(task.category || task.id)
            const ThemeIcon = theme.icon

            return (
              <motion.div
                key={task.id}
                variants={cardVariants}
                whileHover={{ y: -3, scale: 1.01, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.04)" }}
                whileTap={{ scale: 0.995 }}
                transition={{ type: "spring", stiffness: 420, damping: 25 }}
                className={`bg-white border rounded-[22px] p-4 flex flex-col justify-between space-y-4 shadow-xs relative text-left transition-colors duration-150 ${
                  isActive ? "border-slate-400" : "border-slate-200/80"
                }`}
              >
              {/* Photo panel with gradient background */}
              <div className="relative w-full h-[135px] rounded-xl overflow-hidden flex flex-col justify-between p-3">
                {task.thumbnailUrl ? (
                  <img
                    src={task.thumbnailUrl}
                    alt={task.name}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}>
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <ThemeIcon className={`text-7xl ${theme.iconColor} opacity-20`} />
                    </motion.div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

                {/* Level badge */}
                <div className="w-full flex items-center justify-between relative z-10">
                  <span className="text-[8px] bg-white/15 backdrop-blur-sm text-white rounded-full px-2 py-0.5 font-bold tracking-wider border border-white/20 uppercase">
                    v{(task.level / 10).toFixed(1)}
                  </span>
                </div>

                {/* Name */}
                <div className="w-full flex items-end justify-between relative z-10">
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-extrabold text-white leading-tight truncate drop-shadow">
                      {task.name}
                    </h4>
                    <span className="text-[8px] text-white/70 font-semibold truncate block mt-0.5">
                      {task.industry}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task info */}
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Motion Path</span>
                <span className="text-[10px] font-bold text-slate-800 truncate block mt-0.5">{task.specialty}</span>
                <span className="text-[8px] text-slate-400 font-semibold block truncate mt-0.5">
                  Recorded via {task.specs.gear} · {task.company}
                </span>
              </div>

              {/* Stats capsule */}
              <div className="bg-slate-50 border border-slate-100 rounded-full py-1.5 px-3 flex items-center justify-around text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                <span className="flex flex-col items-center">
                  <span className="text-slate-800 font-bold text-[9px]">{task.specs.trajectories}</span>
                  <span className="text-[7px] text-slate-400 font-bold scale-90">Paths</span>
                </span>
                <span className="w-[1px] h-3 bg-slate-200" />
                <span className="flex flex-col items-center">
                  <span className="text-slate-800 font-bold text-[9px]">{task.specs.accuracy}</span>
                  <span className="text-[7px] text-slate-400 font-bold scale-90">Accuracy</span>
                </span>
                <span className="w-[1px] h-3 bg-slate-200" />
                <span className="flex flex-col items-center">
                  <span className="text-slate-800 font-bold text-[9px]">{task.specs.size}</span>
                  <span className="text-[7px] text-slate-400 font-bold scale-90">Weight</span>
                </span>
              </div>

              {/* Price footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>Model Price</span>
                <span className="text-[11px] font-bold text-slate-900">
                  {task.cost === 0 ? "Free" : `${task.cost} Credits`}
                </span>
              </div>

              {/* Download Dataset Button */}
              <button
                onClick={() => handleDownload(task.id, task.name)}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg py-2 cursor-pointer transition-all active:scale-[0.98] mt-2"
              >
                <TbDownload className="text-xs stroke-[2.5]" />
                <span>Download Training Dataset</span>
              </button>
            </motion.div>
          )
        })}
        </motion.div>
      )}

      {/* Installation overlay */}
      <AnimatePresence>
        {isInstalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl w-full max-w-[330px] text-center space-y-4"
            >
              <div className="w-9 h-9 rounded-full border-2 border-slate-100 border-t-slate-900 animate-spin mx-auto flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 tracking-tight">Installing Motion Model</h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Compiling trajectory vectors for "{isInstalling}"
                </p>
              </div>
              <div className="w-full h-1 bg-slate-100/80 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-slate-900 rounded-full"
                  animate={{ width: `${installProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                {installProgress}% compiled
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit purchase modal */}
      <AnimatePresence>
        {showCreditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl w-full max-w-[360px] text-center space-y-5"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: 0,
                  ease: "easeInOut"
                }}
                className="text-5xl"
              >
                ✨
              </motion.div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight">Adding Credits</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Demo mode - no payment required
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-2xl font-bold text-slate-900"
                >
                  +100
                </motion.div>
                <span className="text-sm text-slate-600 font-semibold">Credits</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
