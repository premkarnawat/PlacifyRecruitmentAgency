-- ============================================================
-- VERIQO Migration 002 — pgvector (replaces Qdrant)
-- Run after 001_initial_schema.sql
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ── CANDIDATE EMBEDDINGS ─────────────────────────────────────
-- Separate table keeps candidate_profiles row slim
CREATE TABLE IF NOT EXISTS candidate_embeddings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id  UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  embedding     VECTOR(1536) NOT NULL,
  model         TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  source_hash   TEXT,          -- md5 of resume text to detect staleness
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (candidate_id)
);

-- IVFFlat index for fast approximate cosine search
-- lists = 100 is good for up to ~500k rows; raise to 200 at 1M+
CREATE INDEX IF NOT EXISTS idx_candidate_embeddings_cosine
  ON candidate_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── JOB EMBEDDINGS ────────────────────────────────────────────
-- Drop legacy 1024-dim column, add 1536-dim
ALTER TABLE jobs
  DROP COLUMN IF EXISTS job_embedding,
  ADD COLUMN IF NOT EXISTS job_embedding VECTOR(1536),
  ADD COLUMN IF NOT EXISTS jd_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_job_embeddings_cosine
  ON jobs
  USING ivfflat (job_embedding vector_cosine_ops)
  WITH (lists = 50);

-- ── SIMILARITY SEARCH HELPER FUNCTION ────────────────────────
-- Returns top N candidates for a job, ordered by cosine similarity
CREATE OR REPLACE FUNCTION search_candidates_by_job(
  p_job_id       UUID,
  p_limit        INTEGER DEFAULT 20,
  p_min_score    FLOAT   DEFAULT 0.5
)
RETURNS TABLE (
  candidate_id  UUID,
  similarity    FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.candidate_id,
    1 - (ce.embedding <=> j.job_embedding) AS similarity
  FROM jobs j
  CROSS JOIN candidate_embeddings ce
  WHERE j.id = p_job_id
    AND j.job_embedding IS NOT NULL
    AND (1 - (ce.embedding <=> j.job_embedding)) >= p_min_score
  ORDER BY ce.embedding <=> j.job_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
CREATE TRIGGER trg_candidate_embeddings_updated_at
  BEFORE UPDATE ON candidate_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE candidate_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidate_own_embedding"
  ON candidate_embeddings FOR ALL
  USING (
    candidate_id IN (
      SELECT id FROM candidate_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "employer_read_embeddings"
  ON candidate_embeddings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM companies WHERE user_id = auth.uid())
  );
