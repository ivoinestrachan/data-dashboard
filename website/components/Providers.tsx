"use client"

import React, { useEffect } from "react"
import { SessionProvider, useSession } from "next-auth/react"
import { useGordonStore } from "@/store/useGordonStore"

function StoreSync() {
  const { data: session } = useSession()
  const { setUser, user } = useGordonStore()

  useEffect(() => {
    if (session?.user && !user) {
      const name = session.user.name || "Operator"
      const email = session.user.email || undefined
      const avatar =
        session.user.image ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
      setUser({ id: "session-user", name, email, avatar })
    }
  }, [session, user, setUser])

  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StoreSync />
      {children}
    </SessionProvider>
  )
}
