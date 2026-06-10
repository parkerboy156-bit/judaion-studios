// One-off generator for the Open Graph share image (1200x630).
// Run: node scripts/generate-og.mjs
// Produces public/og-image.png — the preview card shown when a JUDAION
// link is shared on LinkedIn, WhatsApp, X, iMessage, Slack, etc.
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Pull the brand wordmark out of the existing logo SVG (strip the XML decl).
const logo = readFileSync(join(root, "public/judaion-logo-white.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>/, "")
  .trim();

const W = 1200;
const H = 630;
const LOGO_W = 640; // logo viewBox is 986.58 x 322.15 (ratio ~3.06)
const LOGO_H = Math.round((LOGO_W * 322.15) / 986.58);
const logoX = (W - LOGO_W) / 2;
const logoY = 200;

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#0a0a0a"/>
  <svg x="${logoX}" y="${logoY}" width="${LOGO_W}" height="${LOGO_H}" viewBox="0 0 986.58 322.15">
    ${logo.replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}
  </svg>
  <text x="${W / 2}" y="${logoY + LOGO_H + 70}" fill="#ffffff"
        font-family="Arial, Helvetica, sans-serif" font-size="26"
        letter-spacing="6" text-anchor="middle" opacity="0.85">
    CREATIVE STRATEGIC PARTNER
  </text>
</svg>`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(join(root, "public/og-image.png"));

console.log("✓ Wrote public/og-image.png");
