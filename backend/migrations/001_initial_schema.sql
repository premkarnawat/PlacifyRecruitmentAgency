-- ============================================================
-- VERIQO Database Schema
-- Supabase PostgreSQL Migration
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ─────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('candidate', 'employer', 'expert', 'admin');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'in_progress', 'verified', 'failed', 'expired');
CREATE TYPE fraud_risk AS ENUM ('low', 'medium', 'high');
CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed');
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'freelance', 'internship');
CREATE TYPE work_mode AS ENUM ('onsite', 'remote', 'hybrid');
CREATE TYPE application_status AS ENUM (
  'applied', 'screening', 'ats_matched', 'interest_confirmed',
  'portfolio_verified', 'work_sample', 'expert_review',
  'shortlisted', 'interview_scheduled', 'offered', 'hired', 'rejected', 'withdrawn'
);
CREATE TYPE final_recommendation AS ENUM (
  'highly_recommended', 'recommended', 'conditional', 'not_recommended'
);
CREATE TYPE subscription_plan AS ENUM ('free', 'trial', 'starter', 'growth', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'trial', 'cancelled', 'past_due');
CREATE TYPE verification_stage AS ENUM ('portfolio', 'work_sample', 'ai_evaluation', 'expert_review', 'reliability');
CREATE TYPE stage_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- ── COMPANIES ─────────────────────────────────────────────────
CREATE TABLE companies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  logo_url            TEXT,
  website             TEXT,
  industry            TEXT,
  size                TEXT,
  description         TEXT,
  verified            BOOLEAN DEFAULT FALSE,
  subscription_plan   subscription_plan DEFAULT 'trial',
  subscription_status subscription_status DEFAULT 'trial',
  trial_ends_at       TIMESTAMPTZ,
  razorpay_customer_id TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ── CANDIDATE PROFILES ────────────────────────────────────────
CREATE TABLE candidate_profiles (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT NOT NULL,
  full_name            TEXT NOT NULL,
  phone                TEXT,
  location             TEXT,
  headline             TEXT,
  summary              TEXT,
  avatar_url           TEXT,
  resume_url           TEXT,
  github_url           TEXT,
  linkedin_url         TEXT,
  portfolio_url        TEXT,
  behance_url          TEXT,
  dribbble_url         TEXT,
  years_of_experience  INTEGER DEFAULT 0,
  current_salary       BIGINT,
  expected_salary      BIGINT,
  notice_period_days   INTEGER DEFAULT 30,
  open_to_relocation   BOOLEAN DEFAULT FALSE,
  skills               TEXT[] DEFAULT '{}',
  verification_status  verification_status DEFAULT 'unverified',
  trust_score          DECIMAL(5,2),
  ats_score            DECIMAL(5,2),
  portfolio_score      DECIMAL(5,2),
  work_sample_score    DECIMAL(5,2),
  technical_score      DECIMAL(5,2),
  communication_score  DECIMAL(5,2),
  reliability_score    DECIMAL(5,2),
  fraud_risk           fraud_risk,
  fraud_score          DECIMAL(5,2),
  joining_probability  DECIMAL(5,2),
  passport_id          TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ── JOBS ─────────────────────────────────────────────────────
CREATE TABLE jobs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  requirements      TEXT[] DEFAULT '{}',
  skills_required   TEXT[] DEFAULT '{}',
  location          TEXT,
  job_type          job_type DEFAULT 'full_time',
  work_mode         work_mode DEFAULT 'hybrid',
  salary_min        BIGINT,
  salary_max        BIGINT,
  experience_min    INTEGER,
  experience_max    INTEGER,
  status            job_status DEFAULT 'draft',
  applicant_count   INTEGER DEFAULT 0,
  shortlisted_count INTEGER DEFAULT 0,
  job_embedding     VECTOR(1024),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_company     ON jobs(company_id);
CREATE INDEX idx_jobs_status      ON jobs(status);
CREATE INDEX idx_jobs_skills      ON jobs USING GIN(skills_required);

-- ── JOB INSIGHTS ─────────────────────────────────────────────
CREATE TABLE job_insights (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id                    UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  clarity_score             INTEGER,
  competitiveness_score     INTEGER,
  expected_salary_min       BIGINT,
  expected_salary_max       BIGINT,
  suggested_skills          TEXT[],
  jd_improvements           TEXT[],
  candidate_pool_estimate   TEXT,
  time_to_fill_estimate     TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id)
);

