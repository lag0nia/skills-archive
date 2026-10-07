// Structural plausibility for embedded review screenshots. Decoding the header,
// dimensions, and end marker rejects placeholders, truncated payloads, and
// non-raster images; it cannot prove that a capture is authentic or current.

export const SCREENSHOT_MIME_TYPES = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };
export const MIN_SCREENSHOT_SIDE = 64;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngInfo(bytes) {
  if (bytes.length < 45 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE) || bytes.toString("latin1", 12, 16) !== "IHDR") return null;
  const complete = bytes.toString("latin1", bytes.length - 8, bytes.length - 4) === "IEND";
  return { type: "png", width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), complete };
}

function jpegInfo(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    if (marker === 0xff) { offset++; continue; }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
    // Start-of-frame markers carry the dimensions; DHT, JPG, and DAC share the range.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      const complete = bytes.lastIndexOf(Buffer.from([0xff, 0xd9])) > offset;
      return { type: "jpeg", width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5), complete };
    }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  return null;
}

function webpInfo(bytes) {
  if (bytes.length < 30 || bytes.toString("latin1", 0, 4) !== "RIFF" || bytes.toString("latin1", 8, 12) !== "WEBP") return null;
  const complete = bytes.readUInt32LE(4) + 8 <= bytes.length;
  const chunk = bytes.toString("latin1", 12, 16);
  if (chunk === "VP8X") return { type: "webp", width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3), complete };
  if (chunk === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return { type: "webp", width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff, complete };
  }
  if (chunk === "VP8L" && bytes[20] === 0x2f) {
    const width = 1 + (bytes[21] | ((bytes[22] & 0x3f) << 8));
    const height = 1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10));
    return { type: "webp", width, height, complete };
  }
  return null;
}

export function screenshotImageInfo(bytes) {
  return pngInfo(bytes) || jpegInfo(bytes) || webpInfo(bytes);
}

// Returns the problem with a candidate screenshot, or null when it is a complete
// PNG, JPEG, or WebP of at least MIN_SCREENSHOT_SIDE pixels on each side.
export function screenshotProblem(bytes, declaredMime = null) {
  const info = screenshotImageInfo(bytes);
  if (!info) return "is not a decodable PNG, JPEG, or WebP screenshot";
  if (declaredMime && declaredMime.toLowerCase().replace("image/jpg", "image/jpeg") !== SCREENSHOT_MIME_TYPES[info.type]) return "declares " + declaredMime + " but contains " + SCREENSHOT_MIME_TYPES[info.type];
  if (!info.complete) return "is truncated";
  if (info.width < MIN_SCREENSHOT_SIDE || info.height < MIN_SCREENSHOT_SIDE) return "is " + info.width + "×" + info.height + " px, too small to be a readable screenshot";
  return null;
}

// Parses one embedded data URL. Only base64 raster screenshots qualify.
export function embeddedScreenshotProblem(url) {
  const match = /^data:(image\/[\w.+-]+);base64,([\s\S]*)$/i.exec(url.trim());
  if (!match) return "must be a base64 data:image/png, image/jpeg, or image/webp URL";
  const payload = match[2].replace(/\s+/g, "");
  if (!payload || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) return "does not contain a valid base64 payload";
  return screenshotProblem(Buffer.from(payload, "base64"), match[1]);
}
