-- Weekmenu (docs/weekmenu.md): de ouders vullen per dag de warme maaltijd in, de kinderen zien op hun
-- startscherm wat er vanavond op tafel komt. Iedereen van het gezin leest, alleen een ouder-account schrijft.

create table public.weekmenu (
  gezin_id uuid not null references public.gezinnen (id) on delete cascade,
  dag date not null,
  gerecht text not null check (length(btrim(gerecht)) between 1 and 80),
  -- Sleutel van een prentje uit src/data/maaltijdPrenten.tsx; null = de app raadt het uit het gerecht.
  prentje text check (prentje ~ '^[a-z]{1,20}$'),
  gewijzigd_op timestamptz not null default now(),
  primary key (gezin_id, dag)
);

alter table public.weekmenu enable row level security;

create policy "eigen gezin lezen" on public.weekmenu for select to authenticated using (gezin_id = public.mijn_gezin());
create policy "ouder beheert weekmenu" on public.weekmenu for all to authenticated
  using (gezin_id = public.mijn_gezin() and public.is_ouder_account())
  with check (gezin_id = public.mijn_gezin() and public.is_ouder_account());

grant select, insert, update, delete on public.weekmenu to authenticated;
