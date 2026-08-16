-- supabase/migrations/003_add_characters.sql
-- Añade la columna characters a clips.
-- Los valores se rellenan al re-ejecutar el seed.sql.

ALTER TABLE clips
  ADD COLUMN IF NOT EXISTS characters TEXT[] NOT NULL DEFAULT '{}';
