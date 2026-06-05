import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm_password: z.string(),
    role: z.enum(['candidate', 'employer']),
    agree_terms: z.boolean().refine((v) => v, 'You must agree to the terms'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

// ── Candidate ────────────────────────────────────────────────
export const candidateProfileSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().max(120).optional(),
  summary: z.string().max(1000).optional(),
  github_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  portfolio_url: z.string().url().optional().or(z.literal('')),
  years_of_experience: z.number().min(0).max(50).optional(),
  current_salary: z.number().min(0).optional(),
  expected_salary: z.number().min(0).optional(),
  notice_period_days: z.number().min(0).max(180).optional(),
  open_to_relocation: z.boolean(),
  skills: z.array(z.string()).min(1, 'Add at least one skill'),
})

export const interestConfirmationSchema = z.object({
  interested: z.boolean(),
  current_salary: z.number().min(0),
  expected_salary: z.number().min(0),
  notice_period_days: z.number().min(0).max(180),
  open_to_relocation: z.boolean(),
  has_other_offers: z.boolean(),
  other_offers_details: z.string().optional(),
})

// ── Employer ─────────────────────────────────────────────────
export const companyProfileSchema = z.object({
  name: z.string().min(2),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  size: z.string().optional(),
  description: z.string().max(1000).optional(),
})

export const jobSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.array(z.string()),
  skills_required: z.array(z.string()).min(1, 'Add at least one required skill'),
  location: z.string().optional(),
  job_type: z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship']),
  work_mode: z.enum(['onsite', 'remote', 'hybrid']),
  salary_min: z.number().min(0).optional(),
  salary_max: z.number().min(0).optional(),
  experience_min: z.number().min(0).optional(),
  experience_max: z.number().min(0).optional(),
})

// ── Types ─────────────────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>
export type InterestConfirmationInput = z.infer<typeof interestConfirmationSchema>
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>
export type JobInput = z.infer<typeof jobSchema>
