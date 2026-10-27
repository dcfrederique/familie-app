-- Wereldinstellingen (2.5D, docs/wereld-25d.md): plat of schuin, camerahoek, diepte, schaduw en loopsnelheid voor het hele gezin.
-- Een ouder past ze aan bij Instellingen → Wereldinstellingen (policy "ouder past gezin aan"); de tablets lezen ze mee.
alter table public.gezinnen add column wereld_instellingen jsonb not null default '{}'::jsonb;
grant update (wereld_instellingen) on public.gezinnen to authenticated;
