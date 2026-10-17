import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PATHS } from "./env";
import type { ParsedArticle, PexelsImage, RunLog } from "./types";

const PEXELS_NOTE =
  "Pexels images are stock photos and may not show the exact location. Check each one, or replace it with your own photo.";

export function articleDir(slug: string): string {
  return join(PATHS.outputDir, slug);
}

export function writeFailed(slug: string, raw: string): string {
  const dir = articleDir(slug);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "failed-response.txt");
  writeFileSync(path, raw, "utf8");
  return path;
}

export function writeArticle(args: {
  slug: string;
  parsed: ParsedArticle;
  withImages: string;
  images: PexelsImage[];
  leftover: string[];
  log: RunLog;
}): void {
  const dir = articleDir(args.slug);
  mkdirSync(dir, { recursive: true });

  const review =
    args.log.remainingFailures.length > 0
      ? `## Needs manual review\n\n${args.log.remainingFailures.map((item) => `- ${item}`).join("\n")}\n\n`
      : "";
  const leftover =
    args.leftover.length > 0
      ? `\n## Missing images\n\n${args.leftover.map((item) => `- ${item}`).join("\n")}\n`
      : "";

  writeFileSync(join(dir, "article.raw.md"), args.parsed.article, "utf8");
  writeFileSync(join(dir, "article.md"), args.withImages, "utf8");
  writeFileSync(join(dir, "seo.json"), `${JSON.stringify(args.parsed.seo, null, 2)}\n`, "utf8");
  writeFileSync(
    join(dir, "editor-notes.md"),
    `${review}${args.parsed.editorNotes.trim()}\n\n${PEXELS_NOTE}${leftover}\n`,
    "utf8",
  );
  writeFileSync(join(dir, "images.json"), `${JSON.stringify(args.images, null, 2)}\n`, "utf8");
  writeFileSync(join(dir, "run-log.json"), `${JSON.stringify(args.log, null, 2)}\n`, "utf8");
}