-- ── APPLICATIONS ─────────────────────────────────────────────
CREATE TABLE applications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id              UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id        UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  status              application_status DEFAULT 'applied',
  ats_score           DECIMAL(5,2),
  interest_confirmed  BOOLEAN DEFAULT FALSE,
  current_salary      BIGINT,
  expected_salary     BIGINT,
  notice_period_days  INTEGER,
  open_to_relocation  BOOLEAN,
  has_other_offers    BOOLEAN DEFAULT FALSE,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);

CREATE INDEX idx_applications_job       ON applications(job_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_status    ON applications(status);

-- ── INTEREST CONFIRMATIONS ────────────────────────────────────
CREATE TABLE interest_confirmations (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id       UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  candidate_user_id    UUID NOT NULL REFERENCES auth.users(id),
  interested           BOOLEAN NOT NULL,
  current_salary       BIGINT,
  expected_salary      BIGINT,
  notice_period_days   INTEGER,
  open_to_relocation   BOOLEAN,
  has_other_offers     BOOLEAN DEFAULT FALSE,
  other_offers_details TEXT,
  confirmed_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (application_id, candidate_user_id)
);

-- ── VERIFICATION STAGES ───────────────────────────────────────
CREATE TABLE verification_stages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id        UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  stage               verification_stage NOT NULL,
  status              stage_status DEFAULT 'pending',
  score               DECIMAL(5,2),
  feedback            TEXT,
  assigned_expert_id  UUID REFERENCES auth.users(id),
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (candidate_id, stage)
);

CREATE INDEX idx_verification_candidate ON verification_stages(candidate_id);

