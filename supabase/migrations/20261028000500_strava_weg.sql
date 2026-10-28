-- De Strava-koppeling is geschrapt (een API-app vraagt een Strava-abonnement, dat het gezin niet heeft).
-- Opruimen van wat migratie 20261028000400 aanmaakte, als die al draaide.
drop function if exists public.strava_status();
drop table if exists public.strava_koppelingen;
