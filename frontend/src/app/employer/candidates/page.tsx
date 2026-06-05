'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, SortAsc, ShieldCheck, AlertTriangle,
  Eye, MessageSquare, Calendar, MoreHorizontal,
  Download, ChevronDown, Award
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn, getInitials, getScoreColor, getFraudRiskColor } from '@/lib/utils'

const MOCK_CANDIDATES = [
  {
    id: '1', name: 'Arjun Sharma', role: 'Senior React Developer',
    location: 'Bangalore', experience: 5, skills: ['React', 'TypeScript', 'Node.js'],
    trust_score: 94, ats_score: 97, portfolio_score: 88,
    fraud_risk: 'low', verification_status: 'verified',
    joining_probability: 89, current_salary: 1800000, expected_salary: 2400000,
    notice_period_days: 30, applied_at: '2d ago',
  },
  {
    id: '2', name: 'Priya Menon', role: 'Full Stack Engineer',
    location: 'Mumbai', experience: 4, skills: ['React', 'Python', 'AWS'],
    trust_score: 88, ats_score: 91, portfolio_score: 84,
    fraud_risk: 'low', verification_status: 'verified',
    joining_probability: 82, current_salary: 1500000, expected_salary: 2200000,
    notice_period_days: 45, applied_at: '4d ago',
  },
  {
    id: '3', name: 'Rohit Gupta', role: 'DevOps Engineer',
    location: 'Pune', experience: 6, skills: ['Kubernetes', 'Docker', 'AWS'],
    trust_score: 76, ats_score: 84, portfolio_score: 71,
    fraud_risk: 'medium', verification_status: 'in_progress',
    joining_probability: 71, current_salary: 1600000, expected_salary: 2100000,
    notice_period_days: 60, applied_at: '6d ago',
  },
  {
    id: '4', name: 'Neha Singh', role: 'UI/UX Designer',
    location: 'Delhi', experience: 3, skills: ['Figma', 'Prototyping', 'Research'],
    trust_score: 91, ats_score: 89, portfolio_score: 95,
    fraud_risk: 'low', verification_status: 'verified',
    joining_probability: 93, current_salary: 1200000, expected_salary: 1800000,
    notice_period_days: 30, applied_at: '1w ago',
  },
  {
    id: '5', name: 'Karan Patel', role: 'Backend Engineer',
    location: 'Ahmedabad', experience: 2, skills: ['Python', 'Django', 'PostgreSQL'],
    trust_score: 63, ats_score: 71, portfolio_score: 58,
    fraud_risk: 'high', verification_status: 'pending',
    joining_probability: 54, current_salary: 900000, expected_salary: 1400000,
    notice_period_days: 15, applied_at: '1w ago',
  },
]

const SCORE_WEIGHTS = [
  { key: 'trust_score',     label: 'Trust',     color: 'bg-trust-500'   },
  { key: 'ats_score',       label: 'ATS',       color: 'bg-primary-500' },
  { key: 'portfolio_score', label: 'Portfolio', color: 'bg-indigo-500'  },
]

function CandidateCard({ candidate, index }: { candidate: typeof MOCK_CANDIDATES[0]; index: number }) {
  const ref   = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const riskColors: Record<string, string> = {
    low:    'text-trust-400',
    medium: 'text-amber-400',
    high:   'text-red-400',
  }
  const riskBg: Record<string, string> = {
    low:    'bg-trust-500/10 border-trust-500/20',
    medium: 'bg-amber-500/10 border-amber-500/20',
    high:   'bg-red-500/10 border-red-500/20',
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card className="group hover:border-primary/30 hover:shadow-glow-sm transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Identity */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Avatar className="h-11 w-11 ring-2 ring-border shrink-0">
                <AvatarFallback className="text-sm">{getInitials(candidate.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <Link href={`/employer/candidates/${candidate.id}`}>
                    <span className="font-heading text-sm font-semibold hover:text-primary transition-colors">
                      {candidate.name}
                    </span>
                  </Link>
                  {candidate.verification_status === 'verified' && (
                    <ShieldCheck size={13} className="text-trust-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {candidate.role} · {candidate.location} · {candidate.experience} yrs
                </p>
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.map((s) => (
                    <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="sm:w-48 space-y-2 shrink-0">
              {SCORE_WEIGHTS.map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cn('font-semibold', getScoreColor(candidate[key as keyof typeof candidate] as number))}>
                      {candidate[key as keyof typeof candidate]}
                    </span>
                  </div>
                  <Progress value={candidate[key as keyof typeof candidate] as number} className="h-1" indicatorClassName={color} />
                </div>
              ))}
            </div>

            {/* Risk + JP */}
            <div className="sm:w-36 flex flex-row sm:flex-col gap-2 shrink-0">
              <div className={cn('rounded-lg border p-2 text-center flex-1', riskBg[candidate.fraud_risk])}>
                <p className={cn('text-xs font-bold capitalize', riskColors[candidate.fraud_risk])}>
                  {candidate.fraud_risk}
                </p>
                <p className="text-[9px] text-muted-foreground">Fraud Risk</p>
              </div>
              <div className="rounded-lg border border-border p-2 text-center flex-1">
                <p className="text-xs font-bold text-primary-400">{candidate.joining_probability}%</p>
                <p className="text-[9px] text-muted-foreground">Join Prob.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col items-center gap-2 shrink-0">
              <Link href={`/employer/candidates/${candidate.id}`}>
                <Button size="icon-sm" variant="outline" title="View Profile">
                  <Eye size={14} />
                </Button>
              </Link>
              <Button size="icon-sm" variant="outline" title="Schedule Interview">
                <Calendar size={14} />
              </Button>
              <Link href={`/candidate/${candidate.id}/passport`}>
                <Button size="icon-sm" variant="outline" title="View Passport">
                  <Award size={14} />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost">
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2"><MessageSquare size={13} />Send Message</DropdownMenuItem>
                  <DropdownMenuItem className="gap-2"><Download size={13} />Download Resume</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-red-500">Reject</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function EmployerCandidatesPage() {
  const ref    = useRef(null)
  const inView  = useInView(ref, { once: true })
  const [search, setSearch]       = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy]       = useState('trust_score')

  const filtered = MOCK_CANDIDATES
    .filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase())
      const matchRisk   = riskFilter === 'all' || c.fraud_risk === riskFilter
      const matchStatus = statusFilter === 'all' || c.verification_status === statusFilter
      return matchSearch && matchRisk && matchStatus
    })
    .sort((a, b) => (b[sortBy as keyof typeof b] as number) - (a[sortBy as keyof typeof a] as number))

  return (
    <div ref={ref} className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold">Verified Candidates</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} candidates in pipeline</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download size={13} />Export CSV
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            placeholder="Search candidates..."
            leftIcon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trust_score">Sort: Trust Score</SelectItem>
            <SelectItem value="ats_score">Sort: ATS Score</SelectItem>
            <SelectItem value="joining_probability">Sort: Join Probability</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((c, i) => (
            <CandidateCard key={c.id} candidate={c} index={i} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ShieldCheck size={32} className="mx-auto mb-3 opacity-30" />
            <p>No candidates match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
