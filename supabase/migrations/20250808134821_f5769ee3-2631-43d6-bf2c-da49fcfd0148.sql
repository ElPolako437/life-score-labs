-- Enable HTTP from Postgres to call the Edge Function
create extension if not exists pg_net;

-- Create a trigger function that invokes the Edge Function after each insert
create or replace function public.call_send_bioage_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  endpoint text := 'https://aorrcpmlkubsmrthzals.supabase.co/functions/v1/send-bioage-email';
begin
  perform
    net.http_post(
      url := endpoint,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('record', to_jsonb(NEW))
    );
  return NEW;
end;
$$;

-- Create the trigger on bioage_submissions
drop trigger if exists trg_send_bioage_email on public.bioage_submissions;
create trigger trg_send_bioage_email
after insert on public.bioage_submissions
for each row execute function public.call_send_bioage_email();