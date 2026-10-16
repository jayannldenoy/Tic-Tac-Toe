create extension if not exists pgcrypto;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  username text not null check (char_length(username) between 1 and 32),
  avatar_url text not null default '',
  links text[] not null default '{}',
  skills text[] not null default '{}',
  player_x text not null default 'Player X',
  player_o text not null default 'Player O',
  x_color text not null default '#39ff14',
  o_color text not null default '#cc00ff',
  template text not null default 'simple' check (template in ('simple', 'modern', 'creative')),
  updated_at timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "Anyone can read games"
  on public.games for select to anon, authenticated using (true);
create policy "Anyone can create games"
  on public.games for insert to anon, authenticated with check (true);
create policy "Anyone can update games"
  on public.games for update to anon, authenticated using (true) with check (true);
create policy "Anyone can delete games"
  on public.games for delete to anon, authenticated using (true);

grant select, insert, update, delete on public.games to anon, authenticated;