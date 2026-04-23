import { readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = process.env.PORTRAIT_SRC || '/Users/innei/Downloads/fwti';
const OUT = join(__dirname, '..', 'src', 'assets', 'portraits');
const SIZE = 800;
const QUALITY = 80;

// 匹配 3–5 位大写码前缀（如 CMD、VOID、E-DOG），可选 `_suffix`，.png/.jpg/.jpeg
const CODE_RE = /^([A-Z][A-Z0-9-]{2,4})(?:_.*)?\.(jpe?g|png)$/i;

await mkdir(OUT, { recursive: true });

const raw = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
// 优先级：.png > .jpg（v3 新图覆盖 v2 旧 jpg，同扩展名内按字典序）
const files = raw.sort((a, b) => {
  const ap = /\.png$/i.test(a) ? 0 : 1;
  const bp = /\.png$/i.test(b) ? 0 : 1;
  return ap !== bp ? ap - bp : a.localeCompare(b);
});
let ok = 0;
// 同码多源时仅取第一份；anchor 副本不覆盖主图
const seen = new Set();
for (const f of files) {
  const m = f.match(CODE_RE);
  if (!m) {
    console.warn(`skip (no code prefix): ${f}`);
    continue;
  }
  const code = m[1].toUpperCase();
  if (seen.has(code)) {
    console.log(`skip (dup): ${f} (already processed ${code})`);
    continue;
  }
  seen.add(code);
  const outPath = join(OUT, `${code}.webp`);
  await sharp(join(SRC, f))
    .resize(SIZE, SIZE, { fit: 'cover' })
    .webp({ quality: QUALITY })
    .toFile(outPath);
  ok++;
  console.log(`${f} -> ${code}.webp`);
}
console.log(`done: ${ok} files written`);
