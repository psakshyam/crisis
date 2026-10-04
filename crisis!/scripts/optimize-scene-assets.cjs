// Copies designer scene art (design/scene-art/) into public/assets/scenes/, shrinking oversized
// raster images embedded inside the SVGs (Figma exports embed full-resolution
// PNGs) by re-encoding them as downscaled WebP.
//
// Requires `cwebp` on PATH (macOS: `brew install webp`).
// Usage: node scripts/optimize-scene-assets.cjs

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "design/scene-art");
const OUT = path.join(ROOT, "public/assets/scenes");

// source file (in assets/) -> published path (in public/assets/scenes/)
const FILES = {
  "elena_neutral.svg": "characters/elena/neutral.svg",
  "elena_frown.svg": "characters/elena/frown.svg",
  "elena_worried.svg": "characters/elena/worried.svg",
  "elena_sidelook.svg": "characters/elena/sidelook.svg",
  "elena_smile.svg": "characters/elena/smile.svg",
  "elena_talking.svg": "characters/elena/talking.svg",
  "elena_standing.svg": "characters/elena/standing.svg",
  "angela_sitting.svg": "characters/angela/sitting.svg",
  "assistant_shadow.svg": "characters/assistant/shadow.svg",
  "kitchen_background.svg": "backgrounds/kitchen.svg",
  "laptop_with_sticker.svg": "props/laptop.svg",
  "laptop_interbank_chart.svg": "props/laptop_interbank_chart.svg",
  "paper_stack.svg": "props/paper_stack.svg",
  "questions_overlay.svg": "props/questions_overlay.svg",
  "solution_file.svg": "props/solution_file.svg",
  "central_bank.svg": "props/central_bank.svg",
};

// Crop the root viewBox where the art doesn't reach the canvas edges
// ([x, y, width, height] in the source SVG's coordinates).
const CROPS = {
  "kitchen_background.svg": [40, 0, 2059, 1385],
};

// Standalone raster backgrounds: source path (relative to repo root) -> published path
const RASTERS = {
  "design/scene-art/office_background.png": "backgrounds/office.webp",
};

const EMBED_MIN_BYTES = 120 * 1024; // leave small embeds alone
const EMBED_MAX_WIDTH = 1800; // plenty for a character drawn ~600px tall at 3x

function toWebp(inputPath, outputPath, maxWidth) {
  const args = ["-quiet", "-q", "82", "-alpha_q", "90"];
  if (maxWidth) args.push("-resize", String(maxWidth), "0");
  args.push(inputPath, "-o", outputPath);
  execFileSync("cwebp", args);
}

function pngWidth(buffer) {
  return buffer.readUInt32BE(16);
}

function optimizeSvg(svg) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scene-"));
  let count = 0;
  const result = svg.replace(
    /data:image\/png;base64,([A-Za-z0-9+/=]+)/g,
    (match, b64) => {
      const png = Buffer.from(b64, "base64");
      if (png.length < EMBED_MIN_BYTES) return match;
      const inFile = path.join(tmp, `${count}.png`);
      const outFile = path.join(tmp, `${count}.webp`);
      count += 1;
      fs.writeFileSync(inFile, png);
      const width = pngWidth(png);
      toWebp(inFile, outFile, width > EMBED_MAX_WIDTH ? EMBED_MAX_WIDTH : 0);
      const webp = fs.readFileSync(outFile);
      return webp.length < png.length
        ? `data:image/webp;base64,${webp.toString("base64")}`
        : match;
    },
  );
  fs.rmSync(tmp, { recursive: true, force: true });
  return result;
}

function cropSvg(svg, [x, y, width, height]) {
  return svg.replace(/<svg\b[^>]*>/, (tag) =>
    tag
      .replace(/\bwidth="[^"]*"/, `width="${width}"`)
      .replace(/\bheight="[^"]*"/, `height="${height}"`)
      .replace(/\bviewBox="[^"]*"/, `viewBox="${x} ${y} ${width} ${height}"`),
  );
}

function kb(bytes) {
  return `${Math.round(bytes / 1024)}K`;
}

for (const [src, dest] of Object.entries(FILES)) {
  const from = path.join(SRC, src);
  const to = path.join(OUT, dest);
  if (!fs.existsSync(from)) {
    console.warn(`skip (missing): ${src}`);
    continue;
  }
  const input = fs.readFileSync(from, "utf8");
  const cropped = CROPS[src] ? cropSvg(input, CROPS[src]) : input;
  const output = optimizeSvg(cropped);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, output);
  console.log(`${src} -> ${dest}  ${kb(input.length)} -> ${kb(output.length)}`);
}

for (const [src, dest] of Object.entries(RASTERS)) {
  const from = path.join(ROOT, src);
  const to = path.join(OUT, dest);
  if (!fs.existsSync(from)) {
    console.warn(`skip (missing): ${src}`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  toWebp(from, to, 1920);
  console.log(
    `${src} -> ${dest}  ${kb(fs.statSync(from).size)} -> ${kb(fs.statSync(to).size)}`,
  );
}
