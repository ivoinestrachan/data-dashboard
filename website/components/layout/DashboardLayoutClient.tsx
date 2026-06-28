"use client"

import { motion } from "framer-motion"
import AppSidebar from "./AppSidebar"
import MainHeader from "./MainHeader"
import ToastContainer from "../ui/Toast"

export default function DashboardLayoutClient({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen text-slate-900 relative font-sans overflow-hidden">
      {/* Toast Notification Mount */}
      <ToastContainer />

      {/* Modern gradient background with animated orbs */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50"></div>

        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-slate-200/40 to-blue-200/40 rounded-full blur-3xl"
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Unified Sidebar with glassmorphism */}
      <AppSidebar />

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col min-w-0 h-full relative"
      >
        {/* Main Header with glassmorphism */}
        <div className="sticky top-0 z-10 glass border-b border-slate-200/50">
          <MainHeader />
        </div>

        {/* Dynamic sub-page container with smooth transitions */}
        <motion.main
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex-1 overflow-y-auto relative"
        >
          <div className="p-6">
            {children}
          </div>
        </motion.main>
      </motion.div>
    </div>
  )
}
