"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FiHome, FiVideo, FiSettings, FiLogOut } from "react-icons/fi"
import { signOut } from "next-auth/react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: FiHome },
  { name: "Videos", href: "/dashboard/videos", icon: FiVideo },
  { name: "Settings", href: "/dashboard/settings", icon: FiSettings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-screen w-64 bg-gray-900 text-white">
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <h1 className="text-xl font-bold">Meta Glasses</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-white text-black"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className="text-xl" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 w-full"
        >
          <FiLogOut className="text-xl" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}
