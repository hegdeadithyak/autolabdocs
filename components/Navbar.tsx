"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "./AuthProvider"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, Coins, ChevronDown, Zap, FileText, Menu, X, Command } from "lucide-react"

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isWorkspace = pathname?.startsWith("/workspace")

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (isWorkspace) return null

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 font-sans antialiased ${
          scrolled ? "bg-[#0c0c0c]/80 backdrop-blur-xl border-b border-white/[0.06]" : "bg-transparent"
        }`}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between">
            {/* Logo */}
            <button onClick={() => router.push("/")} className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <Zap size={14} className="text-[#0c0c0c]" strokeWidth={2.5} />
              </div>
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-white">AutoLabDocs</span>
            </button>

            {/* Center Nav - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: "Features", href: "/#features" },
                { label: "How it works", href: "/how" },
                { label: "Pricing", href: "/how#pricing" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-3 py-1.5 text-[13px] text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-white/[0.06]"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Coins - Minimal */}
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                    <Coins size={12} className="text-amber-500" />
                    <span className="text-[12px] font-medium text-zinc-300 tabular-nums">{user.coins}</span>
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className={`flex items-center gap-2 px-1.5 py-1 rounded-lg transition-colors ${
                        userMenuOpen ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[11px] font-semibold text-white">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown
                        size={12}
                        className={`text-zinc-500 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.12, ease: "easeOut" }}
                          className="absolute right-0 top-full mt-1.5 w-56 py-1 bg-[#1a1a1a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
                        >
                          {/* User Info */}
                          <div className="px-3 py-2.5 border-b border-white/[0.06]">
                            <div className="text-[13px] font-medium text-white truncate">{user.name}</div>
                            <div className="text-[11px] text-zinc-500 truncate mt-0.5">{user.email}</div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setUserMenuOpen(false)
                                router.push("/dashboard")
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                            >
                              <FileText size={14} className="text-zinc-500" />
                              Dashboard
                              <div className="ml-auto flex items-center gap-0.5 text-[10px] text-zinc-600">
                                <Command size={10} />
                                <span>D</span>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setUserMenuOpen(false)
                                logout()
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                            >
                              <LogOut size={14} className="text-zinc-500" />
                              Sign out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/signin")}
                    className="hidden sm:block px-3 py-1.5 text-[13px] text-zinc-400 hover:text-white transition-colors"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => router.push("/signin")}
                    className="px-3.5 py-1.5 bg-white text-[#0c0c0c] rounded-lg text-[13px] font-medium hover:bg-zinc-200 transition-colors"
                  >
                    Get started
                  </button>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-zinc-400 hover:text-white transition-colors"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-[#0c0c0c] md:hidden pt-14"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif',
            }}
          >
            <div className="px-4 py-6 space-y-1">
              {["Features", "How it works", "Pricing"].map((item, i) => (
                <motion.a
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 text-lg text-zinc-300 hover:text-white transition-colors"
                >
                  {item}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
