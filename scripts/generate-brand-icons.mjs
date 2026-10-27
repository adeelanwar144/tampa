import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const BG = [0x0b, 0x5e, 0x6b, 255];
const FG = [255, 255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function draw(size) {
  const pixels = Buffer.alloc(size * size * 4, 0);
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4] = BG[0];
    pixels[i * 4 + 1] = BG[1];
    pixels[i * 4 + 2] = BG[2];
    pixels[i * 4 + 3] = BG[3];
  }
  const margin = Math.max(1, Math.round(size * 0.1));
  const bar = Math.max(2, Math.round(size * 0.22));
  const stem = Math.max(2, Math.round(size * 0.24));
  const left = margin;
  const right = size - margin - 1;
  const top = margin;
  const bottom = size - margin - 1;
  const stemLeft = Math.round((size - stem) / 2);
  const stemRight = stemLeft + stem - 1;
  const paint = (x, y) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const index = (y * size + x) * 4;
    pixels[index] = FG[0];
    pixels[index + 1] = FG[1];
    pixels[index + 2] = FG[2];
    pixels[index + 3] = FG[3];
  };
  for (let y = top; y < top + bar && y <= bottom; y++) {
    for (let x = left; x <= right; x++) paint(x, y);
  }
  for (let y = top; y <= bottom; y++) {
    for (let x = stemLeft; x <= stemRight; x++) paint(x, y);
  }
  return pixels;
}

function png(size) {
  const pixels = draw(size);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    pixels.copy(raw, row + 1, y * size * 4, (y + 1) * size * 4);
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const parts = [header];
  for (const image of images) {
    const entry = Buffer.alloc(16);
    entry[0] = image.size >= 256 ? 0 : image.size;
    entry[1] = image.size >= 256 ? 0 : image.size;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.png.length;
    parts.push(entry);
  }
  for (const image of images) parts.push(image.png);
  return Buffer.concat(parts);
}

function svg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-label="Visit In Tampa">
  <rect width="48" height="48" fill="#0B5E6B"/>
  <path fill="#FFFFFF" d="M5 5h38v11H30v27h-12V16H5z"/>
</svg>
`;
}

function write(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}

const icoFile = ico([16, 32, 48].map((size) => ({ size, png: png(size) })));
write("public/favicon.ico", icoFile);
write("src/app/favicon.ico", icoFile);
write("public/icon.svg", svg());
for (const size of [48, 96, 192, 512]) {
  write(`public/icon-${size}.png`, png(size));
}
write("public/apple-touch-icon.png", png(180));
console.log("wrote favicon set");
