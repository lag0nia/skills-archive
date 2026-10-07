import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { buildReviewSlideshow } from "../../scripts/build-review-slideshow.mjs";

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

// A real, decodable RGB PNG of one colour; stands in for a captured screenshot.
export function png(width = 320, height = 200, [red, green, blue] = [32, 96, 192]) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) row.set([red, green, blue], 1 + x * 3);
  const pixels = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header), chunk("IDAT", zlib.deflateSync(pixels)), chunk("IEND", Buffer.alloc(0)),
  ]);
}

export const pngDataUrl = (...args) => "data:image/png;base64," + png(...args).toString("base64");

// Writes a populated deck through the helper, keeping inputs outside ui-ux/.
export function writeDeck(candidateRoot, { slides = 2, manifest = {} } = {}) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "software-design-slides-input-"));
  try {
    const entries = Array.from({ length: slides }, (_, index) => {
      fs.writeFileSync(path.join(work, `shot-${index + 1}.png`), png(320 + index * 8, 200));
      return { image: `shot-${index + 1}.png`, viewport: "desktop", role: "Customer", part: "journey", alt: `Captured view ${index + 1} of the candidate`, caption: `Customer · Step ${index + 1} · 1280 px desktop` };
    });
    const manifestPath = path.join(work, "slides.json");
    fs.writeFileSync(manifestPath, JSON.stringify({
      title: "Main candidate",
      captured: "2026-09-26",
      coverage: "Arrival, decision, and outcome for the representative flow",
      omissions: "Operator views were not captured",
      slides: entries,
      ...manifest,
    }));
    return buildReviewSlideshow({ manifestPath, outputPath: path.join(candidateRoot, "slides.html") });
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}
