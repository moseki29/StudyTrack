create table if not exists public.daily_target_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.daily_target_data enable row level security;

drop policy if exists "Users can read their own daily target data" on public.daily_target_data;
create policy "Users can read their own daily target data"
  on public.daily_target_data for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own daily target data" on public.daily_target_data;
create policy "Users can insert their own daily target data"
  on public.daily_target_data for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own daily target data" on public.daily_target_data;
create policy "Users can update their own daily target data"
  on public.daily_target_data for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
