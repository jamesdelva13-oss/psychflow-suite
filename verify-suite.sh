#!/usr/bin/env bash
set -uo pipefail
MAN="MANIFEST.sha256"
[ -f "$MAN" ] || { echo "Run from repo root (MANIFEST.sha256 missing)."; exit 1; }
fail=0; miss=0; ok=0
while IFS= read -r line; do
  exp="${line%% *}"; path="${line#*  }"
  if [ ! -f "$path" ]; then echo "MISSING  $path"; miss=$((miss+1)); continue; fi
  got="$(shasum -a 256 "$path" | awk '{print $1}')"
  if [ "$got" = "$exp" ]; then ok=$((ok+1)); else echo "MISMATCH $path"; fail=$((fail+1)); fi
done < "$MAN"
echo "-----"; echo "ok=$ok mismatch=$fail missing=$miss"
{ [ "$fail" -eq 0 ] && [ "$miss" -eq 0 ] && echo "ALL FILES VERIFIED \u2713"; } || { echo "NOT VERIFIED \u2717"; exit 1; }
