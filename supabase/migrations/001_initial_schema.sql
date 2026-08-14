-- Clips de vídeo curados
CREATE TABLE clips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id  TEXT NOT NULL,
  start_sec   INTEGER NOT NULL DEFAULT 0,
  end_sec     INTEGER NOT NULL,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  language    TEXT DEFAULT 'any',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones de juego
CREATE TABLE game_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code    CHAR(4) NOT NULL,
  clip_id      UUID REFERENCES clips(id),
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  player_count INTEGER
);

-- Grabaciones de audio
CREATE TABLE recordings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id  UUID REFERENCES game_sessions(id),
  player_nickname  TEXT NOT NULL,
  storage_path     TEXT NOT NULL,
  votes_received   INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
