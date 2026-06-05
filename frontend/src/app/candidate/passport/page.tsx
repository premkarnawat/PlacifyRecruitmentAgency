'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Shield, Download, Share2, CheckCircle2, AlertTriangle,
  Star, ExternalLink, Copy, QrCode, Award
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'

// ── Radial score ring ────────────────────────────────────────
function ScoreRing({ score, size = 120, strokeWidth = 8, color = '#10B981' }: {
  score: number; size?: number; strokeWidth?: number; color?: string
}) {
  const r = (size - strokeWidth * 2) / 2
  const circumference = r * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-2xl font-extrabold">{score}</span>
        <span className="text-[10px] text-muted-foreground">/100</span>
      </div>
    </div>
  )
}

// ── Score bar row ─────────────────────────────────────────────
function ScoreRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn('text-xs font-bold', color)}>{value}</span>
      </div>
      <Progress
        value={value}
        className="h-1.5"
        indicatorClassName={value >= 80 ? 'bg-trust-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500'}
      />
    </div>
  )
}

// ── Mock passport data ────────────────────────────────────────
const PASSPORT = {
  id: 'VQ-2024-A7K9M',
  candidate: {
    name: 'Arjun Sharma',
    role: 'Senior Full Stack Engineer',
    email: 'arjun@email.com',
    location: 'Bangalore, India',
    experience: 5,
  },
  scores: {
    overall: 91,
    ats: 94,
    portfolio: 88,
    work_sample: 85,
    technical: 92,
    communication: 78,
    reliability: 96,
  },
  fraud_risk: 'low' as const,
  fraud_score: 8,
  joining_probability: 89,
  verification_status: 'verified' as const,
  final_recommendation: 'highly_recommended' as const,
  verified_at: '2024-01-15T10:30:00Z',
  skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'PostgreSQL', 'Docker'],
  expert_notes: 'Strong architectural understanding. Excellent problem-solving approach during live coding. Clear communicator with deep domain knowledge.',
}

const RECOMMENDATION_MAP = {
  highly_recommended: { label: 'Highly Recommended', color: 'text-trust-400', bg: 'bg-trust-500/10 border-trust-500/20', stars: 5 },
  recommended: { label: 'Recommended', color: 'text-primary-400', bg: 'bg-primary/10 border-primary/20', stars: 4 },
  conditional: { label: 'Conditional', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', stars: 3 },
  not_recommended: { label: 'Not Recommended', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', stars: 1 },
}

export default function CandidatePassportPage() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const rec = RECOMMENDATION_MAP[PASSPORT.final_recommendation]

  const copyLink = () => {
    navigator.clipboard.writeText(`https://veriqo.io/passport/${PASSPORT.id}`)
    toast.success('Passport link copied!')
  }

  return (
    <div ref={ref} className="max-w-[900px] space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold">Candidate Passport</h1>
          <p className="text-sm text-muted-foreground">
            Passport ID: <span className="font-mono text-primary-400">{PASSPORT.id}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}>
            <Copy size={13} /> Copy Link
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={13} /> Export PDF
          </Button>
          <Button variant="glow" size="sm" className="gap-2">
            <Share2 size={13} /> Share
          </Button>
        </div>
      </motion.div>

      {/* Passport card — hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-indigo/5 overflow-hidden relative">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-trust-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Left: Identity */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                  <AvatarFallback className="text-lg">{getInitials(PASSPORT.candidate.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-heading text-xl font-bold">{PASSPORT.candidate.name}</h2>
                    <CheckCircle2 size={16} className="text-trust-400" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{PASSPORT.candidate.role}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="verified" className="text-[10px]">
                      <Shield size={9} className="mr-1" />
                      Verified by Veriqo
                    </Badge>
                    <Badge variant="indigo" className="text-[10px]">
                      {PASSPORT.candidate.experience} yrs exp
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {PASSPORT.candidate.location}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="md:ml-auto flex items-center gap-6">
                {/* Trust ring */}
                <div className="text-center">
                  <ScoreRing score={PASSPORT.scores.overall} />
                  <p className="text-[10px] text-muted-foreground mt-1">Trust Score</p>
                </div>

                {/* Recommendation */}
                <div className={cn('rounded-xl border p-4 text-center min-w-[140px]', rec.bg)}>
                  <div className="flex justify-center mb-1.5">
                    {Array.from({ length: rec.stars }).map((_, i) => (
                      <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className={cn('text-sm font-bold', rec.color)}>{rec.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Expert Verdict</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Score breakdown + details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScoreRow label="ATS Match Score" value={PASSPORT.scores.ats} color="text-primary-400" />
              <ScoreRow label="Portfolio Score" value={PASSPORT.scores.portfolio} color="text-indigo-400" />
              <ScoreRow label="Work Sample Score" value={PASSPORT.scores.work_sample} color="text-cyan-400" />
              <ScoreRow label="Technical Score" value={PASSPORT.scores.technical} color="text-trust-400" />
              <ScoreRow label="Communication Score" value={PASSPORT.scores.communication} color="text-amber-400" />
              <ScoreRow label="Reliability Score" value={PASSPORT.scores.reliability} color="text-trust-400" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk + metadata */}
        <div className="space-y-4">
          {/* Fraud risk card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-trust-500/20 bg-trust-500/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield size={15} className="text-trust-400" />
                    <span className="text-sm font-semibold">Fraud Detection</span>
                  </div>
                  <Badge variant="trust" className="text-[10px]">Low Risk</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fraud Score</p>
                    <p className="font-heading text-2xl font-extrabold text-trust-400">{PASSPORT.fraud_score}/100</p>
                    <p className="text-[10px] text-muted-foreground">Lower = safer</p>
                  </div>
                  <div className="space-y-1.5">
                    {['Education verified', 'GitHub authentic', 'Timeline valid', 'AI content: clean'].map((check) => (
                      <div key={check} className="flex items-center gap-1.5">
                        <CheckCircle2 size={10} className="text-trust-400 shrink-0" />
                        <span className="text-[10px] text-muted-foreground">{check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Joining probability */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Joining Probability</span>
                  <span className="font-heading text-2xl font-extrabold text-primary-400">{PASSPORT.joining_probability}%</span>
                </div>
                <Progress value={PASSPORT.joining_probability} className="h-2" indicatorClassName="bg-primary-500" />
                <p className="text-[10px] text-muted-foreground mt-2">
                  Based on interest confirmation, reliability score, and historical joining data
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.35 }}
          >
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-semibold mb-3">Verified Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {PASSPORT.skills.map((skill) => (
                    <Badge key={skill} variant="default" className="text-[10px]">
                      <CheckCircle2 size={9} className="mr-1" />{skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Expert notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award size={15} className="text-primary-400" />
              <p className="text-sm font-semibold">Expert Verification Notes</p>
              <Badge variant="indigo" className="text-[10px] ml-auto">Confidential</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              &ldquo;{PASSPORT.expert_notes}&rdquo;
            </p>
            <Separator className="my-4" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-muted-foreground">
              <span>Passport ID: <span className="font-mono text-foreground">{PASSPORT.id}</span></span>
              <span>Verified: January 15, 2024</span>
              <span className="sm:ml-auto flex items-center gap-1">
                <ExternalLink size={11} />
                <span>Verify at veriqo.io/verify/{PASSPORT.id}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
