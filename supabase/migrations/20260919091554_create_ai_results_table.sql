/*
# Create ai_results table (single-tenant, no auth)

## Purpose
Persists AI analysis results from the Regional Language Multimodal AI camera app.
Each row represents one AI analysis: the captured frame, detected gesture,
regional-language text, English translation, emoji, confidence score, audio URL,
and the language code used for the request.

## 1. New Tables

### `ai_results`
- `id` (uuid, primary key, auto-generated)
- `emoji` (text, the emoji returned by the AI backend, e.g. "👋")
- `gesture` (text, detected gesture name, e.g. "Wave")
- `regional_text` (text, regional-language output, e.g. "नमस्ते")
- `translation` (text, English translation, e.g. "Hello")
- `confidence` (numeric, 0..1 confidence score from the AI backend)
- `audio_url` (text, URL or data URI of the AI voice output, nullable)
- `language` (text, language code sent with the request, e.g. "hi")
- `image_data` (text, base64 JPEG of the captured frame, nullable)
- `created_at` (timestamptz, defaults to now)

## 2. Indexes
- `idx_ai_results_created_at` on `created_at DESC` — history panel queries newest first.

## 3. Security
- Enable RLS on `ai_results`.
- This is a single-tenant app with no sign-in screen, so all CRUD is
  intentionally public/shared. Policies use `TO anon, authenticated`
  so the anon-key frontend can read and write its own data.
- Four separate policies (SELECT, INSERT, UPDATE, DELETE) — no `FOR ALL`.

## 4. Notes
- `confidence` is stored as numeric(5,4) to hold values 0.0000–1.0000.
- `image_data` is nullable so results can be stored without the full frame
  if storage size becomes a concern.
- `audio_url` is nullable because not every AI response includes audio.
*/

CREATE TABLE IF NOT EXISTS ai_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji text NOT NULL DEFAULT '',
  gesture text NOT NULL DEFAULT '',
  regional_text text NOT NULL DEFAULT '',
  translation text NOT NULL DEFAULT '',
  confidence numeric(5,4) NOT NULL DEFAULT 0,
  audio_url text,
  language text NOT NULL DEFAULT '',
  image_data text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_results_created_at ON ai_results (created_at DESC);

ALTER TABLE ai_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ai_results" ON ai_results;
CREATE POLICY "anon_select_ai_results"
  ON ai_results FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_insert_ai_results" ON ai_results;
CREATE POLICY "anon_insert_ai_results"
  ON ai_results FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ai_results" ON ai_results;
CREATE POLICY "anon_update_ai_results"
  ON ai_results FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ai_results" ON ai_results;
CREATE POLICY "anon_delete_ai_results"
  ON ai_results FOR DELETE
  TO anon, authenticated
  USING (true);
