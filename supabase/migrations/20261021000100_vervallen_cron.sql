-- Elke 5 minuten verzoeken laten vervallen die niet behandeld zijn (sterren komen dan vanzelf vrij).
-- pg_cron bestaat op Supabase; lokaal (tests) wordt deze stap overgeslagen.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('verzoeken-laten-vervallen', '*/5 * * * *', 'select public.verzoeken_laten_vervallen()');
  end if;
end $$;
