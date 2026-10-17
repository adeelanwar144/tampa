import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "public", "map-assets");
const base = "https://raw.githubusercontent.com/protomaps/basemaps-assets/main";
const fonts = ["Noto Sans Regular", "Noto Sans Medium", "Noto Sans Italic"];
const ranges = ["0-255", "256-511", "512-767", "768-1023", "8192-8447", "8448-8703"];
const sprites = ["light.json", "light.png", "light@2x.json", "light@2x.png"];

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  for (const font of fonts) {
    for (const range of ranges) {
      const encoded = encodeURIComponent(font);
      await download(
        `${base}/fonts/${encoded}/${range}.pbf`,
        join(dest, "fonts", font, `${range}.pbf`),
      );
    }
  }
  await download(`${base}/fonts/OFL.txt`, join(dest, "fonts", "OFL.txt"));
  for (const file of sprites) {
    await download(`${base}/sprites/v4/${file}`, join(dest, "sprites", "v4", file));
  }
}

await main();
