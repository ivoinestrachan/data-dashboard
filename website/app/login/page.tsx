"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { useGordonStore } from "@/store/useGordonStore"

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useGordonStore()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [customName, setCustomName] = useState("")
  const [customEmail, setCustomEmail] = useState("")

  const handleSignIn = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const result = await signIn("credentials", {
        username: "admin",
        password: "admin",
        redirect: false,
        callbackUrl: "/dashboard"
      })

      if (result?.error) {
        setErrorMessage("Authentication failed")
        setLoading(false)
        return
      }

      const name = customName.trim() || "Operator"
      const email = customEmail.trim() || "operator@ramarm.ai"
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
      setUser({ id: "session-user", name, email, avatar })

      router.push("/dashboard")
    } catch {
      setErrorMessage("Connection failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-800 p-4 relative overflow-hidden">

      {/* Animated background gradient orbs - Apple style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-slate-200/40 to-blue-200/40 rounded-full blur-3xl"
        />
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white/90 backdrop-blur-xl border border-red-200/50 text-red-600 px-6 py-3 rounded-2xl shadow-2xl shadow-red-500/10 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="ml-2 text-red-400 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card with glassmorphism */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-slate-900/5 border border-white/20 p-10 relative overflow-hidden">

          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none rounded-[2rem]" />

          <div className="relative z-10">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/20 to-slate-500/20 rounded-3xl blur-xl" />
                <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 rounded-2xl border-2 border-white/30 animate-[spin_20s_linear_infinite]">
                    <div className="w-2 h-2 rounded-full bg-white/60 mt-1 ml-1" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-10"
            >
              <h1 className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Sign in to continue to 2arm
              </p>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4 mb-6"
            >
              <div>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  placeholder="Name (optional)"
                  className="w-full px-5 py-3.5 bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 focus:border-slate-400 focus:bg-white/80 rounded-2xl text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-4 focus:ring-slate-200/40 transition-all"
                />
              </div>
              <div>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  placeholder="Email (optional)"
                  className="w-full px-5 py-3.5 bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 focus:border-slate-400 focus:bg-white/80 rounded-2xl text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-4 focus:ring-slate-200/40 transition-all"
                />
              </div>
            </motion.div>

            {/* Sign in button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={handleSignIn}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-semibold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign in"
              )}
            </motion.button>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-slate-400 text-center mt-8 leading-relaxed"
            >
              By continuing, you agree to our{" "}
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors underline">
                Privacy Policy
              </a>
            </motion.p>
          </div>
        </div>

        {/* Bottom hint */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-slate-400">
            Industrial robot motion training platform
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
