-- Wires cancellation_requests INSERT -> notify-cancellation Edge Function.
-- Uses the public anon key as the bearer token (it's already public in the
-- portal JS; this is not a new secret), which satisfies the Edge Function's
-- default JWT verification.

create extension if not exists pg_net;

create or replace function public.notify_cancellation_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://yaergzpwmcqmnxhivzci.supabase.co/functions/v1/notify-cancellation',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZXJnenB3bWNxbW54aGl2emNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NzAxNTYsImV4cCI6MjEwMTQ0NjE1Nn0.a9VrMXc7vWpBYAYDYHcKornDAJ4VYkMaHD5lYYkhPaI"}'::jsonb,
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  return NEW;
end;
$$;

drop trigger if exists on_cancellation_request_insert on public.cancellation_requests;
create trigger on_cancellation_request_insert
after insert on public.cancellation_requests
for each row execute function public.notify_cancellation_request();
