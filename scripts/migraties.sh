#!/usr/bin/env bash
# Voert de nieuwe migraties uit op de Supabase-database (CI op main, na groene tests; docs/supabase.md).
# Wat al gedraaid heeft staat in supabase_migrations.schema_migrations, dezelfde tabel als de Supabase CLI.
# De eerste keer is die tabel leeg (alles ging met de hand in de SQL Editor): dan zoekt het script de
# nieuwste migratie die al in de database zit en telt die en alle oudere als uitgevoerd.
# Gebruik: SUPABASE_DB_URL=postgres://... scripts/migraties.sh
set -euo pipefail
cd "$(dirname "$0")/.."

db="${SUPABASE_DB_URL:?SUPABASE_DB_URL ontbreekt}"
sql() { psql "$db" -X -q -v ON_ERROR_STOP=1 "$@"; }
versie() { basename "$1" | cut -d_ -f1; }
naam() { local b; b=$(basename "$1" .sql); echo "${b#*_}"; }
markeer() {
  sql -c "insert into supabase_migrations.schema_migrations (version, name) values ('$(versie "$1")', '$(naam "$1")') on conflict do nothing"
}

mapfile -t bestanden < <(ls "$PWD"/supabase/migrations/*.sql | sort)

sql -c "create schema if not exists supabase_migrations" \
    -c "create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text)"

# Een lege database (zonder gezinnen) krijgt gewoon alle migraties.
if [ "$(sql -tAc 'select count(*) from supabase_migrations.schema_migrations')" = 0 ] \
   && [ "$(sql -tAc "select to_regclass('public.gezinnen') is not null")" = t ]; then
  echo "Eerste keer: nagaan welke migraties al met de hand gedraaid hebben."
  for ((i = ${#bestanden[@]} - 1; i >= 0; i--)); do
    f=${bestanden[$i]}
    # Proefdraaien in een transactie die altijd teruggedraaid wordt.
    if uit=$(printf 'begin;\n\\i %s\nrollback;\n' "$f" | psql "$db" -X -q -v ON_ERROR_STOP=1 -v VERBOSITY=verbose 2>&1); then
      continue
    fi
    # 42P07 tabel, 42701 kolom, 42723 functie, 42710 object, 42P06 schema bestaat al.
    if grep -qE '(42P07|42701|42723|42710|42P06)' <<< "$uit"; then
      echo "Al gedraaid tot en met $(basename "$f")."
      for ((j = 0; j <= i; j++)); do markeer "${bestanden[$j]}"; done
      break
    fi
    echo "$uit" >&2
    echo "::error::Proefdraaien van $(basename "$f") mislukt om een andere reden dan 'bestaat al'." >&2
    exit 1
  done
fi

nieuw=0
for f in "${bestanden[@]}"; do
  v=$(versie "$f")
  [ "$(sql -tAc "select count(*) from supabase_migrations.schema_migrations where version = '$v'")" = 1 ] && continue
  echo "Uitvoeren: $(basename "$f")"
  # Migratie en registratie samen in één transactie: lukt het niet, dan verandert er niets.
  { cat "$f"; printf '\ninsert into supabase_migrations.schema_migrations (version, name) values (%s, %s);\n' "'$v'" "'$(naam "$f")'"; } | sql -1
  nieuw=$((nieuw + 1))
done
echo "Klaar: $nieuw nieuwe migratie(s) uitgevoerd."
