import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, TextBlock } from "@anthropic-ai/sdk/resources/messages";
import { claudeApiKey, tokenRates } from "./env";
import type { ClaudeUsage, ParsedArticle, SeoBlock } from "./types";

const MAX_ATTEMPTS = 4;
const BACKOFF_MS = [5_000, 15_000, 45_000, 90_000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(error: unknown, attempt: number): number {
  const headers = (error as { headers?: { get?: (name: string) => string | null } }).headers;
  const retryAfter = headers?.get?.("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  }
  return BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
}

function shouldRetry(error: unknown): boolean {
  const status = (error as { status?: number }).status;
  if (status === 429 || status === 500 || status === 529) return true;
  const name = (error as { name?: string }).name ?? "";
  const message = (error as { message?: string }).message ?? "";
  return /ECONNRESET|ETIMEDOUT|ENOTFOUND|network|fetch failed|APIConnection/i.test(`${name} ${message}`);
}

function emptyUsage(): ClaudeUsage {
  return { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
}

export function addUsage(total: ClaudeUsage, next: ClaudeUsage): ClaudeUsage {
  return {
    inputTokens: total.inputTokens + next.inputTokens,
    outputTokens: total.outputTokens + next.outputTokens,
    cacheCreationTokens: total.cacheCreationTokens + next.cacheCreationTokens,
    cacheReadTokens: total.cacheReadTokens + next.cacheReadTokens,
  };
}

export function estimateCostUsd(model: string, usage: ClaudeUsage): number {
  const rates = tokenRates(model);
  const million = 1_000_000;
  return (
    (usage.inputTokens / million) * rates.input +
    (usage.outputTokens / million) * rates.output +
    (usage.cacheCreationTokens / million) * rates.cacheWrite +
    (usage.cacheReadTokens / million) * rates.cacheRead
  );
}

function usageFromMessage(message: { usage?: Anthropic.Usage }): ClaudeUsage {
  const usage = message.usage;
  if (!usage) return emptyUsage();
  return {
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
  };
}

function textFrom(message: { content: Array<{ type: string; text?: string }> }): string {
  return message.content
    .filter((block): block is TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

export class ClaudeClient {
  private readonly client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: claudeApiKey(),
      timeout: 6 * 60 * 1000,
      maxRetries: 0,
    });
  }

  async complete(args: {
    model: string;
    system: string;
    messages: MessageParam[];
  }): Promise<{ text: string; usage: ClaudeUsage }> {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const message = await this.client.messages.create({
          model: args.model,
          max_tokens: 16_000,
          thinking: { type: "between_tools" },
          system: [
            {
              type: "text",
              text: args.system,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: args.messages,
        } as Anthropic.MessageCreateParams);
        return { text: textFrom(message), usage: usageFromMessage(message) };
      } catch (error) {
        lastError = error;
        if (attempt === MAX_ATTEMPTS - 1 || !shouldRetry(error)) throw error;
        await sleep(retryAfterMs(error, attempt));
      }
    }
    throw lastError;
  }
}

function extractBlock(text: string, tag: string): string | null {
  const match = text.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

export function parseArticle(raw: string): ParsedArticle | { error: string; raw: string } {
  const seoText = extractBlock(raw, "seo");
  const article = extractBlock(raw, "article");
  const editorNotes = extractBlock(raw, "editor_notes");
  if (!seoText || !article || !editorNotes) {
    return { error: "Missing <seo>, <article>, or <editor_notes> block", raw };
  }
  try {
    const seo = JSON.parse(seoText) as SeoBlock;
    if (!seo.slug || !seo.meta_title || !seo.meta_description) {
      return { error: "SEO JSON is missing slug, meta_title, or meta_description", raw };
    }
    return { seo, article, editorNotes, raw };
  } catch {
    return { error: "SEO JSON did not parse", raw };
  }
}

export const FORMAT_REMINDER =
  "Your last reply did not match the required output format. Return exactly the three blocks <seo>, <article>, and <editor_notes> and nothing else.";
