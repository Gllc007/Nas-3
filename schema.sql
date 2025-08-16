-- Tabla para almacenar aplicaciones NAS en Supabase
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  patient_name text not null,
  identifier text,
  note text,
  codes text[] not null,
  total_score numeric not null,
  ip text,
  user_agent text
);

-- RLS
alter table public.assessments enable row level security;

create policy "insert_public"
on public.assessments for insert
to anon
with check (true);

create policy "select_none"
on public.assessments for select
to anon
using (false);
