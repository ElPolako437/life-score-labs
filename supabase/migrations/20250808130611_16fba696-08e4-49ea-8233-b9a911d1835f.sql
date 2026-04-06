-- Fix linter warning by setting a stable search_path on the function
create or replace function public.validate_and_set_bioage_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;