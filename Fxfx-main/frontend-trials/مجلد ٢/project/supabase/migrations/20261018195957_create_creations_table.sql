/*
# Create creations table (single-tenant, no auth)

## Purpose
TEXTFX is a Creative Intelligence Operating System for generative text effects.
This table persists user-saved "creations" — a snapshot of text + effect + control
values so a composition can be recalled later from the Archive view.

## New Tables
- `creations`
  - `id` (uuid, primary key)
  - `title` (text, not null) — user-given name for the saved composition
  - `text` (text, not null) — the source string the effect is applied to
  - `effect_id` (text, not null) — references an effect id in the client engine
  - `values` (jsonb, not null default '{}') — control values for the effect
  - `family` (text, not null) — the effect family, for grouping/filtering
  - `created_at` (timestamptz, default now())

## Security
- Enable RLS on `creations`.
- This is a single-tenant app with no sign-in screen, so the anon-key client
  must be able to read and write its own data. All four CRUD policies are
  scoped `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because the data is intentionally shared/public within this workspace.

## Notes
1. No `user_id` column — no auth in this app.
2. `values` is jsonb so the flexible per-effect control map can be stored
   without schema changes when new effects are added to the engine.
3. Indexed on `created_at desc` so the Archive loads in reverse-chronological
   order efficiently.
*/

CREATE TABLE IF NOT EXISTS creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  text text NOT NULL,
  effect_id text NOT NULL,
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  family text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creations_created_at_idx
  ON creations (created_at DESC);

ALTER TABLE creations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_creations" ON creations;
CREATE POLICY "anon_select_creations" ON creations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_creations" ON creations;
CREATE POLICY "anon_insert_creations" ON creations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_creations" ON creations;
CREATE POLICY "anon_update_creations" ON creations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_creations" ON creations;
CREATE POLICY "anon_delete_creations" ON creations FOR DELETE
  TO anon, authenticated USING (true);
