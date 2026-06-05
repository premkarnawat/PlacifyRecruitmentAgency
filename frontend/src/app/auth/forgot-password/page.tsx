'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { forgotPassword, isLoading } = useAuth()

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    const { error } = await forgotPassword(data.email)
    if (!error) setSent(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="glass rounded-2xl border border-white/10 p-8 shadow-card-hover">
        {!sent ? (
          <>
            <div className="text-center mb-8">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Mail size={20} className="text-primary-400" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-white mb-2">Forgot password?</h1>
              <p className="text-sm text-navy-400">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-navy-300">Email Address</Label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  leftIcon={<Mail size={15} />}
                  className="bg-white/5 border-white/10 text-white placeholder:text-navy-500"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
              <Button type="submit" variant="glow" className="w-full gap-2 h-11" loading={isLoading}>
                Send Reset Link
                <ArrowRight size={15} />
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-trust-500/10 border border-trust-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={24} className="text-trust-400" />
            </div>
            <h2 className="font-heading text-xl font-bold text-white mb-2">Check your inbox</h2>
            <p className="text-sm text-navy-400 mb-6">
              We sent a password reset link to{' '}
              <span className="text-white font-medium">{getValues('email')}</span>
            </p>
            <p className="text-xs text-navy-500">
              Didn&apos;t receive it? Check spam or{' '}
              <button onClick={() => setSent(false)} className="text-primary-400 hover:underline">
                try again
              </button>
            </p>
          </div>
        )}

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 mt-6 text-sm text-navy-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </motion.div>
  )
}
