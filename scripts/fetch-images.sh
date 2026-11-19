#!/usr/bin/env bash
# Downloads placeholder imagery from the current skinrockofficial.com site and
# resizes it to <=2000px. Placeholder only: new photography is needed for launch.
# Requires curl and python3 with Pillow.
set -euo pipefail
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/images"
TMP="$(mktemp -d)"
G=https://skinrockofficial.com/wp-content/uploads/2026/07/skinrock-stone-veneer
P6=https://skinrockofficial.com/wp-content/uploads/2026/06
P7=https://skinrockofficial.com/wp-content/uploads/2026/07
mkdir -p "$OUT"
while read -r name url; do
  curl -sfL --retry 5 --retry-all-errors --retry-delay 3 "$url" -o "$TMP/$name"
done <<LIST
alps-slate.jpg $G-indoor-walls-25-scaled.jpeg
onyx-column.jpg $G-indoor-walls-translucent-2-scaled.jpeg
lit-table.jpg $G-indoor-furniture-translucent-14.jpg
dark-bath.jpg $G-indoor-bathroom-walls-19-scaled.jpg
stair-hall.jpg $G-indoor-walls-21-scaled.jpeg
copper-wall.jpg $G-indoor-walls-20-scaled.jpeg
facade-corner.jpg $G-outdoor-facades-8-scaled.jpeg
sauna.jpg $G-indoor-walls-14.jpeg
street-wall.jpg $G-outdoor-walls-13-scaled.jpg
lobby.jpg $G-indoor-walls-translucent-3-rotated.jpeg
kitchen-island.jpg $G-indoor-kitchen-11-scaled.jpeg
backlit-bath.jpg $G-indoor-bathroom-walls-translucent.jpeg
chalet-kitchen.jpg $G-indor-walls-3.jpeg
bedroom.jpg $G-indoor-walls-10.jpg
fireplace.jpg $G-indoor-fireplaces-6.jpeg
slate-sample.jpg $P6/SWISS-VALLEY-GREY-1.jpg
quartzite-sample.jpg $P6/Artic-Storm-2.jpg
marble-sample.jpg https://skinrockofficial.com/wp-content/uploads/2026/06/Atlantic-White-1-1.jpeg
acoustic-sample.jpg $P6/Acoustic-Panel-1.jpg
LIST
python3 - "$TMP" "$OUT" <<'PY'
import sys, os
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
for f in sorted(os.listdir(src)):
    im = Image.open(os.path.join(src, f)).convert("RGB")
    im.thumbnail((2000, 2000))
    im.save(os.path.join(out, f), quality=82, optimize=True, progressive=True)
    print(f, im.size)
# a cropped close-up of the copper slate wall for the bending sheet texture
im = Image.open(os.path.join(src, "copper-wall.jpg")).convert("RGB")
w, h = im.size
crop = im.crop((int(w*0.47), int(h*0.14), int(w*0.99), int(h*0.56)))
crop.thumbnail((1600, 1600)); crop.save(os.path.join(out, "slate-closeup.jpg"), quality=84, optimize=True)
print("slate-closeup.jpg", crop.size)
PY
rm -rf "$TMP"
