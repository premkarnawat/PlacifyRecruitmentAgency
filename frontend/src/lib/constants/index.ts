export const APP_NAME = 'Veriqo'
export const APP_TAGLINE = 'Verified Hiring. Reduced Risk. Better Talent.'
export const APP_DESCRIPTION =
  'Veriqo is a Verified Hiring Intelligence Platform that reduces hiring risk by delivering verified, technically validated candidates instead of resume databases.'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://veriqo.io'
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const NAV_LINKS = [
  { label: 'Employers', href: '/employers' },
  { label: 'Candidates', href: '/candidates' },
  { label: 'Experts', href: '/experts' },
  { label: 'Community', href: '/community' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
] as const

export const VERIFICATION_STAGES = [
  {
    id: 'portfolio',
    label: 'Portfolio Verification',
    description: 'GitHub, projects, deployments verified',
    icon: 'FolderOpen',
    weight: 20,
  },
  {
    id: 'work_sample',
    label: 'Work Sample Challenge',
    description: 'Domain-specific technical task',
    icon: 'Code',
    weight: 25,
  },
  {
    id: 'ai_evaluation',
    label: 'AI Evaluation',
    description: 'Automated quality assessment',
    icon: 'Brain',
    weight: 20,
  },
  {
    id: 'expert_review',
    label: 'Expert Verification',
    description: 'Human expert review & interview',
    icon: 'UserCheck',
    weight: 25,
  },
  {
    id: 'reliability',
    label: 'Reliability Engine',
    description: 'Behavioral & history analysis',
    icon: 'ShieldCheck',
    weight: 10,
  },
] as const

export const EXPERT_RUBRIC = {
  technical_knowledge: 30,
  project_understanding: 25,
  problem_solving: 20,
  communication: 15,
  professionalism: 10,
} as const

export const EXPERT_DOMAINS = [
  'Java',
  'Python',
  'React',
  'Node.js',
  'UI/UX',
  'DevOps',
  'Data Science',
  'AI/ML',
  'Cybersecurity',
  'Angular',
  'Vue.js',
  'Go',
  'Rust',
  'iOS',
  'Android',
  'Blockchain',
  'Cloud Architecture',
  'QA & Testing',
] as const

export const INDUSTRIES = [
  'Technology',
  'Finance & Fintech',
  'Healthcare',
  'E-Commerce',
  'EdTech',
  'Manufacturing',
  'Media & Entertainment',
  'Real Estate',
  'Logistics',
  'Legal & Compliance',
] as const

export const COMPANY_SIZES = [
  '1–10',
  '11–50',
  '51–200',
  '201–500',
  '501–1000',
  '1001–5000',
  '5000+',
] as const

export const NOTICE_PERIOD_OPTIONS = [
  { label: 'Immediate', value: 0 },
  { label: '15 days', value: 15 },
  { label: '30 days', value: 30 },
  { label: '45 days', value: 45 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
] as const

export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 4999,
    period: 'month',
    description: 'For small teams just getting started',
    features: [
      '5 active jobs',
      '50 candidate verifications/mo',
      'ATS matching',
      'Candidate Passport',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 14999,
    period: 'month',
    description: 'For growing teams with serious hiring needs',
    features: [
      '20 active jobs',
      '200 candidate verifications/mo',
      'ATS + Trust Score',
      'Expert Verification',
      'Fraud Detection',
      'Analytics Dashboard',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    period: 'month',
    description: 'For large enterprises with complex hiring',
    features: [
      'Unlimited jobs',
      'Unlimited verifications',
      'Full verification suite',
      'White-label option',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
] as const
