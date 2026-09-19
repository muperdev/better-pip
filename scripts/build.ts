import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { watch } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const DIST = "dist";

async function build(): Promise<void> {
  await mkdir(join(DIST, "icons"), { recursive: true });

  const result = await Bun.build({
    entrypoints: [
      "src/background.ts",
      "src/content-main.ts",
      "src/content-bridge.ts",
      "src/popup/popup.ts",
    ],
    outdir: DIST,
    naming: "[name].js",
    target: "browser",
    format: "iife",
    minify: false,
    sourcemap: "none",
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    throw new Error("Build failed");
  }

  await copyFile("src/manifest.json", join(DIST, "manifest.json"));
  await copyFile("src/content.css", join(DIST, "content.css"));
  await copyFile("src/popup/popup.html", join(DIST, "popup.html"));
  await copyFile("src/popup/popup.css", join(DIST, "popup.css"));
  await writeIcons();
  console.log("Built dist/");
}

async function writeIcons(): Promise<void> {
  for (const size of [16, 48, 128] as const) {
    await writeFile(join(DIST, "icons", `icon-${size}.png`), pngIcon(size));
  }
}

function pngIcon(size: number): Buffer {
  const pixels = new Uint8Array(size * size * 4);
  const scale = size / 128;

  fillRoundRect(pixels, size, 8 * scale, 8 * scale, 112 * scale, 112 * scale, 28 * scale, [20, 20, 23, 255]);
  fillRoundRect(pixels, size, 22 * scale, 34 * scale, 54 * scale, 40 * scale, 8 * scale, [58, 58, 64, 255]);
  fillRoundRect(pixels, size, 48 * scale, 50 * scale, 62 * scale, 46 * scale, 10 * scale, [246, 246, 247, 255]);
  fillRect(pixels, size, 54 * scale, 86 * scale, 50 * scale, 5 * scale, [255, 77, 98, 255]);

  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    rows[rowStart] = 0;
    rows.set(pixels.subarray(y * size * 4, (y + 1) * size * 4), rowStart + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function fillRect(
  pixels: Uint8Array,
  size: number,
  x: number,
  y: number,
  width: number,
  height: number,
  color: readonly [number, number, number, number],
): void {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const x1 = Math.round(x + width);
  const y1 = Math.round(y + height);

  for (let py = y0; py < y1; py += 1) {
    for (let px = x0; px < x1; px += 1) {
      setPixel(pixels, size, px, py, color);
    }
  }
}

function fillRoundRect(
  pixels: Uint8Array,
  size: number,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: readonly [number, number, number, number],
): void {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const x1 = Math.round(x + width);
  const y1 = Math.round(y + height);
  const r = Math.round(radius);

  for (let py = y0; py < y1; py += 1) {
    for (let px = x0; px < x1; px += 1) {
      if (inRoundRect(px, py, x0, y0, x1 - 1, y1 - 1, r)) {
        setPixel(pixels, size, px, py, color);
      }
    }
  }
}

function inRoundRect(
  px: number,
  py: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  radius: number,
): boolean {
  const cx =
    px < left + radius ? left + radius : px > right - radius ? right - radius : px;
  const cy =
    py < top + radius ? top + radius : py > bottom - radius ? bottom - radius : py;

  if (cx === px || cy === py) {
    return true;
  }

  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function setPixel(
  pixels: Uint8Array,
  size: number,
  x: number,
  y: number,
  color: readonly [number, number, number, number],
): void {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }

  const index = (y * size + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

await build();

if (process.argv.includes("--watch")) {
  watch("src", { recursive: true }, () => {
    void build();
  });
}
