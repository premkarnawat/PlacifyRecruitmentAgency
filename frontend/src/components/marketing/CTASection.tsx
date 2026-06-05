'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Sparkles, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-navy-900 to-indigo-900/40" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-3xl rounded-full" />

      <div ref={ref} className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary-300 mb-8">
            <Shield size={13} />
            Start free. Verify faster. Hire better.
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            <span className="gradient-text-hero">Stop reviewing resumes.</span>
            <br />
            <span className="text-white">Start reviewing</span>
            <span className="gradient-text"> verified candidates.</span>
          </h2>

          <p className="text-lg text-navy-300 max-w-2xl mx-auto mb-10">
            Join 200+ companies that have reduced hiring risk with Veriqo's verified talent network.
            Book a demo and see your first verified shortlist in 48 hours.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register?role=employer">
              <Button variant="glow" size="xl" className="gap-2.5 w-full sm:w-auto shadow-glow-md">
                <Sparkles size={16} />
                Book Free Demo
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/auth/register?role=candidate">
              <Button variant="glass" size="xl" className="w-full sm:w-auto">
                Get Your Candidate Passport
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-xs text-navy-500">
            No credit card · 14-day free trial · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  )
}
