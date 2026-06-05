// ============================================================
// VERIQO — Phase 1.5 Type Extensions
// Add these to the bottom of src/types/index.ts
// ============================================================

// ── Workflow Engine ───────────────────────────────────────────
// Base User Type
export * from './phase1.5'
export interface User {
  id: string
  email: string

  role: string
  full_name: string

  avatar_url?: string

  email_verified: boolean

  created_at: string
  updated_at: string
}

// Candidate Profile Type

export interface CandidateProfile {
  id: string
  full_name: string
  email?: string

  headline?: string
  location?: string

  years_of_experience?: number

  ats_score?: number
  trust_score?: number

  verification_status?: string

  skills?: string[]
}
export type WorkflowState =
  | 'job_created'
  | 'agency_review'
  | 'ats_matching'
  | 'candidate_interest_check'
  | 'verification_pending'
  | 'verification_complete'
  | 'company_review'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_released'
  | 'offer_accepted'
  | 'joined'
  | 'invoice_generated'

export type ActorRole = 'system' | 'employer' | 'candidate' | 'expert' | 'admin'

export interface HiringWorkflow {
  id: string
  application_id: string
  job_id: string
  candidate_id: string
  company_id: string
  state: WorkflowState
  previous_state?: WorkflowState
  assigned_to?: string
  priority: number
  notes?: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joined fields
  candidate_profiles?: {
    full_name: string
    avatar_url?: string
    trust_score?: number
    ats_score?: number
  }
  jobs?: { title: string; skills_required: string[] }
  applications?: { ats_score?: number; status: string }
}

export interface WorkflowTimelineEntry {
  id: string
  workflow_id: string
  from_state?: WorkflowState
  to_state: WorkflowState
  actor_id?: string
  actor_role: ActorRole
  notes?: string
  metadata: Record<string, unknown>
  created_at: string
}

// ── Pipeline ──────────────────────────────────────────────────

export type PipelineStatus =
  | 'new'
  | 'ats_matched'
  | 'interested'
  | 'verification_pending'
  | 'verified'
  | 'interview_scheduled'
  | 'offer'
  | 'joined'
  | 'rejected'

export interface PipelineCandidate {
  id: string
  application_id: string
  job_id: string
  candidate_id: string
  company_id: string
  pipeline_status: PipelineStatus
  ats_score?: number
  trust_score?: number
  position: number
  tags: string[]
  starred: boolean
  recruiter_notes?: string
  created_at: string
  updated_at: string
  candidate_profiles?: {
    id: string
    full_name: string
    avatar_url?: string
    headline?: string
    skills: string[]
    trust_score?: number
    ats_score?: number
    verification_status: string
    location?: string
    years_of_experience?: number
  }
}

export interface PipelineColumn {
  id: PipelineStatus
  label: string
  candidates: PipelineCandidate[]
}

export interface PipelineBoard {
  job_id: string
  columns: PipelineColumn[]
  total: number
}

// ── Interest Confirmation ─────────────────────────────────────

export interface InterestConfirmation {
  id: string
  application_id: string
  candidate_user_id: string
  interested: boolean
  current_salary?: number
  expected_salary?: number
  notice_period_days?: number
  open_to_relocation?: boolean
  has_other_offers: boolean
  other_offers_details?: string
  confirmed_at: string
}

// ── Trust Score V2 ────────────────────────────────────────────

export interface TrustScoreBreakdown {
  score: number
  weight: number
  contribution: number
}

export interface TrustScoreResult {
  candidate_id: string
  overall_score: number
  components: {
    ats: number
    portfolio: number
    work_sample: number
    expert: number
    communication: number
    reliability: number
  }
  breakdown: Record<string, TrustScoreBreakdown>
  weights: Record<string, number>
}

export interface TrustScoreHistory {
  overall_score: number
  created_at: string
  trigger_event: string
  score_breakdown: Record<string, TrustScoreBreakdown>
}

// ── Reliability ───────────────────────────────────────────────

