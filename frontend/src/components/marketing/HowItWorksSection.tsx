'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Upload, Cpu, Shield, FileCheck, Building2,
  CheckCircle2, ArrowDown
} from 'lucide-react'

const STEPS = [
  {
    step: '01',
    icon: Upload,
    title: 'Resume Upload & AI Parsing',
    description: 'Candidates upload their resume. Our AI instantly parses skills, experience, education and generates structured embeddings.',
    color: 'from-primary-500 to-primary-700',
    glow: 'shadow-glow-sm',
  },
  {
    step: '02',
    icon: Cpu,
    title: 'ATS Matching Engine',
    description: 'Vector similarity search matches candidate embeddings against job requirements. Candidates are ranked by ATS score.',
    color: 'from-indigo-500 to-indigo-700',
    glow: 'shadow-[0_0_20px_rgba(79,70,229,0.3)]',
  },
  {
    step: '03',
    icon: Shield,
    title: '5-Stage Verification Pipeline',
    description: 'Portfolio verification → Work sample challenge → AI evaluation → Expert review → Reliability engine.',
    color: 'from-trust-500 to-trust-700',
    glow: 'shadow-glow-trust',
  },
  {
    step: '04',
    icon: FileCheck,
    title: 'Candidate Passport Generated',
    description: 'A verified, shareable Passport is generated with Trust Score, fraud risk, joining probability, and expert recommendation.',
    color: 'from-cyan-500 to-cyan-700',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
  },
  {
    step: '05',
    icon: Building2,
    title: 'Delivered to Employer',
    description: 'Employers receive a verified shortlist — not raw resumes. Every candidate has been technically validated and fraud-checked.',
    color: 'from-primary-600 to-indigo-600',
    glow: 'shadow-glow-md',
  },
]

function Step({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const Icon = step.icon

  return (
    <div ref={ref} className="relative">
      <motion.div
        initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className={`flex gap-6 items-start ${index % 2 === 1 ? 'flex-row-reverse text-right' : ''}`}
      >
        {/* Icon */}
        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${step.color} ${step.glow} flex items-center justify-center shrink-0`}>
          <Icon size={22} className="text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 max-w-sm">
          <div className="flex items-center gap-2 mb-2" style={{ justifyContent: index % 2 === 1 ? 'flex-end' : 'flex-start' }}>
            <span className="text-xs font-mono font-bold text-muted-foreground">{step.step}</span>
            <CheckCircle2 size={13} className="text-trust-500" />
          </div>
          <h3 className="font-heading text-lg font-semibold mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
        </div>
      </motion.div>

      {/* Connector arrow */}
      {index < STEPS.length - 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
          className="flex justify-center my-6"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-6 bg-gradient-to-b from-border to-transparent" />
            <ArrowDown size={14} className="text-muted-foreground" />
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function HowItWorksSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary-400 mb-4">
              How It Works
            </span>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold mb-4">
              From Resume to
              <span className="gradient-text"> Verified Hire</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              A fully automated, AI-powered pipeline that transforms raw resumes into verified talent with a single Candidate Passport.
            </p>
          </motion.div>
        </div>

        <div className="max-w-2xl mx-auto">
          {STEPS.map((step, i) => (
            <Step key={step.step} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
