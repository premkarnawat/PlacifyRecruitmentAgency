-- ============================================================
-- VERIQO Migration 004 — Candidate Pipeline Management
-- ============================================================

CREATE TYPE pipeline_status AS ENUM (
  'new',
  'ats_matched',
  'interested',
  'verification_pending',
  'verified',
  'interview_scheduled',
  'offer',
  'joined',
  'rejected'
);

-- ── PIPELINE CANDIDATES ──────────────────────────────────────
-- Tracks where each candidate sits in a specific job pipeline
CREATE TABLE pipeline_candidates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id    UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pipeline_status pipeline_status NOT NULL DEFAULT 'new',
  ats_score       DECIMAL(5,2),
  trust_score     DECIMAL(5,2),
  position        INTEGER DEFAULT 0,    -- order within column
  tags            TEXT[] DEFAULT '{}',
  starred         BOOLEAN DEFAULT FALSE,
  recruiter_notes TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (application_id)
);

CREATE INDEX idx_pipeline_job_status ON pipeline_candidates(job_id, pipeline_status);
CREATE INDEX idx_pipeline_company    ON pipeline_candidates(company_id, pipeline_status);
CREATE INDEX idx_pipeline_candidate  ON pipeline_candidates(candidate_id);

-- ── PIPELINE STATUS HISTORY ───────────────────────────────────
CREATE TABLE pipeline_status_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id     UUID NOT NULL REFERENCES pipeline_candidates(id) ON DELETE CASCADE,
  from_status     pipeline_status,
  to_status       pipeline_status NOT NULL,
  changed_by      UUID REFERENCES auth.users(id),
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipeline_history ON pipeline_status_history(pipeline_id, created_at DESC);

-- ── TRIGGER: sync pipeline_status → applications.status ──────
CREATE OR REPLACE FUNCTION sync_pipeline_to_application()
RETURNS TRIGGER AS $$
DECLARE
  mapped_status application_status;
BEGIN
  mapped_status := CASE NEW.pipeline_status
    WHEN 'new'                  THEN 'applied'
    WHEN 'ats_matched'          THEN 'ats_matched'
    WHEN 'interested'           THEN 'interest_confirmed'
    WHEN 'verification_pending' THEN 'screening'
    WHEN 'verified'             THEN 'portfolio_verified'
    WHEN 'interview_scheduled'  THEN 'interview_scheduled'
    WHEN 'offer'                THEN 'offered'
    WHEN 'joined'               THEN 'hired'
    WHEN 'rejected'             THEN 'rejected'
    ELSE 'applied'
  END;

  UPDATE applications
  SET status = mapped_status, updated_at = NOW()
  WHERE id = NEW.application_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_pipeline_status
  AFTER UPDATE OF pipeline_status ON pipeline_candidates
  FOR EACH ROW
  WHEN (OLD.pipeline_status IS DISTINCT FROM NEW.pipeline_status)
  EXECUTE FUNCTION sync_pipeline_to_application();

-- ── TRIGGERS ─────────────────────────────────────────────────
CREATE TRIGGER trg_pipeline_updated_at
  BEFORE UPDATE ON pipeline_candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE pipeline_candidates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employer_pipeline" ON pipeline_candidates FOR ALL USING (
  company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
);
CREATE POLICY "candidate_pipeline_view" ON pipeline_candidates FOR SELECT USING (
  candidate_id IN (SELECT id FROM candidate_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "employer_pipeline_history" ON pipeline_status_history FOR SELECT USING (
  pipeline_id IN (SELECT id FROM pipeline_candidates WHERE company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ))
);
