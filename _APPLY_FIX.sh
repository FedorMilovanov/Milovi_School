#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f package.json || ! -d src || ! -f astro.config.mjs ]]; then
  echo "Run this script from the Milovi_School repository root." >&2
  exit 1
fi

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if [[ -e "$f" ]]; then
    rm -rf "$f"
    echo "deleted: $f"
  else
    echo "already absent: $f"
  fi
done < _DELETE_FILES.txt

if [[ ! -f public/images/logo-maskable.png ]]; then
  echo "ERROR: public/images/logo-maskable.png is missing. Unzip the replacement pack into repo root first." >&2
  exit 1
fi

if [[ "$(cat .nvmrc 2>/dev/null | tr -d '[:space:]')" != "22.13.0" ]]; then
  echo "ERROR: .nvmrc must be 22.13.0" >&2
  exit 1
fi

echo
echo "Replacement applied. Recommended verification under Node 22.13.0:"
echo "  npm ci"
echo "  npm run check"
echo "  npm run lint"
echo "  npm run audit:content"
echo "  npm run audit:security"
echo "  npm run build"
echo "  npm run audit:site"
