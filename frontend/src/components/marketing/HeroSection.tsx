'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, animate } from 'framer-motion'
import { ArrowRight, Play, ShieldCheck, Sparkles, TrendingUp, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Animated Counter ──────────────────────────────────────────
function Counter({ from = 0, to, suffix = '' }: { from?: number; to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView || !ref.current) return
    const controls = animate(from, to, {
      duration: 2,
      ease: 'easeOut',
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.floor(v) + suffix
      },
    })
    return controls.stop
  }, [inView, from, to, suffix])

  return <span ref={ref}>{from + suffix}</span>
}

// ── Live Dashboard Card ───────────────────────────────────────
function HeroDashboard() {
  const candidates = [
    { name: 'Arjun Sharma', role: 'Senior React Dev', score: 94, status: 'verified', match: 97 },
    { name: 'Priya Menon', role: 'Full Stack Engineer', score: 88, status: 'verified', match: 91 },
    { name: 'Rohit Gupta', role: 'DevOps Architect', score: 76, status: 'in_progress', match: 84 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, rotateY: -5 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
      className="relative w-full max-w-[520px]"
      style={{ perspective: 1000 }}
    >
      {/* Glow */}
      <div className="absolute inset-0 bg-glow-primary blur-3xl opacity-40 scale-110 -z-10" />

      {/* Main card */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-card-hover">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-trust-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Live Hiring Intelligence</span>
          </div>
          <Badge variant="trust" className="text-[10px] h-5">VERIQO ATS</Badge>
        </div>

        {/* ATS Match section */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Matched Candidates
            </p>
            <span className="text-xs text-trust-500 font-medium">3 of 847 screened</span>
          </div>
          <div className="space-y-2.5">
            {candidates.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.15 }}
                className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 border border-white/5 hover:border-primary/20 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {c.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.role}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Match</p>
                    <p className="text-xs font-bold text-trust-400">{c.match}%</p>
                  </div>
                  <div
                    className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center',
                      c.status === 'verified' ? 'bg-trust-500/20' : 'bg-amber-500/20'
                    )}
                  >
                    <ShieldCheck
                      size={12}
                      className={c.status === 'verified' ? 'text-trust-400' : 'text-amber-400'}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust scores row */}
        <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-white/5">
          {[
            { label: 'Trust Score', value: '94/100', color: 'text-trust-400', icon: ShieldCheck },
            { label: 'ATS Match', value: '97%', color: 'text-primary-400', icon: Zap },
            { label: 'Fraud Risk', value: 'Low', color: 'text-trust-400', icon: TrendingUp },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-lg bg-white/5 p-2.5 text-center border border-white/5">
              <Icon size={14} className={cn('mx-auto mb-1', color)} />
              <p className={cn('text-sm font-bold', color)}>{value}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline status */}
        <div className="px-5 py-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verification Pipeline</span>
          </div>
          <div className="flex items-center gap-1.5">
            {['Portfolio', 'Work Sample', 'AI Eval', 'Expert', 'Passport'].map((stage, i) => (
              <div key={stage} className="flex items-center gap-1.5 flex-1">
                <div className="flex-1">
                  <div className={cn(
                    'h-1.5 rounded-full',
                    i < 4 ? 'bg-trust-500' : i === 4 ? 'bg-primary-500' : 'bg-border'
                  )} />
                  <p className="text-[8px] text-muted-foreground mt-1 text-center truncate">{stage}</p>
                </div>
                {i < 4 && <div className="h-px w-1.5 bg-border shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        className="absolute -top-4 -right-4 glass rounded-xl border border-trust-500/20 px-3 py-2 shadow-glow-trust"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-trust-400" />
          <span className="text-xs font-semibold text-trust-400">Passport Generated</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-4 -left-4 glass rounded-xl border border-primary/20 px-3 py-2 shadow-glow-sm"
      >
        <div className="flex items-center gap-2">
          <Users size={14} className="text-primary-400" />
          <span className="text-xs font-semibold">847 resumes → 3 verified</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Trust Stats ───────────────────────────────────────────────
const STATS = [
  { value: 94, suffix: '%', label: 'Offer Acceptance Rate' },
  { value: 73, suffix: '%', label: 'Reduction in No-Shows' },
  { value: 12, suffix: 'x', label: 'Faster Shortlisting' },
  { value: 2800, suffix: '+', label: 'Verified Candidates' },
]

// ── Main Hero ─────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-hero-gradient pt-16">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-100" />

      {/* Gradient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-glow-primary" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="text-center lg:text-left">
            {/* Announcement badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 mb-8"
            >
              <Sparkles size={13} className="text-primary-400" />
              <span className="text-xs font-medium text-primary-300">
                Introducing Veriqo 2.0 — AI-Powered Hiring Intelligence
              </span>
              <ArrowRight size={12} className="text-primary-400" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
            >
              <span className="gradient-text-hero">Verified Hiring.</span>
              <br />
              <span className="text-white">Reduced Risk.</span>
              <br />
              <span className="gradient-text">Better Talent.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-navy-300 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0"
            >
              Receive technically validated and verified candidates instead of thousands of resumes.
              Stop wasting time on no-shows and unqualified applicants.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12"
            >
              <Link href="/auth/register?role=employer">
                <Button variant="glow" size="xl" className="gap-2.5 w-full sm:w-auto">
                  <Sparkles size={16} />
                  Book a Free Demo
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <button className="flex items-center gap-3 group">
                <div className="h-11 w-11 rounded-full border border-white/20 bg-white/5 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-200">
                  <Play size={14} className="text-white ml-0.5" fill="white" />
                </div>
                <span className="text-sm font-medium text-navy-300 group-hover:text-white transition-colors">
                  Watch Platform Tour
                </span>
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2"
            >
              {[
                'No credit card required',
                'SOC 2 compliant',
                'GDPR ready',
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-trust-500" />
                  <span className="text-xs text-navy-400">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Dashboard */}
          <div className="flex justify-center lg:justify-end">
            <HeroDashboard />
          </div>
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/30 rounded-2xl overflow-hidden border border-border/30"
        >
          {STATS.map(({ value, suffix, label }) => (
            <div
              key={label}
              className="bg-background/20 backdrop-blur-sm px-6 py-6 text-center hover:bg-primary/5 transition-colors"
            >
              <p className="font-heading text-3xl font-extrabold text-white mb-1">
                <Counter to={value} suffix={suffix} />
              </p>
              <p className="text-xs text-navy-400">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
