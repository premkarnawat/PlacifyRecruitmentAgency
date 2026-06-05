import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary hover:bg-primary/20',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-red-500/10 text-red-500 hover:bg-red-500/20',
        outline: 'text-foreground border-border',
        trust: 'border-transparent bg-trust-500/10 text-trust-500',
        warning: 'border-transparent bg-amber-500/10 text-amber-500',
        indigo: 'border-transparent bg-indigo-500/10 text-indigo-400',
        cyan: 'border-transparent bg-cyan-500/10 text-cyan-400',
        verified: 'border-transparent bg-trust-500/15 text-trust-400 border border-trust-500/20',
        pending: 'border-transparent bg-amber-500/15 text-amber-400 border border-amber-500/20',
        failed: 'border-transparent bg-red-500/15 text-red-400 border border-red-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
