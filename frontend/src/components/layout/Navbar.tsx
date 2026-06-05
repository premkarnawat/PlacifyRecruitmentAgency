'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, X, ChevronDown, Sun, Moon, Monitor, Shield, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Employers', href: '/employers', description: 'Hire verified talent at scale' },
  { label: 'Candidates', href: '/candidates', description: 'Get your verified passport' },
  { label: 'Experts', href: '/experts', description: 'Join the verification network' },
  { label: 'Community', href: '/community', description: 'Connect and grow together' },
  {
    label: 'Platform',
    href: '#',
    children: [
      { label: 'ATS Engine', href: '/platform/ats', icon: '🎯', desc: 'AI-powered resume matching' },
      { label: 'Trust Score', href: '/platform/trust-score', icon: '🛡️', desc: 'Multi-layer verification' },
      { label: 'Candidate Passport', href: '/platform/passport', icon: '🪪', desc: 'Portable verified identity' },
      { label: 'Fraud Detection', href: '/platform/fraud', icon: '🔍', desc: 'AI + rule-based engine' },
      { label: 'Expert Network', href: '/platform/experts', icon: '👨‍💻', desc: 'Human verification layer' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Security', href: '/security' },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" />

  const icons = { light: Sun, dark: Moon, system: Monitor }
  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
  const Icon = icons[theme as keyof typeof icons] || Monitor

  return (
    <button
      onClick={() => setTheme(next)}
      className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      <Icon size={17} />
    </button>
  )
}

function DropdownMenu({ item }: { item: (typeof NAV_ITEMS)[number] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!('children' in item)) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {item.label}
        <ChevronDown size={14} className={cn('transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-card-hover p-2 z-50"
          >
            {item.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 rounded-xl p-3 hover:bg-accent transition-colors group"
              >
                <span className="text-xl mt-0.5">{child.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {child.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{child.desc}</p>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const { scrollY } = useScroll()
  const lastScrollY = useRef(0)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const delta = latest - lastScrollY.current
    setScrolled(latest > 20)
    if (latest > 100) {
      if (delta > 5) setHidden(true)
      else if (delta < -5) setHidden(false)
    }
    lastScrollY.current = latest
  })

  return (
    <>
      <motion.header
        animate={{ y: hidden ? -80 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-glow-sm">
                <Shield size={16} className="text-white" />
              </div>
              <span className="font-logo text-lg font-bold tracking-tight">
                Veri<span className="gradient-text">qo</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {NAV_ITEMS.map((item) =>
                'children' in item ? (
                  <DropdownMenu key={item.label} item={item} />
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'text-sm font-medium transition-colors duration-150',
                      pathname === item.href
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register?role=employer">
                <Button variant="glow" size="sm" className="gap-1.5">
                  <Sparkles size={14} />
                  Book Demo
                </Button>
              </Link>
            </div>

            {/* Mobile toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen((p) => !p)}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-30 bg-background/95 backdrop-blur-xl border-b border-border lg:hidden"
          >
            <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  {'children' in item ? (
                    <div className="space-y-1">
                      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {item.label}
                      </p>
                      {item.children?.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors"
                        >
                          <span>{child.icon}</span>
                          <span className="text-sm font-medium">{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-accent text-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              <div className="pt-4 border-t border-border flex flex-col gap-2">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Log in</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                  <Button variant="glow" className="w-full gap-2">
                    <Sparkles size={14} />
                    Book Demo
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
