"use client"

import { useState } from "react"
import { useGordonStore } from "@/store/useGordonStore"
import { useRouter } from "next/navigation"
import {
  TbRobot,
  TbLogout,
  TbCpu,
  TbEye,
  TbDatabase,
  TbVector,
  TbCheck
} from "react-icons/tb"
import { motion } from "framer-motion"

const TASK_CONFIGS: Record<string, {
  subtitle: string
  specs: { trajectories: string; gear: string; size: string; accuracy: string }
  skills: { name: string; value: number }[]
}> = {
  "Pick & Place": {
    subtitle: "AutoLine GmbH · Automotive",
    specs: { trajectories: "340 Paths", gear: "Ray-Ban Meta v2", size: "8.2 GB", accuracy: "98.5%" },
    skills: [
      { name: "Linear Arm Path (3-axis)", value: 98 },
      { name: "Gripper Release Timing",   value: 95 },
      { name: "Placement Precision",       value: 92 }
    ]
  },
  "Box Packaging": {
    subtitle: "PackTech Industries · Food & Bev",
    specs: { trajectories: "210 Paths", gear: "Ray-Ban Meta v2", size: "6.4 GB", accuracy: "97.1%" },
    skills: [
      { name: "Box Fold Sequence",    value: 97 },
      { name: "Seal Pressure Control",value: 94 },
      { name: "Label Application",    value: 89 }
    ]
  },
  "Arc Welding": {
    subtitle: "WeldBot Corp · Aerospace",
    specs: { trajectories: "185 Paths", gear: "Ray-Ban Meta Pro", size: "11.3 GB", accuracy: "99.1%" },
    skills: [
      { name: "Continuous Bead Pattern", value: 99 },
      { name: "Heat Zone Control",        value: 97 },
      { name: "Seam Tracking",            value: 94 }
    ]
  },
  "Visual Inspection": {
    subtitle: "QualScan Labs · Electronics",
    specs: { trajectories: "290 Paths", gear: "Ray-Ban Meta v2", size: "9.7 GB", accuracy: "96.8%" },
    skills: [
      { name: "Multi-point Scan Path",  value: 97 },
      { name: "Defect Detection Speed", value: 94 },
      { name: "Report Generation",      value: 90 }
    ]
  },
  "Screw Assembly": {
    subtitle: "AssemBot SA · Medical Devices",
    specs: { trajectories: "155 Paths", gear: "Ray-Ban Meta v1", size: "7.1 GB", accuracy: "95.3%" },
    skills: [
      { name: "Torque-controlled Rotation", value: 95 },
      { name: "Thread Alignment",            value: 92 },
      { name: "Assembly Speed",              value: 88 }
    ]
  }
}

