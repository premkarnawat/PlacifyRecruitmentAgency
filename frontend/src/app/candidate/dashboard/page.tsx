'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
  ShieldCheck, Send, Eye, CalendarCheck, ArrowRight,
  CheckCircle2, Clock, AlertCircle, Award, Zap, Lock
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const VERIFICATION_STAGES = [
  { id: 'portfolio', label: 'Portfolio Verification', status: 'completed', score: 88, icon: CheckCircle2 },
  { id: 'work_sample', label: 'Work Sample Challenge', status: 'completed', score: 82, icon: CheckCircle2 },
  { id: 'ai_eval', label: 'AI Evaluation', status: 'completed', score: 91, icon: CheckCircle2 },
  { id: 'expert', label: 'Expert Verification', status: 'in_progress', score: null, icon: Clock },
  { id: 'reliability', label: 'Reliability Engine', status: 'pending', score: null, icon: Lock },
]

const RECENT_APPLICATIONS = [
  { company: 'TechCorp India', role: 'Senior React Developer', status: 'shortlisted', date: '2d ago' },
  { company: 'Fintech Startup', role: 'Full Stack Engineer', status: 'interview', date: '4d ago' },
  { company: 'E-Commerce Giant', role: 'Frontend Lead', status: 'applied', date: '1w ago' },
]

export default function CandidateDashboardPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  const overallProgress = 72 // 3 of 5 stages complete

  return (
    <div ref={ref} className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold">Your Verification Journey</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete your verification to unlock your{' '}
            <span className="text-primary font-medium">Candidate Passport</span>
          </p>
        </div>
        <Link href="/candidate/passport">
          <Button variant="glow" size="sm" className="gap-2">
            <Award size={14} />
            View My Passport
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Applications Sent', value: 8, change: 2, icon: Send, iconColor: 'text-primary-400', iconBg: 'bg-primary/10' },
          { title: 'Profile Views', value: 143, change: 28, icon: Eye, iconColor: 'text-cyan-400', iconBg: 'bg-cyan/10' },
          { title: 'Interviews Scheduled', value: 3, icon: CalendarCheck, iconColor: 'text-indigo-400', iconBg: 'bg-indigo/10' },
          { title: 'Trust Score', value: 87, suffix: '/100', icon: ShieldCheck, iconColor: 'text-trust-400', iconBg: 'bg-trust-500/10' },
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

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Journey — spans 2 cols */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Verification Pipeline</CardTitle>
                <span className="text-xs text-muted-foreground">{overallProgress}% complete</span>
              </div>
              <Progress value={overallProgress} className="h-2 mt-2" indicatorClassName="bg-gradient-to-r from-primary-500 to-trust-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              {VERIFICATION_STAGES.map((stage, i) => {
                const Icon = stage.icon
                return (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.35 + i * 0.08 }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all',
                      stage.status === 'completed' && 'border-trust-500/20 bg-trust-500/5',
                      stage.status === 'in_progress' && 'border-primary/30 bg-primary/5',
                      stage.status === 'pending' && 'border-border bg-muted/30 opacity-60'
                    )}
                  >
                    <div className={cn(
                      'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
                      stage.status === 'completed' && 'bg-trust-500/20',
                      stage.status === 'in_progress' && 'bg-primary/20',
                      stage.status === 'pending' && 'bg-muted'
                    )}>
                      <Icon size={16} className={cn(
                        stage.status === 'completed' && 'text-trust-400',
                        stage.status === 'in_progress' && 'text-primary-400',
                        stage.status === 'pending' && 'text-muted-foreground'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{stage.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stage.status === 'completed' && 'Completed successfully'}
                        {stage.status === 'in_progress' && 'Expert review in progress — est. 24h'}
                        {stage.status === 'pending' && 'Unlocks after expert verification'}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      {stage.score !== null ? (
                        <span className="text-lg font-bold text-trust-400">{stage.score}</span>
                      ) : stage.status === 'in_progress' ? (
                        <Badge variant="pending" className="text-[10px]">
                          <Clock size={9} className="mr-1" />In Progress
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Locked</Badge>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Passport preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={16} className="text-primary-400" />
                  <span className="text-sm font-semibold">Candidate Passport</span>
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    { label: 'Trust Score', value: '87/100', color: 'text-trust-400' },
                    { label: 'ATS Score', value: '91/100', color: 'text-primary-400' },
                    { label: 'Fraud Risk', value: 'Low', color: 'text-trust-400' },
                    { label: 'Join Probability', value: '89%', color: 'text-cyan-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className={cn('text-xs font-bold', color)}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-300">
                      Complete expert verification to unlock your shareable passport
                    </p>
                  </div>
                </div>

                <Link href="/candidate/passport">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    View Full Passport
                    <ArrowRight size={12} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Recent Applications</h3>
                  <Link href="/candidate/applications">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7 px-2">
                      View all <ArrowRight size={11} />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {RECENT_APPLICATIONS.map((app) => (
                    <div key={app.company + app.role} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary-400">
                        {app.company[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{app.role}</p>
                        <p className="text-[10px] text-muted-foreground">{app.company}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge
                          variant={app.status === 'shortlisted' || app.status === 'interview' ? 'verified' : 'default'}
                          className="text-[9px] h-4"
                        >
                          {app.status}
                        </Badge>
                        <p className="text-[9px] text-muted-foreground mt-1">{app.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
