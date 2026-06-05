'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, Lock, Info, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const SCORE_COMPONENTS = [
  {
    key: 'ats_score', label: 'ATS Match Score', value: 94, weight: 20,
    icon: TrendingUp, color: 'text-primary-400', bg: 'bg-primary/10',
    description: 'How well your profile matches job requirements via AI vector search',
    status: 'completed',
  },
  {
    key: 'portfolio_score', label: 'Portfolio Score', value: 88, weight: 20,
    icon: CheckCircle2, color: 'text-trust-400', bg: 'bg-trust-500/10',
    description: 'Authenticity and quality of GitHub, Behance, or portfolio projects',
    status: 'completed',
  },
  {
    key: 'work_sample_score', label: 'Work Sample Score', value: 85, weight: 25,
    icon: CheckCircle2, color: 'text-indigo-400', bg: 'bg-indigo/10',
    description: 'Domain-specific task evaluated by AI + expert reviewer',
    status: 'completed',
  },
  {
    key: 'technical_score', label: 'Technical Score', value: 92, weight: 20,
    icon: CheckCircle2, color: 'text-cyan-400', bg: 'bg-cyan/10',
    description: 'Expert-assessed technical knowledge and problem-solving ability',
    status: 'completed',
  },
  {
    key: 'communication_score', label: 'Communication Score', value: null, weight: 10,
    icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10',
    description: 'Assessed during the expert verification interview',
    status: 'in_progress',
  },
  {
    key: 'reliability_score', label: 'Reliability Score', value: null, weight: 5,
    icon: Lock, color: 'text-muted-foreground', bg: 'bg-muted',
    description: 'Interview attendance, response rate, and historical joining data',
    status: 'pending',
  },
]

const FRAUD_CHECKS = [
  { label: 'Education vs Experience Timeline', passed: true },
  { label: 'Skill Consistency Check', passed: true },
  { label: 'GitHub Activity Authenticity', passed: true },
  { label: 'Project Complexity Validation', passed: true },
  { label: 'Salary Expectation vs Market', passed: true },
  { label: 'AI-Generated Content Detection', passed: true },
  { label: 'Document Verification', passed: true },
  { label: 'Profile Completeness', passed: true },
]

function ScoreDonut({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size - 12) / 2
  const circ = r * 2 * Math.PI
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="font-heading text-xl font-extrabold" style={{ color }}>{score}</span>
        <span className="block text-[9px] text-muted-foreground">/100</span>
      </div>
    </div>
  )
}

