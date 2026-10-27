#!/bin/sh
# Bundelt het stijlenproefje met de echte figuurtjesdata: sh bouw.sh <uitvoer.html> (vanuit de repo, node_modules aanwezig)
set -e
cd "$(dirname "$0")"
npx esbuild fig.ts --bundle --minify --format=iife --outfile=/tmp/stijlen-fig.js --log-level=error
cat kop.html /tmp/stijlen-fig.js > "$1"
printf '\n' >> "$1"
cat main.js >> "$1"
echo '</script></body></html>' >> "$1"
