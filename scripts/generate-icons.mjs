/**
 * Generate PWA icons as SVG-based PNG placeholders.
 * Run: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Create SVG icon
function createIconSvg(size) {
  const borderRadius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.5);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0D9488"/>
      <stop offset="100%" style="stop-color:#115E59"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${borderRadius}" fill="url(#bg)"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Inter,Arial,sans-serif" font-weight="700" font-size="${fontSize}">$</text>
</svg>`;
}

// Write SVG icons (browsers support SVG for PWA icons)
for (const size of [192, 512]) {
  const svg = createIconSvg(size);
  writeFileSync(join(publicDir, `icon-${size}.svg`), svg);
  console.log(`Created icon-${size}.svg`);
}

// Also create a basic favicon.svg
const faviconSvg = createIconSvg(32);
writeFileSync(join(publicDir, "favicon.svg"), faviconSvg);
console.log("Created favicon.svg");