export default function TrustScorePage() {
  const ref   = useRef(null)
  const inView = useInView(ref, { once: true })

  const completedScores = SCORE_COMPONENTS.filter(s => s.value !== null)
  const totalWeightUsed = completedScores.reduce((acc, s) => acc + s.weight, 0)
  const weightedSum     = completedScores.reduce((acc, s) => acc + (s.value! * s.weight), 0)
  const overallScore    = totalWeightUsed > 0 ? Math.round(weightedSum / totalWeightUsed) : 0

  return (
    <div ref={ref} className="space-y-6 max-w-[900px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
      >
        <h1 className="font-heading text-2xl font-bold">Trust Score</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your verification score breakdown — complete all stages to maximise your Trust Score
        </p>
      </motion.div>

      {/* Overall score hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-trust/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Big score ring */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <svg width={128} height={128} className="-rotate-90">
                    <circle cx={64} cy={64} r={54} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
                    <motion.circle
                      cx={64} cy={64} r={54} fill="none"
                      stroke="url(#trustGrad)" strokeWidth={12} strokeLinecap="round"
                      strokeDasharray={339.3}
                      initial={{ strokeDashoffset: 339.3 }}
                      animate={{ strokeDashoffset: 339.3 - (overallScore / 100) * 339.3 }}
                      transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
                    />
                    <defs>
                      <linearGradient id="trustGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading text-3xl font-extrabold gradient-text">{overallScore}</span>
                    <span className="text-[10px] text-muted-foreground">Trust Score</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                  <ShieldCheck size={18} className="text-trust-400" />
                  <span className="font-heading text-lg font-bold">Partially Verified</span>
                  <Badge variant="pending" className="text-[10px]">In Progress</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Complete all 5 verification stages to unlock your full Candidate Passport
                  and maximise your trust score.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Stages Done', value: `${completedScores.length}/6` },
                    { label: 'Fraud Risk', value: 'Low' },
                    { label: 'Join Probability', value: '89%' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-background/50 border border-border p-2 text-center">
                      <p className="font-heading text-sm font-bold text-primary-400">{value}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Score breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Score Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {SCORE_COMPONENTS.map((comp, i) => {
                const Icon = comp.icon
                return (
                  <motion.div
                    key={comp.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.25 + i * 0.07 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      comp.status === 'completed' ? 'border-trust-500/20 bg-trust-500/5' :
                      comp.status === 'in_progress' ? 'border-primary/20 bg-primary/5' :
                      'border-border bg-muted/30 opacity-60'
                    )}
                  >
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', comp.bg)}>
                      <Icon size={15} className={comp.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium truncate">{comp.label}</p>
                        <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{comp.weight}%</span>
                      </div>
                      {comp.value !== null ? (
                        <Progress
                          value={comp.value}
                          className="h-1.5"
                          indicatorClassName={comp.value >= 80 ? 'bg-trust-500' : comp.value >= 60 ? 'bg-amber-500' : 'bg-red-500'}
                        />
                      ) : (
                        <div className="h-1.5 rounded-full bg-muted" />
                      )}
                    </div>
                    <div className="shrink-0 w-10 text-right">
                      {comp.value !== null ? (
                        <span className={cn('text-sm font-bold', comp.color)}>{comp.value}</span>
                      ) : comp.status === 'in_progress' ? (
                        <span className="text-[10px] text-amber-400">Active</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Fraud checks */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Fraud Detection Results</CardTitle>
                <Badge variant="trust" className="text-[10px]">Low Risk</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-trust-500/5 border border-trust-500/20 mb-4">
                <ShieldCheck size={20} className="text-trust-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-trust-400">Fraud Score: 8/100</p>
                  <p className="text-xs text-muted-foreground">Lower score = lower risk</p>
                </div>
              </div>

              <div className="space-y-2">
                {FRAUD_CHECKS.map((check, i) => (
                  <motion.div
                    key={check.label}
                    initial={{ opacity: 0, x: 10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-center gap-2.5 py-1.5"
                  >
                    <CheckCircle2
                      size={13}
                      className={cn(check.passed ? 'text-trust-400' : 'text-red-400')}
                    />
                    <span className="text-xs text-muted-foreground">{check.label}</span>
                    <span className={cn(
                      'ml-auto text-[10px] font-medium',
                      check.passed ? 'text-trust-400' : 'text-red-400'
                    )}>
                      {check.passed ? 'Passed' : 'Failed'}
                    </span>
                  </motion.div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <Info size={13} className="text-primary-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Fraud checks are run automatically by our AI engine. Results are updated
                  each time you update your profile. Employers can see only your risk tier — not individual check details.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tips to improve */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-primary-400" />
              <p className="text-sm font-semibold">How to Improve Your Score</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: 'Complete Expert Interview', desc: 'Unlocks communication score (+10% weight)', action: 'Schedule Now', href: '/candidate/interviews' },
                { title: 'Add More Projects', desc: 'More verified projects increase portfolio score', action: 'Update Portfolio', href: '/candidate/portfolio' },
                { title: 'Link GitHub', desc: 'Authentic GitHub activity boosts trust score', action: 'Connect GitHub', href: '/candidate/settings' },
              ].map((tip) => (
                <div key={tip.title} className="rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
                  <p className="text-xs font-semibold mb-1">{tip.title}</p>
                  <p className="text-[11px] text-muted-foreground mb-3">{tip.desc}</p>
                  <Button variant="outline" size="sm" className="text-xs h-7 w-full gap-1.5">
                    {tip.action} <ExternalLink size={10} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
