/**
 * Render the Yilow.ai SVG logos to PNG (1×, 2×, square, favicon).
 *
 * The trick with `sharp` rendering text-bearing SVGs: it ignores
 * @import font URLs — its libvips/Pango backend resolves fonts from
 * the system, not the network. So instead of relying on Google Fonts
 * we draw the wordmark with libvips' own typesetter using a font that
 * ships with most modern OSes ("Arial Black" on Windows, "DejaVu Sans"
 * on Linux, falling back to whatever is closest).
 *
 * This script intentionally rebuilds the SVGs in-memory with a SAFE
 * font stack so the PNG bake matches what designers see in browsers
 * that have Alexandria.
 */

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = "public/logo";
mkdirSync(OUT, { recursive: true });

const SAFE_FONT = "Arial Black, Helvetica Neue, sans-serif";

function wordmarkSVG({
  width, height, fontSize, baseline, primaryFill, accentFill, bg,
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${bg ? `<rect width="${width}" height="${height}" fill="${bg}"/>` : ""}
  <text x="${width / 2}" y="${baseline}"
        font-family="${SAFE_FONT}"
        font-weight="900"
        font-size="${fontSize}"
        letter-spacing="-${(fontSize * 0.045).toFixed(2)}"
        text-anchor="middle">
    <tspan fill="${primaryFill}">Yilow</tspan><tspan fill="${accentFill}">.ai</tspan>
  </text>
</svg>`;
}

function squareSVG({ size, bgGradFrom, bgGradTo, primaryFill, accentFill }) {
  const radius = Math.round(size * 0.176);
  const fontSize = Math.round(size * 0.195);
  const baseline = Math.round(size * 0.566);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${bgGradFrom}"/>
      <stop offset="100%" stop-color="${bgGradTo}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bg)"/>
  <rect x="6" y="6" width="${size - 12}" height="${size - 12}" rx="${radius - 6}" ry="${radius - 6}"
        fill="none" stroke="rgba(254,228,64,0.08)" stroke-width="2"/>
  <text x="${size / 2}" y="${baseline}"
        font-family="${SAFE_FONT}"
        font-weight="900"
        font-size="${fontSize}"
        letter-spacing="-${(fontSize * 0.045).toFixed(2)}"
        text-anchor="middle">
    <tspan fill="${primaryFill}">Yilow</tspan><tspan fill="${accentFill}">.ai</tspan>
  </text>
</svg>`;
}

function faviconSVG({ size, bg, primaryFill, accentFill }) {
  const radius = Math.round(size * 0.219);
  const fontSize = Math.round(size * 0.69);
  const baseline = Math.round(size * 0.72);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${bg}"/>
  <text x="${size / 2}" y="${baseline}"
        font-family="${SAFE_FONT}"
        font-weight="900"
        font-size="${fontSize}"
        letter-spacing="-${(fontSize * 0.06).toFixed(2)}"
        text-anchor="middle">
    <tspan fill="${primaryFill}">Y</tspan><tspan fill="${accentFill}">.</tspan>
  </text>
</svg>`;
}

async function render(svgString, file) {
  const buf = await sharp(Buffer.from(svgString)).png().toBuffer();
  const path = join(OUT, file);
  writeFileSync(path, buf);
  return path;
}

const tasks = [];

// ── Primary wordmark — transparent (dark-bg use) — 1200x320 @1x and 2400x640 @2x
tasks.push(["logo.png", wordmarkSVG({
  width: 1200, height: 320, fontSize: 240, baseline: 230,
  primaryFill: "#ffffff", accentFill: "#fee440", bg: null,
})]);
tasks.push(["logo@2x.png", wordmarkSVG({
  width: 2400, height: 640, fontSize: 480, baseline: 460,
  primaryFill: "#ffffff", accentFill: "#fee440", bg: null,
})]);

// ── Wordmark on dark — for share images, headers — 1200x320
tasks.push(["logo-on-dark.png", wordmarkSVG({
  width: 1200, height: 320, fontSize: 240, baseline: 230,
  primaryFill: "#ffffff", accentFill: "#fee440", bg: "#0a0a0f",
})]);

// ── Wordmark on light
tasks.push(["logo-on-light.png", wordmarkSVG({
  width: 1200, height: 320, fontSize: 240, baseline: 230,
  primaryFill: "#0a0a0f", accentFill: "#fee440", bg: "#ffffff",
})]);

// ── Square 1024 (app icon, OG image)
tasks.push(["logo-square.png", squareSVG({
  size: 1024, bgGradFrom: "#1a1a24", bgGradTo: "#0a0a0f",
  primaryFill: "#ffffff", accentFill: "#fee440",
})]);
tasks.push(["logo-square-512.png", squareSVG({
  size: 512, bgGradFrom: "#1a1a24", bgGradTo: "#0a0a0f",
  primaryFill: "#ffffff", accentFill: "#fee440",
})]);

// ── Favicon mark — Y. monogram, 64 / 32 / 16
tasks.push(["favicon-64.png", faviconSVG({
  size: 64, bg: "#0a0a0f", primaryFill: "#ffffff", accentFill: "#fee440",
})]);
tasks.push(["favicon-32.png", faviconSVG({
  size: 32, bg: "#0a0a0f", primaryFill: "#ffffff", accentFill: "#fee440",
})]);
tasks.push(["favicon-16.png", faviconSVG({
  size: 16, bg: "#0a0a0f", primaryFill: "#ffffff", accentFill: "#fee440",
})]);

for (const [file, svg] of tasks) {
  const out = await render(svg, file);
  console.log(`✓ ${out}`);
}

console.log(`\nDone — ${tasks.length} files written to ${OUT}/`);
