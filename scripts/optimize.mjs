// Image optimizer — re-encodes an image (or every image in a folder) the same
// way assets get optimized by hand: optional downscale + tight per-format
// compression, alpha preserved. Can also CONVERT format (e.g. a huge PNG
// export into a small WebP), deleting the original after a successful convert.
// Same-format runs overwrite in place and only if the result is smaller; a
// temp file is written first so a failure never corrupts the original.
//
// Usage:
//   npm run optimize -- <fileOrFolder> [maxWidth] [quality] [--to <format>]
//   node scripts/optimize.mjs <fileOrFolder> [maxWidth] [quality] [--to <format>]
//
// Examples:
//   npm run optimize -- public/archive-wallpapers/2.avif           (recompress in place)
//   npm run optimize -- public/archive-wallpapers 2560 50          (whole folder: cap width 2560, q50)
//   npm run optimize -- public/folder-icon.png 720 --to webp       (PNG → 720px WebP, deletes the PNG)
//   npm run optimize -- public/archive-wallpapers --to avif        (convert a folder of images to AVIF)
//
// maxWidth  — downscale so width is at most this (never upscales). Omit to keep size.
// quality   — encode quality of the OUTPUT. Omit for a per-format default.
// --to fmt  — output format: avif | webp | png | jpg. Omit to keep the source format.

import sharp from "sharp";
import { statSync, readdirSync, renameSync, rmSync } from "node:fs";
import { extname, join, basename, dirname, resolve } from "node:path";

const IMAGE_EXTS = new Set([".avif", ".webp", ".png", ".jpg", ".jpeg"]);
const DEFAULT_QUALITY = { ".avif": 50, ".webp": 82, ".jpg": 80, ".jpeg": 80 };

// Split flags (--to fmt) from positional args.
const raw = process.argv.slice(2);
const positional = [];
let toFormat = null;
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === "--to") {
    toFormat = (raw[++i] || "").toLowerCase().replace(/^\./, "");
    if (toFormat === "jpeg") toFormat = "jpg";
  } else {
    positional.push(raw[i]);
  }
}
const [target, maxWidthArg, qualityArg] = positional;

if (!target) {
  console.error(
    "Usage: node scripts/optimize.mjs <fileOrFolder> [maxWidth] [quality] [--to <format>]",
  );
  process.exit(1);
}
if (toFormat && !["avif", "webp", "png", "jpg"].includes(toFormat)) {
  console.error(`--to must be one of: avif, webp, png, jpg (got "${toFormat}")`);
  process.exit(1);
}
const maxWidth = maxWidthArg ? parseInt(maxWidthArg, 10) : null;
const quality = qualityArg ? parseInt(qualityArg, 10) : null;

const kb = (n) => `${Math.round(n / 1024)} KB`;

function encode(pipe, ext, q) {
  if (ext === ".avif") return pipe.avif({ quality: q, effort: 6 });
  if (ext === ".webp") return pipe.webp({ quality: q, effort: 6 });
  if (ext === ".png") return pipe.png({ compressionLevel: 9, effort: 10 });
  return pipe.jpeg({ quality: q, mozjpeg: true });
}

async function optimizeFile(file) {
  const srcExt = extname(file).toLowerCase();
  if (!IMAGE_EXTS.has(srcExt)) return;

  // Already in the requested format — nothing to convert, so leave it alone.
  // Without this, `--to avif` over a folder RE-ENCODES every existing .avif
  // (same-format path, replaced whenever the result is a few bytes smaller),
  // quietly losing a little quality on each run. `--to` means "convert"; use a
  // same-format run without `--to` when you actually want to recompress.
  if (toFormat && srcExt === `.${toFormat}`) {
    console.log(`· ${file}  already ${toFormat}, skipped`);
    return;
  }

  const outExt = toFormat ? `.${toFormat}` : srcExt;
  const outPath = join(dirname(file), basename(file, srcExt) + outExt);
  // Compare RESOLVED absolute paths — a raw string compare breaks on Windows
  // where path.join yields "\" but the CLI arg uses "/", which would make a
  // same-format run look like a conversion and delete the original file.
  const converting = resolve(outPath) !== resolve(file);

  const beforeBytes = statSync(file).size;
  const tmp = join(dirname(file), `.opt-${basename(outPath)}`);
  const q = quality ?? DEFAULT_QUALITY[outExt] ?? 80;

  let pipe = sharp(file);
  if (maxWidth) pipe = pipe.resize({ width: maxWidth, withoutEnlargement: true });
  const info = await encode(pipe, outExt, q).toFile(tmp);

  if (converting) {
    // Format changed: write the new file and remove the original source.
    renameSync(tmp, outPath);
    rmSync(file);
    console.log(
      `✓ ${file} → ${outPath}  ${info.width}x${info.height}  ${kb(beforeBytes)} → ${kb(info.size)}`,
    );
  } else if (info.size < beforeBytes) {
    // Same format: replace only if we actually saved bytes.
    renameSync(tmp, file);
    console.log(
      `✓ ${file}  ${info.width}x${info.height}  ${kb(beforeBytes)} → ${kb(info.size)}`,
    );
  } else {
    rmSync(tmp);
    console.log(`· ${file}  already optimal (${kb(beforeBytes)}), left as-is`);
  }
}

const stat = statSync(target);
const files = stat.isDirectory()
  ? readdirSync(target)
      .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
      .map((f) => join(target, f))
  : [target];

if (files.length === 0) {
  console.log("No images found to optimize.");
} else {
  for (const f of files) await optimizeFile(f);
}
