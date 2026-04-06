-- Create table for bioage submissions
create table if not exists public.bioage_submissions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  firstname text not null,
  answers jsonb not null,
  score_total integer not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.bioage_submissions enable row level security;

-- Policies
create policy "Allow anyone to insert bioage submissions"
  on public.bioage_submissions
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow authenticated users to view bioage submissions"
  on public.bioage_submissions
  for select
  to authenticated
  using (auth.uid() is not null);

-- Do not allow update/delete by default (no policies created)

-- Validation/processing function (placeholder as requested)
create or replace function public.validate_and_set_bioage_submission()
returns trigger as $$
begin
  -- Placeholder for future validations (e.g., check answers has 15 entries each 0-3)
  -- and automatic computations (e.g., compute score_total).
  return new;
end;
$$ language plpgsql security definer;

-- Trigger using the function
drop trigger if exists trg_validate_and_set_bioage_submission on public.bioage_submissions;
create trigger trg_validate_and_set_bioage_submission
  before insert on public.bioage_submissions
  for each row
  execute function public.validate_and_set_bioage_submission();

-- Indexes to support querying and performance
create index if not exists idx_bioage_submissions_created_at
  on public.bioage_submissions (created_at);

create index if not exists idx_bioage_submissions_email
  on public.bioage_submissions (lower(email));

create index if not exists idx_bioage_submissions_answers_gin
  on public.bioage_submissions using gin (answers);
