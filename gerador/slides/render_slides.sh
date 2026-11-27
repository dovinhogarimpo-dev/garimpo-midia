#!/usr/bin/env bash
# uso: bash gerador/slides/render_slides.sh <slides.json> posts/AAAAMMDD-feed
# Gera PNG com Deno e converte para JPG (qualidade 92). Instala o Deno via npm se faltar.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
DENO="$(command -v deno || true)"
if [ -z "$DENO" ]; then
  [ -x /tmp/denobin/node_modules/.bin/deno ] || (mkdir -p /tmp/denobin && npm i --silent --prefix /tmp/denobin deno >/dev/null)
  DENO=/tmp/denobin/node_modules/.bin/deno
fi
"$DENO" run -A "$DIR/render_slides.ts" "$1" "$2"
python3 - "$2" <<'PY'
import sys,glob,os
from PIL import Image
for p in sorted(glob.glob(os.path.join(sys.argv[1],'*.png'))):
    Image.open(p).convert('RGB').save(p[:-4]+'.jpg','JPEG',quality=92); os.remove(p)
print('ok', sorted(os.listdir(sys.argv[1])))
PY
