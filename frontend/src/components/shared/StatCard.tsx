'use client'

import { useRef, useEffect } from 'react'
import { useInView } from 'framer-motion'
import { animate } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  suffix?: string
  prefix?: string
  change?: number
  changeLabel?: string
  icon: React.ElementType
  iconColor?: string
  iconBg?: string
  animated?: boolean
}

export function StatCard({
  title,
  value,
  suffix = '',
  prefix = '',
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-primary-400',
  iconBg = 'bg-primary/10',
  animated = true,
}: StatCardProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref as React.RefObject<Element>, { once: true })

  useEffect(() => {
    if (!animated || !inView || !ref.current || typeof value !== 'number') return
    const controls = animate(0, value, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate(v) {
        if (ref.current) ref.current.textContent = prefix + Math.floor(v) + suffix
      },
    })
    return controls.stop
  }, [inView, value, animated, prefix, suffix])

  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <Card className="hover:border-primary/20 hover:shadow-glow-sm transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', iconBg)}>
            <Icon size={18} className={iconColor} />
          </div>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                isPositive ? 'bg-trust-500/10 text-trust-500' :
                isNegative ? 'bg-red-500/10 text-red-500' :
                'bg-muted text-muted-foreground'
              )}
            >
              <TrendIcon size={11} />
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <p className="font-heading text-2xl font-bold mb-1">
          {typeof value === 'number' && animated ? (
            <span ref={ref}>{prefix + '0' + suffix}</span>
          ) : (
            <span>{prefix}{value}{suffix}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{title}</p>
        {changeLabel && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{changeLabel}</p>
        )}
      </CardContent>
    </Card>
  )
}
