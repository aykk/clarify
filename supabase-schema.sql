-- Run this in your Supabase SQL editor

create table if not exists trigger_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  trigger_phrase text not null,
  phone_number text not null,
  phone_numbers jsonb,
  message text not null,
  created_at timestamptz default now()
);

-- Row level security
alter table trigger_rules enable row level security;

create policy "Users can manage their own rules"
  on trigger_rules
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
