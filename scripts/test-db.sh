#!/usr/bin/env bash
# Draait de Supabase-migraties en de sterrentests op een lege Postgres-database.
# Gebruik: DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."

basis="${DATABASE_URL:-postgres://postgres@localhost:5432/postgres}"
psql "$basis" -q -c 'drop database if exists familie_test' -c 'create database familie_test'
db="${basis%/*}/familie_test"

psql "$db" -q -v ON_ERROR_STOP=1 -f supabase/tests/opzet.sql
# Elke migratie wordt ook geregistreerd zoals scripts/migraties.sh het doet, zodat dat script daarna niets opnieuw draait.
# (Zonder registratie moet het raden wat al gedraaid heeft, en een migratie die je veilig twee keer kunt draaien,
# zoals een nieuw kinderthema, lijkt dan nieuw.)
psql "$db" -q -v ON_ERROR_STOP=1 -c "create schema if not exists supabase_migrations" \
  -c "create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text)"
for m in supabase/migrations/*.sql; do
  psql "$db" -q -v ON_ERROR_STOP=1 -f "$m"
  b=$(basename "$m" .sql)
  psql "$db" -q -v ON_ERROR_STOP=1 -c "insert into supabase_migrations.schema_migrations (version, name) values ('${b%%_*}', '${b#*_}')"
done
for t in supabase/tests/*.test.sql; do
  psql "$db" -v ON_ERROR_STOP=1 -f "$t"
done
