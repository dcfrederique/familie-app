#!/usr/bin/env bash
# Draait de Supabase-migraties en de sterrentests op een lege Postgres-database.
# Gebruik: DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."

basis="${DATABASE_URL:-postgres://postgres@localhost:5432/postgres}"
psql "$basis" -q -c 'drop database if exists familie_test' -c 'create database familie_test'
db="${basis%/*}/familie_test"

psql "$db" -q -v ON_ERROR_STOP=1 -f supabase/tests/opzet.sql
for m in supabase/migrations/*.sql; do
  psql "$db" -q -v ON_ERROR_STOP=1 -f "$m"
done
psql "$db" -v ON_ERROR_STOP=1 -f supabase/tests/sterren.test.sql
