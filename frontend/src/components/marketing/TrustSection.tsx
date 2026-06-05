'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ShieldCheck, Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

const TESTIMONIALS = [
  {
    name: 'Rahul Sharma',
    role: 'VP Engineering',
    company: 'FinTech Startup, Bangalore',
    text: 'We used to spend 3 weeks shortlisting. With Veriqo, we get a verified shortlist of 5 candidates in 48 hours. The Passport is genuinely revolutionary.',
    rating: 5,
  },
  {
    name: 'Ananya Krishnan',
    role: 'Talent Acquisition Lead',
    company: 'E-commerce Company, Mumbai',
    text: 'The fraud detection alone saved us from two hires that turned out to have completely fabricated GitHub profiles. Veriqo caught them immediately.',
    rating: 5,
  },
  {
    name: 'Vikram Nair',
    role: 'CTO',
    company: 'SaaS Platform, Pune',
    text: 'Our offer acceptance rate went from 61% to 94%. Candidates with Veriqo Passports are genuinely interested and know what they\'re getting into.',
    rating: 5,
  },
]

const TRUST_BADGES = [
  { label: 'SOC 2 Type II', icon: '🔐' },
  { label: 'GDPR Ready', icon: '🇪🇺' },
  { label: 'ISO 27001', icon: '📋' },
  { label: 'Encrypted at Rest', icon: '🔒' },
  { label: '99.9% Uptime SLA', icon: '⚡' },
]

export function TrustSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="py-24 bg-navy-950/30 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
          >
            <span className="inline-block rounded-full border border-trust-500/30 bg-trust-500/5 px-4 py-1.5 text-xs font-medium text-trust-400 mb-4">
              Trusted by Teams
            </span>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold mb-4">
              Built for teams that
              <span className="gradient-text"> can't afford bad hires</span>
            </h2>
          </motion.div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full hover:border-primary/20 hover:shadow-glow-sm transition-all duration-300">
                <CardContent className="p-6">
                  <Quote size={20} className="text-primary/40 mb-3" />
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">{getInitials(t.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                    </div>
                    <div className="ml-auto flex">
                      {Array.from({ length: t.rating }).map((_, si) => (
                        <Star key={si} size={12} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2"
            >
              <span className="text-base">{badge.icon}</span>
              <span className="text-xs font-medium text-muted-foreground">{badge.label}</span>
              <ShieldCheck size={12} className="text-trust-500" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
