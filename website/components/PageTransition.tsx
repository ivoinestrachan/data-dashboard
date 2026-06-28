"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  useEffect(() => {
    // First load animation
    if (isFirstLoad) {
      const timer = setTimeout(() => setIsFirstLoad(false), 100)
      return () => clearTimeout(timer)
    }
  }, [isFirstLoad])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={isFirstLoad ? { opacity: 0, scale: 0.98, y: 20 } : { opacity: 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
          mass: 0.8
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
