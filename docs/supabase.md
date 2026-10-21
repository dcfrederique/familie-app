# Supabase opzetten

Project: `https://oyqwhrttwaatqymjomtc.supabase.co`

## Database aanmaken

Voer in de Supabase-console, **SQL Editor**, de bestanden in `supabase/migrations/` uit, in volgorde van naam.
Of met de Supabase CLI: `supabase link --project-ref oyqwhrttwaatqymjomtc` en daarna `supabase db push`.

## Gezin en accounts

1. Maak onder **Authentication > Users** drie gebruikers aan: een voor elke ouder-gsm en een gedeelde voor de tablets.
2. Vul het gezin, de profielen en de accounts in via de SQL Editor (vervang de user-id's):

```sql
with g as (insert into gezinnen (naam) values ('De Clercq - De Smet') returning id),
p as (
  insert into gebruikers (gezin_id, naam, rol, kan_lezen, vraagt_zelf_tijd, volgorde)
  select g.id, v.naam, v.rol::rol, v.lezen, v.zelf, v.nr from g, (values
    ('Mama', 'ouder', true, true, 1), ('Papa', 'ouder', true, true, 2),
    ('Luca', 'kind', true, true, 3), ('Yuna', 'kind', true, true, 4), ('Feline', 'kind', false, false, 5)
  ) as v(naam, rol, lezen, zelf, nr)
  returning id, naam, gezin_id
)
insert into accounts (user_id, gezin_id, soort, ouder_id)
select v.user_id::uuid, p.gezin_id, v.soort, case when v.soort = 'ouder' then p.id end
from p join (values
  ('<user-id gsm mama>', 'ouder', 'Mama'),
  ('<user-id gsm papa>', 'ouder', 'Papa'),
  ('<user-id tablets>', 'tablet', 'Luca')
) as v(user_id, soort, naam) on v.naam = p.naam;
```

Elke ouder stelt daarna in de app een pincode in (nodig voor ouder-acties op de tablet).

## Regels

Alle sterrenregels zitten in Postgres-functies in de migratie: indienen, goedkeuren, reserveren, toekennen,
terugboeken, vervallen (elke 5 minuten via pg_cron), dagplafond, tijdvenster en spaarmaximum.
Tests: `scripts/test-db.sh` (lokale Postgres 16 nodig) of de CI-job `database`.