-- ── WORK SAMPLE CHALLENGES ────────────────────────────────────
CREATE TABLE work_sample_challenges (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id        UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  role_type           TEXT NOT NULL,
  task_description    TEXT NOT NULL,
  submission_url      TEXT,
  submission_content  TEXT,
  ai_score            DECIMAL(5,2),
  ai_feedback         JSONB,
  expert_score        DECIMAL(5,2),
  expert_feedback     TEXT,
  status              stage_status DEFAULT 'pending',
  assigned_at         TIMESTAMPTZ DEFAULT NOW(),
  submitted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── CANDIDATE PASSPORTS ───────────────────────────────────────
CREATE TABLE candidate_passports (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_id          TEXT NOT NULL UNIQUE,
  candidate_id         UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  ats_score            DECIMAL(5,2) DEFAULT 0,
  portfolio_score      DECIMAL(5,2) DEFAULT 0,
  work_sample_score    DECIMAL(5,2) DEFAULT 0,
  technical_score      DECIMAL(5,2) DEFAULT 0,
  communication_score  DECIMAL(5,2) DEFAULT 0,
  reliability_score    DECIMAL(5,2) DEFAULT 0,
  fraud_risk           fraud_risk DEFAULT 'low',
  fraud_score          DECIMAL(5,2) DEFAULT 0,
  joining_probability  DECIMAL(5,2) DEFAULT 0,
  overall_trust_score  DECIMAL(5,2) DEFAULT 0,
  verification_status  verification_status DEFAULT 'verified',
  final_recommendation final_recommendation DEFAULT 'recommended',
  verified_at          TIMESTAMPTZ,
  expires_at           TIMESTAMPTZ,
  share_url            TEXT,
  pdf_url              TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (candidate_id)
);

CREATE INDEX idx_passport_id ON candidate_passports(passport_id);

-- ── EXPERTS ───────────────────────────────────────────────────
CREATE TABLE expert_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  avatar_url      TEXT,
  domains         TEXT[] DEFAULT '{}',
  bio             TEXT,
  linkedin_url    TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  available       BOOLEAN DEFAULT TRUE,
  rating          DECIMAL(3,2) DEFAULT 0,
  total_reviews   INTEGER DEFAULT 0,
  earnings_total  BIGINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ── EXPERT EVALUATIONS ────────────────────────────────────────
CREATE TABLE expert_evaluations (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id                   UUID NOT NULL REFERENCES expert_profiles(id),
  candidate_id                UUID NOT NULL REFERENCES candidate_profiles(id),
  verification_stage_id       UUID REFERENCES verification_stages(id),
  technical_knowledge_score   INTEGER CHECK (technical_knowledge_score BETWEEN 0 AND 30),
  project_understanding_score INTEGER CHECK (project_understanding_score BETWEEN 0 AND 25),
  problem_solving_score       INTEGER CHECK (problem_solving_score BETWEEN 0 AND 20),
  communication_score         INTEGER CHECK (communication_score BETWEEN 0 AND 15),
  professionalism_score       INTEGER CHECK (professionalism_score BETWEEN 0 AND 10),
  total_score                 INTEGER GENERATED ALWAYS AS (
    COALESCE(technical_knowledge_score,0) +
    COALESCE(project_understanding_score,0) +
    COALESCE(problem_solving_score,0) +
    COALESCE(communication_score,0) +
    COALESCE(professionalism_score,0)
  ) STORED,
  strengths                   TEXT,
  weaknesses                  TEXT,
  recommendation              TEXT,
  recording_url               TEXT,
  completed_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  action_url  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- ── AUDIT LOGS ────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id TEXT,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user     ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);

-- ── FRAUD FLAGS ───────────────────────────────────────────────
CREATE TABLE fraud_flags (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  flag_type    TEXT NOT NULL,
  description  TEXT,
  severity     fraud_risk DEFAULT 'low',
  resolved     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE companies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_stages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_passports    ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_evaluations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_confirmations ENABLE ROW LEVEL SECURITY;

-- Companies: employers own their company
CREATE POLICY "employer_own_company"      ON companies FOR ALL USING (user_id = auth.uid());

-- Candidates: own their profile
CREATE POLICY "candidate_own_profile"     ON candidate_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "employer_read_candidates"  ON candidate_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM companies WHERE user_id = auth.uid())
);

-- Jobs: employers manage their jobs; anyone can read active
CREATE POLICY "employer_manage_jobs"      ON jobs FOR ALL USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "public_read_active_jobs"   ON jobs FOR SELECT USING (status = 'active');

-- Applications: candidate sees own; employer sees for their jobs
CREATE POLICY "candidate_own_applications" ON applications FOR ALL USING (
  candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "employer_sees_applications" ON applications FOR SELECT USING (
  job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
);

-- Passports: candidate owns; employer reads verified ones
CREATE POLICY "candidate_own_passport"    ON candidate_passports FOR ALL USING (
  candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "employer_read_passports"   ON candidate_passports FOR SELECT USING (
  EXISTS (SELECT 1 FROM companies WHERE user_id = auth.uid())
);

-- Notifications: own only
CREATE POLICY "own_notifications"         ON notifications FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_candidate_profiles_updated_at
  BEFORE UPDATE ON candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_passports_updated_at
  BEFORE UPDATE ON candidate_passports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Increment job applicant count when application is created
CREATE OR REPLACE FUNCTION increment_job_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs SET applicant_count = applicant_count + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_applicants
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION increment_job_applicant_count();

-- Auto-create notification on verification completion
CREATE OR REPLACE FUNCTION notify_on_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
    INSERT INTO notifications (user_id, title, body, type, action_url)
    SELECT
      cp.user_id,
      '🎉 Verification Complete!',
      'Your Candidate Passport is ready. Share it with employers.',
      'verification_complete',
      '/candidate/passport'
    FROM candidate_profiles cp WHERE cp.id = NEW.candidate_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_verification
  AFTER UPDATE ON candidate_passports
  FOR EACH ROW EXECUTE FUNCTION notify_on_verification();
