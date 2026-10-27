#!/bin/sh
# Bundelt de 2.5D-proef met het echte chibi-figuurtje: sh bouw.sh <uitvoer.html> (vanuit de repo; npx haalt esbuild)
set -e
cd "$(dirname "$0")"
npx --yes esbuild fig.ts --bundle --minify --format=iife --outfile=/tmp/w25d-fig.js --log-level=error
cat kop.html > "$1"
echo '<script>' >> "$1"
cat /tmp/w25d-fig.js >> "$1"
printf '\n' >> "$1"
cat main.js >> "$1"
echo '</script>' >> "$1"
echo "klaar: $1"
