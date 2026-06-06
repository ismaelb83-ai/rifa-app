-- Tabla de participantes
create table participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  created_at timestamptz default now()
);

-- Tabla de boletos
create table tickets (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique check (number between 1 and 100),
  price integer not null,
  status text not null default 'available' check (status in ('available', 'reserved', 'confirmed')),
  participant_id uuid references participants(id),
  session_id text,
  reserved_at timestamptz,
  confirmed_at timestamptz
);

-- Tabla de sesiones de juego
create table game_sessions (
  id text primary key,
  participant_id uuid references participants(id),
  attempts_used integer default 0,
  tickets_in_cart uuid[],
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '30 minutes'
);

-- Insertar los 100 boletos con su distribución de precios
insert into tickets (number, price) values
  (1, 10), (2, 10), (3, 10), (4, 10), (5, 10),
  (6, 10), (7, 10), (8, 10), (9, 10), (10, 10),
  (11, 20), (12, 20), (13, 20), (14, 20), (15, 20),
  (16, 20), (17, 20), (18, 20),
  (19, 30), (20, 30), (21, 30), (22, 30), (23, 30),
  (24, 50), (25, 50), (26, 50), (27, 50), (28, 50),
  (29, 80), (30, 80), (31, 80), (32, 80), (33, 80),
  (34, 100), (35, 100), (36, 100), (37, 100), (38, 100),
  (39, 100), (40, 100), (41, 100), (42, 100), (43, 100),
  (44, 100), (45, 100), (46, 100), (47, 100), (48, 100),
  (49, 100), (50, 100), (51, 100), (52, 100), (53, 100),
  (54, 100), (55, 100), (56, 100), (57, 100), (58, 100),
  (59, 100), (60, 100), (61, 100), (62, 100),
  (63, 150), (64, 150), (65, 150), (66, 150), (67, 150),
  (68, 150), (69, 150), (70, 150), (71, 150), (72, 150),
  (73, 150), (74, 150), (75, 150), (76, 150), (77, 150),
  (78, 150), (79, 150), (80, 150), (81, 150), (82, 150),
  (83, 180), (84, 180), (85, 180), (86, 180), (87, 180),
  (88, 180), (89, 180), (90, 180), (91, 180), (92, 180),
  (93, 180), (94, 180), (95, 180),
  (96, 200), (97, 200), (98, 200), (99, 200), (100, 200);

-- Habilitar Row Level Security
alter table participants enable row level security;
alter table tickets enable row level security;
alter table game_sessions enable row level security;

-- Políticas públicas de lectura para lista pública
create policy "tickets_public_read" on tickets for select using (true);
create policy "participants_public_read" on participants for select using (true);
create policy "sessions_public_read" on game_sessions for select using (true);

-- Políticas de escritura para todos (la app controla la lógica)
create policy "tickets_insert" on tickets for insert with check (true);
create policy "tickets_update" on tickets for update using (true);
create policy "participants_insert" on participants for insert with check (true);
create policy "sessions_insert" on game_sessions for insert with check (true);
create policy "sessions_update" on game_sessions for update using (true);

-- Función para liberar boletos reservados expirados
create or replace function release_expired_tickets()
returns void as $$
  update tickets
  set status = 'available',
      participant_id = null,
      session_id = null,
      reserved_at = null
  where status = 'reserved'
    and reserved_at < now() - interval '30 minutes';
$$ language sql;
