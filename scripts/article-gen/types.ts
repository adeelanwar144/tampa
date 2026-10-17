import type { ArticleType } from "./article-type";

export type ModelChoice = "sonnet" | "haiku";

export type PlannerRow = {
  rowNumber: number;
  slug: string;
  slugRaw: string;
  primaryKeyword: string;
  lsiKeywords: string[];
  internalLinks: string[];
  notesFile?: string;
  status?: string;
  pillar?: string;
  articleType: ArticleType;
};

export type SeoBlock = {
  slug: string;
  meta_title: string;
  meta_description: string;
  primary_keyword: string;
  lsi_keywords_used: { keyword: string; section: string }[];
};

export type ClaudeUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
};

export type ParsedArticle = {
  seo: SeoBlock;
  article: string;
  editorNotes: string;
  raw: string;
};

export type CheckResult = {
  name: string;
  ok: boolean;
  warnOnly?: boolean;
  detail: string;
};

export type PexelsImage = {
  placeholder: string;
  alt: string;
  query: string;
  id?: number;
  url?: string;
  photographer?: string;
  photographerUrl?: string;
  photoUrl?: string;
  pexelsAlt?: string;
  fallback?: boolean;
  skipped?: string;
};

export type GenerateOptions = {
  model: ModelChoice;
  slugs: string[];
  limit?: number;
  force: boolean;
  dryRun: boolean;
  noImages: boolean;
  downloadImages: boolean;
  imagesOnly: boolean;
  audit: boolean;
  concurrency: number;
  plannerPath?: string;
  notesDir: string;
  sheet?: string;
};

export type RunLog = {
  slug: string;
  model: string;
  startedAt: string;
  finishedAt: string;
  usage: ClaudeUsage;
  estimatedCostUsd: number;
  checks: CheckResult[];
  revisions: number;
  remainingFailures: string[];
  images: number;
  wordCount: number;
  itemCount: number;
};
