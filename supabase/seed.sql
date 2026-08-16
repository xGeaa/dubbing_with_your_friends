-- supabase/seed.sql
-- Clips para "Dubbing With Your Friends"
-- IDs: gen_random_uuid() — compatible con columna uuid.
-- characters: personajes del clip (uno por jugador).
--
-- VERIFICAR timestamps en: https://youtu.be/<youtube_id>?t=<start_sec>

TRUNCATE TABLE clips CASCADE;

INSERT INTO clips (id, youtube_id, start_sec, end_sec, title, category, characters) VALUES

-- ─── MADAGASCAR ────────────────────────────────────────────────────────────────
(gen_random_uuid(), 'ApuFuuCJc3s',  0,  45, 'I Like to Move It — Madagascar',             'animation', ARRAY['King Julian', 'Mort', 'Maurice']),
(gen_random_uuid(), 'UjEyM3HDGUU',  0,  40, 'Meeting King Julian — Madagascar',           'animation', ARRAY['King Julian', 'Mort']),
(gen_random_uuid(), '8ty1025m6XQ',  0,  38, 'Mort cruza la línea — Madagascar',           'animation', ARRAY['King Julian', 'Mort']),
(gen_random_uuid(), 'bh4574Ndgco',  5,  40, 'Alex y los pingüinos — Madagascar',          'animation', ARRAY['Alex', 'Pinguino jefe']),
(gen_random_uuid(), 'KchwikGg9M0',  0,  35, 'Pingüinos preparan la huida — Madagascar',   'animation', ARRAY['Pinguino jefe', 'Pinguino 2']),

-- ─── SHREK ─────────────────────────────────────────────────────────────────────
(gen_random_uuid(), '6Q6qHRHTTPg',  0,  40, 'Talking Donkey — Shrek',                    'animation', ARRAY['Shrek', 'Burro']),
(gen_random_uuid(), 'zUQ9bjBfiRk',  0,  30, 'Ogres Are Like Onions — Shrek',             'animation', ARRAY['Shrek', 'Burro']),
(gen_random_uuid(), 'IW9SL-5ahuM', 10,  50, '¿Ya llegamos? — Shrek 2',                   'animation', ARRAY['Shrek', 'Burro', 'Fiona']),

-- ─── KUNG FU PANDA ──────────────────────────────────────────────────────────────
(gen_random_uuid(), 'QZlOZtdJA50',  0,  40, 'Po intenta entrar — Kung Fu Panda',          'animation', ARRAY['Po', 'Tigresa']),
(gen_random_uuid(), 'qj-Mlygkheg',  0,  35, 'No hay accidentes — Kung Fu Panda',          'animation', ARRAY['Oogway', 'Shifu']),
(gen_random_uuid(), 'Bqvm_iMBNPU',  5,  42, 'Roba la bola — Kung Fu Panda',              'animation', ARRAY['Po', 'Shifu']),

-- ─── MR. BEAN ──────────────────────────────────────────────────────────────────
(gen_random_uuid(), 'wk2oRMHOyjE',  8,  45, 'Mr. Bean en el dentista',                   'classic',   ARRAY['Mr. Bean', 'Dentista']),
(gen_random_uuid(), 'nIHyr_fp_yI',  5,  42, 'Mr. Bean y el pavo de Navidad',             'classic',   ARRAY['Mr. Bean']),
(gen_random_uuid(), 'iI3pRSqjPsc', 10,  48, 'Mr. Bean en la playa',                      'classic',   ARRAY['Mr. Bean']),
(gen_random_uuid(), 'P2qezAF7edI',  5,  40, 'Mr. Bean en el examen',                     'classic',   ARRAY['Mr. Bean', 'Vecino del examen']),

-- ─── TOM & JERRY ────────────────────────────────────────────────────────────────
(gen_random_uuid(), 'Gkysb_8N9os',  0,  35, 'Tom & Jerry — persecución clásica',          'classic',   ARRAY['Tom', 'Jerry']),

-- ─── ICE AGE — SCRAT (sin diálogos, comedia física pura) ────────────────────────
(gen_random_uuid(), 'ObfjzFv9Ci0',  0,  40, 'Scrat y la bellota — Ice Age',              'animation', ARRAY['Scrat']),
(gen_random_uuid(), 'K3v-WIGPAo0',  0,  38, 'Scrat desencadena la era del hielo',        'animation', ARRAY['Scrat']),
(gen_random_uuid(), '6t8R7egfY4c',  0,  35, 'Scrat congelado — Ice Age',                 'animation', ARRAY['Scrat']),
(gen_random_uuid(), 'K0BL-S7T5FM',  0,  40, 'Scrat con tecnología alienígena',           'animation', ARRAY['Scrat']),

-- ─── FINDING NEMO ────────────────────────────────────────────────────────────────
(gen_random_uuid(), 'zomVJJUZW3M',  0,  38, 'Dory habla ballena — Nemo',                 'animation', ARRAY['Dory', 'Marlin']),
(gen_random_uuid(), 'eyvlP87wZOg',  0,  35, 'Fish Are Friends — Nemo',                   'animation', ARRAY['Bruce el tiburón', 'Marlin', 'Dory']),

-- ─── MINIONS ────────────────────────────────────────────────────────────────────
(gen_random_uuid(), 'Exn8CdNwByw',  5,  42, 'Minions trabajando — Despicable Me',        'animation', ARRAY['Minion 1', 'Minion 2', 'Minion 3']),
(gen_random_uuid(), 'PPc1K3nQUNk',  8,  45, 'Minions siendo Minions',                    'animation', ARRAY['Minion 1', 'Minion 2']),

-- ─── NATURALEZA ─────────────────────────────────────────────────────────────────
(gen_random_uuid(), 'lWMzqjQ3MJA',  0,  35, 'Pingüinos resbalando',                      'nature',    ARRAY['Pingüino 1', 'Pingüino 2']);
