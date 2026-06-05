'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Building2, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { cn } from '@/lib/utils'

const ROLES = [
  {
    id: 'employer' as const,
    icon: Building2,
    label: 'Employer',
    description: 'Hire verified candidates',
  },
  {
    id: 'candidate' as const,
    icon: UserCircle,
    label: 'Candidate',
    description: 'Get your Candidate Passport',
  },
]

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const defaultRole = (searchParams.get('role') as 'employer' | 'candidate') || 'candidate'
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'employer' | 'candidate'>(defaultRole)
  const { signUp, signInWithGoogle, isLoading } = useAuth()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: defaultRole, agree_terms: false },
  })

  const onRoleChange = (role: 'employer' | 'candidate') => {
    setSelectedRole(role)
    setValue('role', role)
  }

  const onSubmit = async (data: RegisterInput) => {
    const { error } = await signUp(data.email, data.password, {
      full_name: data.full_name,
      role: data.role,
    })
    if (error) {
      toast.error('Registration failed. Please try again.')
      return
    }
    toast.success('Account created! Please check your email to verify.')
    router.push('/auth/verify-email')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="glass rounded-2xl border border-white/10 p-8 shadow-card-hover">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-sm text-navy-400">Join 200+ companies on Veriqo</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ROLES.map(({ id, icon: Icon, label, description }) => (
            <button
              key={id}
              type="button"
              onClick={() => onRoleChange(id)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all duration-200',
                selectedRole === id
                  ? 'border-primary bg-primary/10 shadow-glow-sm'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              )}
            >
              <Icon
                size={20}
                className={cn('mb-2', selectedRole === id ? 'text-primary-400' : 'text-navy-400')}
              />
              <p className={cn('text-sm font-semibold', selectedRole === id ? 'text-white' : 'text-navy-300')}>
                {label}
              </p>
              <p className="text-[11px] text-navy-500 mt-0.5">{description}</p>
            </button>
          ))}
        </div>

        {/* OAuth */}
        <Button
          variant="glass"
          className="w-full gap-3 h-11 mb-5"
          onClick={() => signInWithGoogle()}
          type="button"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>

        <div className="relative mb-5">
          <Separator className="bg-white/10" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent px-3 text-xs text-navy-500">
            or register with email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-navy-300">Full Name</Label>
            <Input
              placeholder="Your full name"
              leftIcon={<User size={15} />}
              className="bg-white/5 border-white/10 text-white placeholder:text-navy-500"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
          </div>

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

          <div className="space-y-1.5">
            <Label className="text-navy-300">Password</Label>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 characters"
              leftIcon={<Lock size={15} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword((p) => !p)} className="hover:text-foreground">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              className="bg-white/5 border-white/10 text-white placeholder:text-navy-500"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="flex items-start gap-2.5 mt-2">
            <input
              type="checkbox"
              id="terms"
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-primary"
              {...register('agree_terms')}
            />
            <label htmlFor="terms" className="text-xs text-navy-400 leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" className="text-primary-400 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link>
            </label>
          </div>
          {errors.agree_terms && (
            <p className="text-xs text-red-400">{errors.agree_terms.message}</p>
          )}

          <Button type="submit" variant="glow" className="w-full gap-2 h-11" loading={isLoading}>
            Create Account
            <ArrowRight size={15} />
          </Button>
        </form>

        <p className="text-center text-sm text-navy-400 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
