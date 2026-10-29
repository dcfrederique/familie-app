-- Lopen, Analyse en Loopschema verhuizen naar Trackd, dat alles lokaal bijhoudt (29 oktober 2026).
drop trigger if exists loopsessie_schoen_controle on public.loopsessies;
drop function if exists public.loopsessie_schoen_controle();
drop table if exists public.loopschemas;
drop table if exists public.loopdoelen;
drop table if exists public.loopsessies;
drop table if exists public.loopschoenen;
