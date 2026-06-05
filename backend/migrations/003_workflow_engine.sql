-- ============================================================
-- VERIQO Migration 003 — Hiring Workflow Engine
-- ============================================================

-- ── ENUMS ─────────────────────────────────────────────────────
CREATE TYPE workflow_state AS ENUM (
  'job_created',
  'agency_review',
  'ats_matching',
  'candidate_interest_check',
  'verification_pending',
  'verification_complete',
  'company_review',
  'interview_scheduled',
  'interview_completed',
  'offer_released',
  'offer_accepted',
  'joined',
  'invoice_generated'
);

CREATE TYPE actor_role AS ENUM ('system', 'employer', 'candidate', 'expert', 'admin');

-- ── HIRING WORKFLOWS ─────────────────────────────────────────
-- One workflow per (job, candidate application) pair
CREATE TABLE hiring_workflows (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id    UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  state           workflow_state NOT NULL DEFAULT 'job_created',
  previous_state  workflow_state,
  assigned_to     UUID REFERENCES auth.users(id),
  priority        INTEGER DEFAULT 0,        -- higher = more urgent
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (application_id)
);

CREATE INDEX idx_workflows_job       ON hiring_workflows(job_id, state);
CREATE INDEX idx_workflows_candidate ON hiring_workflows(candidate_id);
CREATE INDEX idx_workflows_company   ON hiring_workflows(company_id, state);

-- ── WORKFLOW TRANSITIONS ─────────────────────────────────────
-- Enforces valid state machine transitions
CREATE TABLE workflow_transitions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_state   workflow_state NOT NULL,
  to_state     workflow_state NOT NULL,
  label        TEXT NOT NULL,          -- human-readable action label
  allowed_by   actor_role[] NOT NULL,  -- which roles may trigger
  UNIQUE (from_state, to_state)
);

-- Seed valid transitions
INSERT INTO workflow_transitions (from_state, to_state, label, allowed_by) VALUES
  ('job_created',               'agency_review',            'Submit for Review',        ARRAY['employer','admin']::actor_role[]),
  ('agency_review',             'ats_matching',             'Approve & Run ATS',        ARRAY['employer','admin']::actor_role[]),
  ('agency_review',             'job_created',              'Send Back',                ARRAY['admin']::actor_role[]),
  ('ats_matching',              'candidate_interest_check', 'Confirm Match',            ARRAY['system','employer']::actor_role[]),
  ('candidate_interest_check',  'verification_pending',     'Interest Confirmed',       ARRAY['system','candidate']::actor_role[]),
  ('candidate_interest_check',  'ats_matching',             'Not Interested',           ARRAY['system','candidate']::actor_role[]),
  ('verification_pending',      'verification_complete',    'Verification Done',        ARRAY['system','expert','admin']::actor_role[]),
  ('verification_complete',     'company_review',           'Send to Company',          ARRAY['employer','admin']::actor_role[]),
  ('company_review',            'interview_scheduled',      'Schedule Interview',       ARRAY['employer','admin']::actor_role[]),
  ('company_review',            'ats_matching',             'Reject at Review',         ARRAY['employer','admin']::actor_role[]),
  ('interview_scheduled',       'interview_completed',      'Mark Interview Done',      ARRAY['employer','admin']::actor_role[]),
  ('interview_completed',       'offer_released',           'Release Offer',            ARRAY['employer','admin']::actor_role[]),
  ('interview_completed',       'ats_matching',             'Reject Post Interview',    ARRAY['employer','admin']::actor_role[]),
  ('offer_released',            'offer_accepted',           'Candidate Accepted',       ARRAY['system','candidate']::actor_role[]),
  ('offer_released',            'ats_matching',             'Offer Declined',           ARRAY['system','candidate']::actor_role[]),
  ('offer_accepted',            'joined',                   'Mark as Joined',           ARRAY['employer','admin']::actor_role[]),
  ('joined',                    'invoice_generated',        'Generate Invoice',         ARRAY['employer','admin','system']::actor_role[]);

-- ── WORKFLOW TIMELINE ─────────────────────────────────────────
-- Immutable audit log of every transition
CREATE TABLE workflow_timeline (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id   UUID NOT NULL REFERENCES hiring_workflows(id) ON DELETE CASCADE,
  from_state    workflow_state,
  to_state      workflow_state NOT NULL,
  actor_id      UUID REFERENCES auth.users(id),
  actor_role    actor_role NOT NULL DEFAULT 'system',
  notes         TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_workflow ON workflow_timeline(workflow_id, created_at DESC);

-- ── INTERVIEW SCHEDULES ───────────────────────────────────────
CREATE TABLE interview_schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID NOT NULL REFERENCES hiring_workflows(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_mins   INTEGER DEFAULT 60,
  format          TEXT DEFAULT 'video',   -- video, phone, onsite
  meeting_url     TEXT,
  interviewer_ids UUID[],
  reminder_sent   BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── OFFERS ───────────────────────────────────────────────────
CREATE TABLE offers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID NOT NULL REFERENCES hiring_workflows(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  offered_salary  BIGINT,
  joining_date    DATE,
  offer_letter_url TEXT,
  expiry_date     DATE,
  accepted_at     TIMESTAMPTZ,
  declined_at     TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (application_id)
);

-- ── INVOICES ─────────────────────────────────────────────────
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id     UUID NOT NULL REFERENCES hiring_workflows(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id),
  invoice_number  TEXT NOT NULL UNIQUE,
  amount          BIGINT NOT NULL,
  currency        TEXT DEFAULT 'INR',
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  pdf_url         TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRIGGERS ─────────────────────────────────────────────────
CREATE TRIGGER trg_workflows_updated_at
  BEFORE UPDATE ON hiring_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_interview_schedules_updated_at
  BEFORE UPDATE ON interview_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE hiring_workflows    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_timeline   ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices            ENABLE ROW LEVEL SECURITY;

-- Employers see workflows for their company
CREATE POLICY "employer_workflows" ON hiring_workflows FOR ALL USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "candidate_workflows" ON hiring_workflows FOR SELECT USING (
  candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "employer_timeline" ON workflow_timeline FOR SELECT USING (
  workflow_id IN (SELECT id FROM hiring_workflows WHERE company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "candidate_timeline" ON workflow_timeline FOR SELECT USING (
  workflow_id IN (SELECT id FROM hiring_workflows WHERE candidate_id IN (
    SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "employer_interviews" ON interview_schedules FOR ALL USING (
  workflow_id IN (SELECT id FROM hiring_workflows WHERE company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "candidate_interviews" ON interview_schedules FOR SELECT USING (
  application_id IN (SELECT id FROM applications WHERE candidate_id IN (
    SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "employer_offers" ON offers FOR ALL USING (
  workflow_id IN (SELECT id FROM hiring_workflows WHERE company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ))
);
CREATE POLICY "candidate_offers" ON offers FOR SELECT USING (
  application_id IN (SELECT id FROM applications WHERE candidate_id IN (
    SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "employer_invoices" ON invoices FOR ALL USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