const DEFAULT_CONFIG = {
  subtitle: "ramarm-studio · Custom",
  specs: { trajectories: "—", gear: "Ray-Ban Meta v2", size: "—", accuracy: "—" },
  skills: [
    { name: "Motion Path Coverage", value: 80 },
    { name: "Trajectory Accuracy",  value: 80 },
    { name: "Cycle Repeatability",  value: 80 }
  ]
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } as const }
}

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"robot" | "account">("robot")

  const {
    user, setUser, setAccessToken, addToast,
    activeChef, gordonStatus, setGordonStatus
  } = useGordonStore()

  const displayName   = user?.name   || "Operator"
  const displayEmail  = user?.email  || "operator@ramarm.ai"
  const displayAvatar = user?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=gordon"

  const activeConfig = TASK_CONFIGS[activeChef] ?? DEFAULT_CONFIG

  const handleLogout = async () => {
    document.cookie = "gordon-session=; path=/; max-age=0;"
    setUser(null)
    setAccessToken(null)
    addToast("Logged out successfully.", "info")
    router.push("/login")
  }

  const handleCalibrate = () => {
    addToast("Calibrating joint trajectories and vector weights...", "info")
    setGordonStatus("busy")
    setTimeout(() => {
      setGordonStatus("online")
      addToast("Arm alignment optimized successfully.", "success")
    }, 3000)
  }

  const handleTestPath = () => {
    addToast("Loading test trajectory vectors...", "info")
    setGordonStatus("busy")
    setTimeout(() => {
      setGordonStatus("online")
      addToast("Trajectory test complete. Motor paths alignment clean.", "success")
    }, 3500)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 select-none">

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.06, rotate: [0, -5, 5, 0] }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs cursor-pointer"
        >
          <TbRobot className="text-xl" />
        </motion.div>
        <div>
          <h1 className="text-base font-bold text-slate-800 tracking-tight">Robot Control Center</h1>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Manage your robot's active motion model and hardware integrations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 gap-6 text-xs font-bold text-slate-400">
        {(["robot", "account"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 cursor-pointer relative capitalize transition-colors duration-150 ${
              activeTab === tab ? "text-slate-950" : "hover:text-slate-700"
            }`}
          >
            {tab === "robot" ? "Robot Manager" : "Account & Devices"}
            {activeTab === tab && (
              <motion.div
                layoutId="settingsTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-950"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        {activeTab === "robot" && (
          <>
            {/* Robot telemetry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div variants={cardVariants} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">RamArm Robot v1.0</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    gordonStatus === "online" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    gordonStatus === "busy"   ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                               "bg-slate-50 text-slate-500 border border-slate-100"
                  }`}>
                    {gordonStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <TbCpu className="text-[10px]" /> Trajectory Accuracy
                    </span>
                    <p className="text-xs font-bold text-slate-700 mt-1">{activeConfig.specs.accuracy}</p>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <TbDatabase className="text-[10px]" /> Model Size
                    </span>
                    <p className="text-xs font-bold text-slate-700 mt-1">{activeConfig.specs.size}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleCalibrate}
                    disabled={gordonStatus === "busy"}
                    className="flex-1 bg-slate-950 hover:bg-slate-800 text-white font-bold text-[10px] py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Calibrate Trajectories
                  </button>
                  <button
                    onClick={handleTestPath}
                    disabled={gordonStatus === "busy"}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[10px] py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Test Motor Paths
                  </button>
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Diagnostics</span>
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                      <span>Joint Battery</span><span>98%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[98%] h-full bg-slate-900 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                      <span>Joint Temperature</span><span>Optimal</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[45%] h-full bg-slate-600 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Motion metrics */}
            <motion.div variants={cardVariants} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Motion Path Metrics</h3>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                    Performance indicators for the active deployed model
                  </p>
                </div>
                <div className="px-2 py-1 rounded-md border border-slate-100 bg-slate-50">
                  <span className="text-[9px] font-bold text-slate-700">{activeChef} — Active</span>
                </div>
              </div>
              <div className="space-y-3.5">
                {activeConfig.skills.map((skill, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>{skill.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{skill.value}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.value}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-slate-900 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Active model card */}
            <motion.div variants={cardVariants} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">Active Motion Model</h3>
              <div className="flex items-center gap-4 bg-[#f7f7f5] p-4 rounded-xl border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                  <TbRobot className="text-white text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800">{activeChef}</h4>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 font-semibold">{activeConfig.subtitle}</p>
                  <div className="flex items-center gap-4 mt-2 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-0.5"><TbVector className="text-[10px]" /> {activeConfig.specs.trajectories}</span>
                    <span className="flex items-center gap-0.5"><TbEye className="text-[10px]" /> {activeConfig.specs.gear}</span>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase">
                  <TbCheck className="text-[9px] stroke-[3]" />Deployed
                </span>
              </div>
            </motion.div>
          </>
        )}

        {activeTab === "account" && (
          <>
            <motion.div variants={cardVariants} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400">User Profile</h2>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <img src={displayAvatar} alt="Avatar" className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-0.5 object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 truncate">{displayName}</h3>
                  <p className="text-xs text-slate-400 font-semibold truncate mt-0.5">{displayEmail}</p>
                </div>
                <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">
                  Connected
                </span>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400">Hardware & Integrations</h2>
              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <TbEye className="text-base" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Ray-Ban Meta Glasses</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Live video stream capture device</p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase">
                  Active
                </span>
              </div>
            </motion.div>

            <motion.div variants={cardVariants} className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100/70 border border-red-200 text-red-600 hover:text-red-700 font-bold text-xs py-2 rounded-lg cursor-pointer transition-colors"
              >
                <TbLogout className="text-sm" />
                <span>Disconnect Session</span>
              </button>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  )
}
