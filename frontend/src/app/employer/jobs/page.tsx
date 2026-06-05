'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Filter, MoreHorizontal, Users, Eye,
  ShieldCheck, Clock, Pause, Play, Trash2, Edit,
  Briefcase, MapPin, DollarSign, Building2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatLakhsCrores } from '@/lib/utils'

const MOCK_JOBS = [
  {
    id: '1', title: 'Senior React Developer', department: 'Engineering',
    location: 'Bangalore', work_mode: 'hybrid', job_type: 'full_time',
    salary_min: 1800000, salary_max: 2800000,
    experience_min: 4, experience_max: 8,
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    applicants: 143, shortlisted: 8, verified: 5,
    status: 'active', created_at: '2024-01-10',
  },
  {
    id: '2', title: 'DevOps Engineer', department: 'Infrastructure',
    location: 'Remote', work_mode: 'remote', job_type: 'full_time',
    salary_min: 1600000, salary_max: 2400000,
    experience_min: 3, experience_max: 6,
    skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform'],
    applicants: 89, shortlisted: 4, verified: 2,
    status: 'active', created_at: '2024-01-08',
  },
  {
    id: '3', title: 'Product Designer', department: 'Design',
    location: 'Mumbai', work_mode: 'onsite', job_type: 'full_time',
    salary_min: 1200000, salary_max: 1800000,
    experience_min: 2, experience_max: 5,
    skills: ['Figma', 'Prototyping', 'User Research', 'Design Systems'],
    applicants: 67, shortlisted: 5, verified: 3,
    status: 'active', created_at: '2024-01-05',
  },
  {
    id: '4', title: 'Backend Engineer (Python)', department: 'Engineering',
    location: 'Hyderabad', work_mode: 'hybrid', job_type: 'full_time',
    salary_min: 1400000, salary_max: 2200000,
    experience_min: 3, experience_max: 7,
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis'],
    applicants: 201, shortlisted: 12, verified: 8,
    status: 'active', created_at: '2024-01-03',
  },
  {
    id: '5', title: 'Data Scientist', department: 'AI/ML',
    location: 'Pune', work_mode: 'hybrid', job_type: 'full_time',
    salary_min: 1600000, salary_max: 2600000,
    experience_min: 3, experience_max: 6,
    skills: ['Python', 'ML', 'TensorFlow', 'SQL'],
    applicants: 112, shortlisted: 6, verified: 4,
    status: 'paused', created_at: '2023-12-28',
  },
]

const STATUS_CONFIG = {
  active:  { label: 'Active',  variant: 'trust' as const,   icon: Play  },
  paused:  { label: 'Paused',  variant: 'warning' as const, icon: Pause },
  closed:  { label: 'Closed',  variant: 'failed' as const,  icon: Clock },
  draft:   { label: 'Draft',   variant: 'outline' as const, icon: Edit  },
}

const WORK_MODE_LABEL = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' }
const JOB_TYPE_LABEL  = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', freelance: 'Freelance', internship: 'Internship' }

function JobCard({ job, index }: { job: typeof MOCK_JOBS[0]; index: number }) {
  const ref  = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const cfg  = STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG]
  const StatusIcon = cfg.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card className="group hover:border-primary/30 hover:shadow-glow-sm transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Icon */}
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase size={18} className="text-primary-400" />
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Link href={`/employer/jobs/${job.id}`}>
                  <h3 className="font-heading text-base font-semibold hover:text-primary transition-colors">
                    {job.title}
                  </h3>
                </Link>
                <Badge variant={cfg.variant} className="text-[10px]">
                  <StatusIcon size={9} className="mr-1" />{cfg.label}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Building2 size={11} />{job.department}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} />{job.location}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={11} />
                  {formatLakhsCrores(job.salary_min)} – {formatLakhsCrores(job.salary_max)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />{job.experience_min}–{job.experience_max} yrs
                </span>
                <Badge variant="indigo" className="text-[9px] h-4 px-1.5">{WORK_MODE_LABEL[job.work_mode as keyof typeof WORK_MODE_LABEL]}</Badge>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">{JOB_TYPE_LABEL[job.job_type as keyof typeof JOB_TYPE_LABEL]}</Badge>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.skills.map((s) => (
                  <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                    {s}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users size={12} />
                  <span className="font-semibold text-foreground">{job.applicants}</span> applicants
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye size={12} />
                  <span className="font-semibold text-foreground">{job.shortlisted}</span> shortlisted
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck size={12} className="text-trust-500" />
                  <span className="font-semibold text-trust-400">{job.verified}</span> verified
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              <Link href={`/employer/candidates?job=${job.id}`}>
                <Button size="sm" variant="glow" className="gap-1.5 text-xs whitespace-nowrap">
                  <Users size={12} /> View Candidates
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-sm" variant="ghost">
                    <MoreHorizontal size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2"><Edit size={13} />Edit Job</DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    {job.status === 'active'
                      ? <><Pause size={13} />Pause Job</>
                      : <><Play  size={13} />Activate Job</>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-red-500 focus:text-red-500">
                    <Trash2 size={13} />Delete Job
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function EmployerJobsPage() {
  const ref   = useRef(null)
  const inView = useInView(ref, { once: true })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = MOCK_JOBS.filter((j) => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || j.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div ref={ref} className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} jobs across all departments</p>
        </div>
        <Link href="/employer/jobs/new">
          <Button variant="glow" className="gap-2">
            <Plus size={15} />Post New Job
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search jobs..."
            leftIcon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Job list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length > 0 ? (
            filtered.map((job, i) => <JobCard key={job.id} job={job} index={i} />)
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 text-muted-foreground"
            >
              <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No jobs found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
