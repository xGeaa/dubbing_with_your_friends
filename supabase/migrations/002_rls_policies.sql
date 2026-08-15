-- =============================================================================
-- Migration 002 — RLS Policies
-- =============================================================================

-- CLIPS: lectura pública (el frontend los lista sin autenticación)
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clips_public_read"
  ON clips
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- GAME_SESSIONS: solo accesible desde el backend (service_role salta RLS)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
-- Sin políticas públicas → bloqueado para anon/authenticated

-- RECORDINGS: solo accesible desde el backend (service_role salta RLS)
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
-- Sin políticas públicas → bloqueado para anon/authenticated

-- Índice para búsquedas rápidas por código de sala
CREATE INDEX IF NOT EXISTS idx_game_sessions_room_code
  ON game_sessions (room_code);
