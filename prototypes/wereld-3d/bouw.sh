#!/bin/sh
# Bundelt de proef met three.js tot één html-bestand: sh bouw.sh <map met node_modules/three> <uitvoer.html>
set -e
cd "$(dirname "$0")"
npx esbuild main.js --bundle --minify --format=iife --outfile=/tmp/wereld3d.js --log-level=error
cat kop.html /tmp/wereld3d.js > "$1"
echo '</script>' >> "$1"
