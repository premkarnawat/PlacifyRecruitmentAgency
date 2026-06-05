-- ============================================================
-- VERIQO Migration 005 — Work Sample Engine V2
-- ============================================================

CREATE TABLE work_sample_batches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID REFERENCES jobs(id),
  company_id  UUID REFERENCES companies(id),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Extend existing work_sample_challenges
ALTER TABLE work_sample_challenges
  ADD COLUMN IF NOT EXISTS batch_id          UUID REFERENCES work_sample_batches(id),
  ADD COLUMN IF NOT EXISTS application_id    UUID REFERENCES applications(id),
  ADD COLUMN IF NOT EXISTS evaluation_rubric JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS submission_files  TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_limit_hours  INTEGER DEFAULT 48,
  ADD COLUMN IF NOT EXISTS due_at            TIMESTAMPTZ;

CREATE INDEX idx_work_samples_application ON work_sample_challenges(application_id);
CREATE INDEX idx_work_samples_batch       ON work_sample_challenges(batch_id);

-- ============================================================
-- VERIQO Migration 006 — Trust Score V2 + Reliability Engine
-- ============================================================

-- ── TRUST SCORE HISTORY ───────────────────────────────────────
CREATE TABLE trust_score_history (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id         UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  overall_score        DECIMAL(5,2) NOT NULL,
  ats_component        DECIMAL(5,2) DEFAULT 0,
  portfolio_component  DECIMAL(5,2) DEFAULT 0,
  work_sample_component DECIMAL(5,2) DEFAULT 0,
  expert_component     DECIMAL(5,2) DEFAULT 0,
  communication_component DECIMAL(5,2) DEFAULT 0,
  reliability_component DECIMAL(5,2) DEFAULT 0,
  score_breakdown      JSONB DEFAULT '{}',
  trigger_event        TEXT,  -- what caused recalculation
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_history_candidate ON trust_score_history(candidate_id, created_at DESC);

-- ── RELIABILITY EVENTS ────────────────────────────────────────
CREATE TYPE reliability_event_type AS ENUM (
  'interview_attended',
  'interview_no_show',
  'offer_accepted',
  'offer_declined',
  'joined',
  'ghosted',
  'response_fast',
  'response_slow',
  'communication_positive',
  'communication_issue'
);

CREATE TABLE reliability_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id    UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id),
  event_type      reliability_event_type NOT NULL,
  weight          DECIMAL(4,2) DEFAULT 1.0,   -- positive or negative multiplier
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reliability_events_candidate ON reliability_events(candidate_id, created_at DESC);

-- ── RELIABILITY SCORES ────────────────────────────────────────
CREATE TABLE reliability_scores (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id            UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  score                   DECIMAL(5,2) NOT NULL DEFAULT 0,
  interview_attendance    DECIMAL(5,2) DEFAULT 0,
  response_time           DECIMAL(5,2) DEFAULT 0,
  offer_acceptance_rate   DECIMAL(5,2) DEFAULT 0,
  joining_rate            DECIMAL(5,2) DEFAULT 0,
  communication_score     DECIMAL(5,2) DEFAULT 0,
  risk_flags              TEXT[] DEFAULT '{}',
  last_calculated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (candidate_id)
);

ALTER TABLE reliability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reliability_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidate_own_trust_history" ON trust_score_history FOR ALL USING (
  candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "employer_read_trust_history" ON trust_score_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "candidate_own_reliability" ON reliability_scores FOR ALL USING (
  candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "employer_read_reliability" ON reliability_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM companies WHERE user_id = auth.uid())
);

-- ============================================================
-- VERIQO Migration 007 — Bulk Upload + Search
-- ============================================================

CREATE TYPE bulk_upload_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'partial'
);

CREATE TABLE bulk_upload_batches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id          UUID REFERENCES jobs(id),
  uploaded_by     UUID NOT NULL REFERENCES auth.users(id),
  upload_type     TEXT NOT NULL,         -- 'csv', 'resume_zip', 'multi_resume'
  file_url        TEXT,
  total_count     INTEGER DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  success_count   INTEGER DEFAULT 0,
  fail_count      INTEGER DEFAULT 0,
  status          bulk_upload_status DEFAULT 'pending',
  report_url      TEXT,                  -- generated screening report PDF
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bulk_upload_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id         UUID NOT NULL REFERENCES bulk_upload_batches(id) ON DELETE CASCADE,
  candidate_id     UUID REFERENCES candidate_profiles(id),
  raw_name         TEXT,
  raw_email        TEXT,
  raw_data         JSONB DEFAULT '{}',
  ats_score        DECIMAL(5,2),
  trust_score      DECIMAL(5,2),
  parse_status     TEXT DEFAULT 'pending',
  parse_error      TEXT,
  rank             INTEGER,
  shortlisted      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bulk_items_batch ON bulk_upload_items(batch_id, shortlisted);

-- ── JOB REQUIREMENTS CACHE (AI JD Analyzer output) ───────────
CREATE TABLE job_requirements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id            UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  required_skills   TEXT[] DEFAULT '{}',
  optional_skills   TEXT[] DEFAULT '{}',
  priority_skills   TEXT[] DEFAULT '{}',
  experience_min    INTEGER,
  experience_max    INTEGER,
  location          TEXT,
  salary_min        BIGINT,
  salary_max        BIGINT,
  responsibilities  TEXT[] DEFAULT '{}',
  raw_analysis      JSONB DEFAULT '{}',
  model_version     TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (job_id)
);

-- RLS
ALTER TABLE bulk_upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_upload_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requirements    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employer_bulk_batches" ON bulk_upload_batches FOR ALL USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "employer_bulk_items" ON bulk_upload_items FOR ALL USING (
  batch_id IN (SELECT id FROM bulk_upload_batches WHERE company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "employer_job_requirements" ON job_requirements FOR ALL USING (
  job_id IN (SELECT id FROM jobs WHERE company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ))
);