export interface ReliabilityScore {
  candidate_id: string
  score: number
  interview_attendance: number
  response_time: number
  offer_acceptance_rate: number
  joining_rate: number
  risk_flags: string[]
  event_count: number
}

// ── Work Sample ───────────────────────────────────────────────

export interface WorkSampleChallenge {
  id: string
  candidate_id: string
  application_id?: string
  role_type: string
  task_description: string
  submission_url?: string
  submission_content?: string
  submission_files: string[]
  ai_score?: number
  ai_feedback?: Record<string, unknown>
  expert_score?: number
  expert_feedback?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  time_limit_hours: number
  due_at?: string
  submitted_at?: string
  created_at: string
}

// ── Interview ─────────────────────────────────────────────────

export interface InterviewSchedule {
  id: string
  workflow_id: string
  application_id: string
  scheduled_at: string
  duration_mins: number
  format: 'video' | 'phone' | 'onsite'
  meeting_url?: string
  interviewer_ids: string[]
  reminder_sent: boolean
  notes?: string
  created_at: string
}

export interface InterviewQuestions {
  technical: string[]
  project_deep_dive: string[]
  behavioral: string[]
  role_specific: string[]
}

// ── Bulk Upload ───────────────────────────────────────────────

export type BulkUploadStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial'

export interface BulkUploadBatch {
  id: string
  company_id: string
  job_id?: string
  upload_type: 'csv' | 'resume_zip' | 'multi_resume'
  file_url?: string
  total_count: number
  processed_count: number
  success_count: number
  fail_count: number
  status: BulkUploadStatus
  report_url?: string
  created_at: string
  updated_at: string
}

// ── AI Features ───────────────────────────────────────────────

export interface JobRequirements {
  required_skills: string[]
  optional_skills: string[]
  priority_skills: string[]
  experience_min?: number
  experience_max?: number
  location?: string
  salary_min?: number
  salary_max?: number
  responsibilities: string[]
  role_category?: string
  seniority?: string
  remote_friendly?: boolean
}

export interface ResumeSummary {
  summary: string
  strengths: string[]
  weaknesses: string[]
  risk_areas: string[]
  recommendation: 'highly_recommended' | 'recommended' | 'conditional' | 'not_recommended'
  recommendation_reason: string
  fit_score: number
}

// ── Workflow State Labels (UI helpers) ────────────────────────

export const WORKFLOW_STATE_LABELS: Record<WorkflowState, string> = {
  job_created: 'Job Created',
  agency_review: 'Agency Review',
  ats_matching: 'ATS Matching',
  candidate_interest_check: 'Interest Check',
  verification_pending: 'Verification Pending',
  verification_complete: 'Verified',
  company_review: 'Company Review',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Done',
  offer_released: 'Offer Released',
  offer_accepted: 'Offer Accepted',
  joined: 'Joined',
  invoice_generated: 'Invoice Generated',
}

export const WORKFLOW_STATE_COLORS: Record<WorkflowState, string> = {
  job_created: 'text-zinc-400 bg-zinc-400/10',
  agency_review: 'text-yellow-400 bg-yellow-400/10',
  ats_matching: 'text-blue-400 bg-blue-400/10',
  candidate_interest_check: 'text-purple-400 bg-purple-400/10',
  verification_pending: 'text-orange-400 bg-orange-400/10',
  verification_complete: 'text-green-400 bg-green-400/10',
  company_review: 'text-cyan-400 bg-cyan-400/10',
  interview_scheduled: 'text-indigo-400 bg-indigo-400/10',
  interview_completed: 'text-teal-400 bg-teal-400/10',
  offer_released: 'text-pink-400 bg-pink-400/10',
  offer_accepted: 'text-emerald-400 bg-emerald-400/10',
  joined: 'text-green-500 bg-green-500/10',
  invoice_generated: 'text-zinc-300 bg-zinc-300/10',
}

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  new: 'New',
  ats_matched: 'ATS Matched',
  interested: 'Interested',
  verification_pending: 'Verification',
  verified: 'Verified',
  interview_scheduled: 'Interview',
  offer: 'Offer',
  joined: 'Joined',
  rejected: 'Rejected',
}
