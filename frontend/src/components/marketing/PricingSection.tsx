'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Check, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function PricingSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-3xl rounded-full" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
          >
            <span className="inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary-400 mb-4">
              Simple Pricing
            </span>
            <h2 className="font-heading text-4xl lg:text-5xl font-extrabold mb-4">
              Invest in verified hiring.
              <span className="gradient-text"> Pay for results.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-8">
              Start with a 14-day free trial. No credit card required.
            </p>

            {/* Annual toggle */}
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-muted p-1">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  !annual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-2',
                  annual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                Annual
                <Badge variant="trust" className="text-[10px] h-4 px-1.5">Save 20%</Badge>
              </button>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {SUBSCRIPTION_PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={cn(
                'relative rounded-2xl border p-8 flex flex-col',
                plan.highlighted
                  ? 'border-primary bg-gradient-to-b from-primary/10 to-indigo/5 shadow-glow-md'
                  : 'border-border bg-card'
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="px-4 py-1 text-xs font-semibold shadow-glow-sm">
                    <Sparkles size={11} className="mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-heading text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                {plan.price ? (
                  <div className="flex items-end gap-1">
                    <span className="font-heading text-4xl font-extrabold">
                      ₹{annual ? Math.floor(plan.price * 0.8).toLocaleString() : plan.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground mb-1.5">/month</span>
                  </div>
                ) : (
                  <div className="font-heading text-3xl font-extrabold">Custom</div>
                )}
                {annual && plan.price && (
                  <p className="text-xs text-trust-500 mt-1">
                    Billed ₹{Math.floor(plan.price * 0.8 * 12).toLocaleString()}/year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check size={15} className="text-trust-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.price ? '/auth/register?role=employer' : '/contact'}>
                <Button
                  variant={plan.highlighted ? 'glow' : 'outline'}
                  className={cn('w-full gap-2', plan.highlighted && 'shadow-glow-sm')}
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-10"
        >
          All plans include 14-day free trial · No credit card required · Cancel anytime
        </motion.p>
      </div>
    </section>
  )
}
