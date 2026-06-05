'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Brain, Shield, FileText, AlertTriangle, Users, BarChart3,
  Zap, Globe, Lock, CheckCircle, ArrowRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    icon: Zap,
    title: 'AI-Powered ATS Engine',
    description: 'Vector similarity search matches candidates to jobs with 97%+ accuracy using BGE Large embeddings and Qdrant.',
    color: 'text-primary-400',
    bg: 'bg-primary/10',
    size: 'large',
    tag: 'Core',
  },
  {
    icon: Shield,
    title: 'Candidate Passport',
    description: 'A verified, shareable profile with Trust Score, fraud risk, and expert recommendation. The operating system for hiring.',
    color: 'text-trust-400',
    bg: 'bg-trust-500/10',
    size: 'large',
    tag: 'Flagship',
  },
  {
    icon: Brain,
    title: 'AI Evaluation',
    description: 'Groq-powered LLM evaluates project quality, architecture, documentation, and code complexity objectively.',
    color: 'text-indigo-400',
    bg: 'bg-indigo/10',
    size: 'normal',
    tag: 'AI',
  },
  {
    icon: AlertTriangle,
    title: 'Fraud Detection',
    description: 'Multi-layer AI + rule engine checks education timelines, skill consistency, GitHub authenticity and AI-generated content.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    size: 'normal',
    tag: 'Security',
  },
  {
    icon: Users,
    title: 'Expert Marketplace',
    description: 'Domain experts conduct structured interviews using a standardized rubric across technical knowledge, problem solving, and communication.',
    color: 'text-cyan-400',
    bg: 'bg-cyan/10',
    size: 'normal',
    tag: 'Human Layer',
  },
  {
    icon: BarChart3,
    title: 'Hiring Analytics',
    description: 'Full-funnel visibility from application to hire. Track quality scores, conversion rates and time-to-hire in real time.',
    color: 'text-primary-400',
    bg: 'bg-primary/10',
    size: 'normal',
    tag: 'Analytics',
  },
  {
    icon: FileText,
    title: 'Work Sample Challenges',
    description: 'Role-specific assignments — build a landing page, REST API, user flow or dataset analysis — scored objectively.',
    color: 'text-trust-400',
    bg: 'bg-trust-500/10',
    size: 'normal',
    tag: 'Verification',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'RBAC, RLS, JWT, audit logs, GDPR-ready, SOC 2 compliant. Your data never leaves your jurisdiction.',
    color: 'text-indigo-400',
    bg: 'bg-indigo/10',
    size: 'normal',
    tag: 'Security',
  },
]

function FeatureCard({ feature, index }: { feature: (typeof FEATURES)[number]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const Icon = feature.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className={cn(
        feature.size === 'large' ? 'md:col-span-2' : 'col-span-1'
      )}
    >
      <Card className="group h-full hover:border-primary/30 hover:shadow-glow-sm transition-all duration-300 cursor-default">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', feature.bg)}>
              <Icon size={20} className={feature.color} />
            </div>
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full', feature.bg, feature.color)}>
              {feature.tag}
            </span>
          </div>
          <h3 className="font-heading text-base font-semibold mb-2 group-hover:text-primary transition-colors">
            {feature.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
          {feature.size === 'large' && (
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Learn more <ArrowRight size={12} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function FeaturesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="py-24 bg-navy-950/50 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block rounded-full border border-trust-500/30 bg-trust-500/5 px-4 py-1.5 text-xs font-medium text-trust-400 mb-4">
              Platform Features
            </span>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold mb-4">
              Everything you need to
              <span className="gradient-text"> hire with confidence</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Not a job portal. Not a resume database. A fully verified hiring intelligence platform built for the modern enterprise.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
