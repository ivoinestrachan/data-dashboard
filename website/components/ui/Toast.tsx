"use client"

import { useGordonStore } from "@/store/useGordonStore"
import { TbX, TbCheck, TbAlertTriangle, TbInfoCircle } from "react-icons/tb"
import { motion, AnimatePresence } from "framer-motion"

export default function ToastContainer() {
  const { toasts, removeToast } = useGordonStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-[340px] pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success"
          const isError = toast.type === "error"

          const accentColor = isSuccess
            ? "bg-green-500"
            : isError
            ? "bg-red-400"
            : "bg-border-accent"

          const Icon = isSuccess ? TbCheck : isError ? TbAlertTriangle : TbInfoCircle

          const iconColor = isSuccess
            ? "text-green-600"
            : isError
            ? "text-red-500"
            : "text-text-accent"

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 bg-white border border-border-custom rounded-xl overflow-hidden"
              style={{ boxShadow: "var(--shadow-float)" }}
            >
              {/* Left accent strip */}
              <div className={`w-1 self-stretch shrink-0 ${accentColor}`} />

              {/* Icon */}
              <div className={`mt-3.5 shrink-0 ${iconColor}`}>
                <Icon className="text-base" />
              </div>

              {/* Message */}
              <span className="flex-1 text-[13px] text-text-primary font-medium leading-relaxed py-3 pr-1">
                {toast.text}
              </span>

              {/* Dismiss */}
              <button
                onClick={() => removeToast(toast.id)}
                className="mt-3 mr-3 text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
                title="Dismiss"
              >
                <TbX className="text-sm" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
