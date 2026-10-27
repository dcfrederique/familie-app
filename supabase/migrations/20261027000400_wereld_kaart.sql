-- De kaart van de wereld (docs/wereld-dorp.md): wat de ouders verplaatsten, wisten of erbij zetten, per gezin.
-- Alleen de verschillen met de standaardplekken in de code worden bewaard ({ v, plek, nieuw }), zodat wat de nachtroutine
-- toevoegt vanzelf verschijnt. Een ouder bewerkt de kaart bij Wij → Kaart bewerken (policy "ouder past gezin aan");
-- de tablets lezen ze mee.
alter table public.gezinnen add column wereld_kaart jsonb not null default '{}'::jsonb;
alter table public.gezinnen add constraint wereld_kaart_vorm
  check (jsonb_typeof(wereld_kaart) = 'object' and pg_column_size(wereld_kaart) < 200000);
grant update (wereld_kaart) on public.gezinnen to authenticated;
