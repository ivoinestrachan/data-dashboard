"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useGordonStore } from "@/store/useGordonStore"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [statusText, setStatusText] = useState("Verifying credentials...")
  const { setUser, setAccessToken } = useGordonStore()

  useEffect(() => {
    const handleAuth = async () => {
      // Simulate token exchange delay for visual polish
      await new Promise((resolve) => setTimeout(resolve, 1200))
      
      const provider = searchParams.get("provider") || "facebook"
      const code = searchParams.get("code") || "mock_code"
      const customName = searchParams.get("name")
      const customEmail = searchParams.get("email")
      
      setStatusText("Exchanging tokens & synchronizing...")
      await new Promise((resolve) => setTimeout(resolve, 800))

      // 1. Store custom name/email in Zustand memory
      const name = customName || "Chef Gordon"
      const email = customEmail || "chef.gordon@ramarm.ai"
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`

      setUser({
        id: "usr_gordon_1",
        name,
        email,
        avatar
      })
      setAccessToken(`tok_${provider}_${code}_${Date.now()}`)

      // 2. Write standard session cookie so server components authorize access
      document.cookie = `gordon-session=${provider}_mock_token; path=/; max-age=86400;`

      setStatusText("Redirecting to dashboard...")
      await new Promise((resolve) => setTimeout(resolve, 400))

      router.push("/dashboard")
    }

    handleAuth()
  }, [router, searchParams, setUser, setAccessToken])

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Minimalist Spinner */}
      <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-slate-900 animate-spin flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
      </div>

      <div className="space-y-1">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Authenticating Account</h2>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Gordon RamArm</p>
      </div>

      <div className="bg-slate-50 border border-slate-150 py-2.5 px-4 rounded-xl w-full text-center">
        <span className="text-xs font-semibold text-slate-650">
          {statusText}
        </span>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] relative overflow-hidden p-4">
      {/* Panning grid background canvas */}
      <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 bg-white border border-slate-200/80 p-8 rounded-2xl max-w-sm w-full shadow-xl shadow-slate-200/50">
        <Suspense fallback={
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-slate-900 animate-spin flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            </div>
            <div className="space-y-1 text-center">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">Loading Session</h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Please wait...</p>
            </div>
          </div>
        }>
          <CallbackContent />
        </Suspense>
      </div>
    </div>
  )
}
