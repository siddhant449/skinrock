// Pre-encodes every photo in public/images to WebP at every width next/image can ask for,
// so the site never waits on the on-demand optimizer (1 to 2.5 s per size on a cold cache,
// and the cache starts cold after every deploy). Runs before `dev` and `build`.
//
// Output: public/_img/<name>-<hash>-<width>.webp (git-ignored, content-hashed so it can be
// cached for a year) and lib/image-manifest.json (committed: name -> hash + widths).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = join(ROOT, "public/images");
const OUT = join(ROOT, "public/_img");
const MANIFEST = join(ROOT, "lib/image-manifest.json");
// next.config images.imageSizes + deviceSizes (the defaults)
const WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const QUALITY = 78;

mkdirSync(OUT, { recursive: true });
const manifest = {};
let encoded = 0;

for (const file of readdirSync(SRC).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()) {
  const name = file.replace(/\.[^.]+$/, "");
  const input = readFileSync(join(SRC, file));
  const hash = createHash("sha256").update(input).update(String(QUALITY)).digest("hex").slice(0, 8);
  const { width: full } = await sharp(input).metadata();
  // every requested width up to the source; one file at the source width covers the rest
  const widths = [...new Set(WIDTHS.map((w) => Math.min(w, full)))].sort((a, b) => a - b);
  for (const w of widths) {
    const out = join(OUT, `${name}-${hash}-${w}.webp`);
    if (existsSync(out)) continue;
    await sharp(input).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY, effort: 5 }).toFile(out);
    encoded++;
  }
  manifest[name] = { hash, widths };
}

const json = JSON.stringify(manifest, null, 1) + "\n";
if (!existsSync(MANIFEST) || readFileSync(MANIFEST, "utf8") !== json) writeFileSync(MANIFEST, json);
console.log(`images: ${Object.keys(manifest).length} photos, ${encoded} sizes encoded`);
