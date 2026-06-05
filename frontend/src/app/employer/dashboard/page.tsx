'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Briefcase, Users, ShieldCheck, CalendarCheck, TrendingUp,
  ArrowRight, Clock, AlertTriangle, Plus, FileText
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { getInitials, getScoreColor, formatRelativeTime } from '@/lib/utils'

// ── Mock data (replace with real API calls) ───────────────────
const HIRE_FUNNEL_DATA = [
  { month: 'Aug', applied: 420, verified: 89, hired: 12 },
  { month: 'Sep', applied: 380, verified: 74, hired: 9 },
  { month: 'Oct', applied: 510, verified: 103, hired: 15 },
  { month: 'Nov', applied: 445, verified: 91, hired: 11 },
  { month: 'Dec', applied: 390, verified: 78, hired: 10 },
  { month: 'Jan', applied: 560, verified: 118, hired: 18 },
]

const QUALITY_DATA = [
  { name: 'Portfolio', score: 82 },
  { name: 'Work Sample', score: 76 },
  { name: 'Technical', score: 88 },
  { name: 'Communication', score: 71 },
  { name: 'Reliability', score: 94 },
]

const RECENT_CANDIDATES = [
  { name: 'Arjun Sharma', role: 'Senior React Developer', score: 94, status: 'verified', risk: 'low', time: '2h ago' },
  { name: 'Priya Menon', role: 'Full Stack Engineer', score: 88, status: 'verified', risk: 'low', time: '4h ago' },
  { name: 'Rohit Gupta', role: 'DevOps Engineer', score: 76, status: 'in_progress', risk: 'medium', time: '6h ago' },
  { name: 'Neha Singh', role: 'UI/UX Designer', score: 91, status: 'verified', risk: 'low', time: '1d ago' },
  { name: 'Karan Patel', role: 'Backend Engineer', score: 63, status: 'pending', risk: 'high', time: '1d ago' },
]

const ACTIVE_JOBS = [
  { title: 'Senior React Developer', applicants: 143, shortlisted: 8, status: 'active' },
  { title: 'DevOps Engineer', applicants: 89, shortlisted: 4, status: 'active' },
  { title: 'Product Designer', applicants: 67, shortlisted: 5, status: 'active' },
  { title: 'Backend Engineer (Python)', applicants: 201, shortlisted: 12, status: 'active' },
]

function SectionHeader({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-heading text-base font-semibold">{children}</h2>
      {action}
    </div>
  )
}

export default function EmployerDashboardPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <div ref={ref} className="space-y-6 max-w-[1400px]">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold">Good morning! 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            You have <span className="text-primary font-semibold">12 new verified candidates</span> ready for review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/employer/jobs/new">
            <Button variant="glow" size="sm" className="gap-2">
              <Plus size={14} />
              Post New Job
            </Button>
          </Link>
          <Link href="/employer/upload">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText size={14} />
              Upload Candidates
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Active Jobs', value: 12, change: 20, changeLabel: 'vs last month', icon: Briefcase, iconColor: 'text-primary-400', iconBg: 'bg-primary/10' },
          { title: 'Verified Candidates', value: 248, change: 35, changeLabel: 'this month', icon: ShieldCheck, iconColor: 'text-trust-400', iconBg: 'bg-trust-500/10' },
          { title: 'Interviews Scheduled', value: 18, change: 12, changeLabel: 'this week', icon: CalendarCheck, iconColor: 'text-indigo-400', iconBg: 'bg-indigo/10' },
          { title: 'Offer Acceptance', value: 94, suffix: '%', change: 8, changeLabel: 'vs industry avg 61%', icon: TrendingUp, iconColor: 'text-cyan-400', iconBg: 'bg-cyan/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hiring funnel chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Hiring Funnel — Last 6 Months</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={HIRE_FUNNEL_DATA}>
                  <defs>
                    <linearGradient id="appliedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="verifiedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="applied" stroke="#2563EB" strokeWidth={2} fill="url(#appliedGrad)" name="Applied" />
                  <Area type="monotone" dataKey="verified" stroke="#10B981" strokeWidth={2} fill="url(#verifiedGrad)" name="Verified" />
                  <Area type="monotone" dataKey="hired" stroke="#06B6D4" strokeWidth={2} fill="none" name="Hired" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Candidate quality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Avg Candidate Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {QUALITY_DATA.map((q) => (
                <div key={q.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">{q.name}</span>
                    <span className={`text-xs font-semibold ${getScoreColor(q.score)}`}>{q.score}</span>
                  </div>
                  <Progress
                    value={q.score}
                    className="h-1.5"
                    indicatorClassName={q.score >= 80 ? 'bg-trust-500' : q.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent verified candidates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.45 }}
        >
          <Card>
            <CardContent className="p-5">
              <SectionHeader
                action={
                  <Link href="/employer/candidates">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
                      View all <ArrowRight size={12} />
                    </Button>
                  </Link>
                }
              >
                Recent Verified Candidates
              </SectionHeader>
              <div className="space-y-3">
                {RECENT_CANDIDATES.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-[11px]">{getInitials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.role}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold ${getScoreColor(c.score)}`}>{c.score}</span>
                      <Badge
                        variant={c.status === 'verified' ? 'verified' : c.status === 'in_progress' ? 'pending' : 'warning'}
                        className="text-[10px]"
                      >
                        {c.status === 'verified' ? '✓ Verified' : c.status === 'in_progress' ? 'In Review' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className="p-5">
              <SectionHeader
                action={
                  <Link href="/employer/jobs">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary">
                      View all <ArrowRight size={12} />
                    </Button>
                  </Link>
                }
              >
                Active Jobs
              </SectionHeader>
              <div className="space-y-3">
                {ACTIVE_JOBS.map((job) => (
                  <div key={job.title} className="p-3 rounded-xl border border-border hover:border-primary/20 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium leading-tight">{job.title}</p>
                      <Badge variant="trust" className="text-[10px] shrink-0">Active</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {job.applicants} applicants
                      </span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={11} className="text-trust-500" /> {job.shortlisted} verified
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress
                        value={Math.round((job.shortlisted / job.applicants) * 100)}
                        className="h-1"
                        indicatorClassName="bg-trust-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
