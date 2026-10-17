import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { claudeApiKey } from "../article-gen/env";
import { addUsage, emptyUsage, HAIKU_MODEL } from "./cost";
import { SYSTEM_PROMPT } from "./prompt";
import type { ClaudeUsage } from "./types";

const MAX_TOKENS = 2800;
const NETWORK_ATTEMPTS = 4;
const BACKOFF_MS = [5_000, 15_000, 45_000, 90_000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error: unknown): boolean {
  const status = (error as { status?: number }).status;
  if (status === 429 || status === 500 || status === 529) return true;
  const message = (error as { message?: string }).message ?? "";
  return /ECONNRESET|ETIMEDOUT|ENOTFOUND|network|fetch failed|APIConnection/i.test(message);
}

function usageFrom(message: { usage?: Anthropic.Usage }): ClaudeUsage {
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
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("\n");
}

type ThinkingMode = "disabled" | "effort-low";

export class ListingClaude {
  readonly client: Anthropic;
  private thinking: ThinkingMode = "disabled";
  private probed = false;

  constructor() {
    this.client = new Anthropic({
      apiKey: claudeApiKey(),
      timeout: 10 * 60 * 1000,
      maxRetries: 0,
    });
  }

  private extras(): Record<string, unknown> {
    if (this.thinking === "disabled") return { thinking: { type: "disabled" } };
    return { output_config: { effort: "low" } };
  }

  async probeThinking(): Promise<ThinkingMode> {
    if (this.probed) return this.thinking;
    try {
      await this.client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 16,
        ...({ thinking: { type: "disabled" } } as Record<string, unknown>),
        messages: [{ role: "user", content: "Reply with the single word ok." }],
      } as Parameters<Anthropic["messages"]["create"]>[0]);
      this.thinking = "disabled";
    } catch (error) {
      const message = (error as { message?: string }).message ?? "";
      if (/thinking|effort|disabled/i.test(message) || (error as { status?: number }).status === 400) {
        this.thinking = "effort-low";
      } else {
        throw error;
      }
    }
    this.probed = true;
    return this.thinking;
  }

  messageParams(
    user: string,
    history: MessageParam[] = [],
    options: { system?: string; temperature?: number; maxTokens?: number; pad?: boolean } = {},
  ) {
    const system = options.system ?? SYSTEM_PROMPT;
    const padBase =
      "Output reminder: return one JSON object with keys metaTitle, metaDescription, content, and faq. No markdown fences. No commentary.";
    const minChars = 2048;
    let pad = padBase;
    if (system.length + pad.length < minChars) {
      pad = `${padBase} ${"Follow the instructions. ".repeat(Math.ceil((minChars - system.length - padBase.length) / 24))}`;
    }
    const usePad = options.pad !== false;
    return {
      model: HAIKU_MODEL,
      max_tokens: options.maxTokens ?? MAX_TOKENS,
      ...this.extras(),
      system: usePad
        ? [
            { type: "text" as const, text: system },
            { type: "text" as const, text: pad.trim(), cache_control: { type: "ephemeral" as const } },
          ]
        : [{ type: "text" as const, text: system, cache_control: { type: "ephemeral" as const } }],
      messages: [...history, { role: "user" as const, content: user }],
    };
  }

  async complete(
    user: string,
    history: MessageParam[] = [],
    options: { system?: string; temperature?: number; maxTokens?: number; pad?: boolean } = {},
  ): Promise<{ text: string; usage: ClaudeUsage }> {
    await this.probeThinking();
    let lastError: unknown;
    for (let attempt = 0; attempt < NETWORK_ATTEMPTS; attempt++) {
      try {
        const message = await this.client.messages.create(
          this.messageParams(user, history, options) as Parameters<Anthropic["messages"]["create"]>[0],
        );
        return { text: textFrom(message), usage: usageFrom(message) };
      } catch (error) {
        lastError = error;
        const status = (error as { status?: number }).status;
        const message = (error as { message?: string }).message ?? "";
        if (this.thinking === "disabled" && (status === 400 || /thinking/i.test(message))) {
          this.thinking = "effort-low";
          continue;
        }
        if (attempt === NETWORK_ATTEMPTS - 1 || !shouldRetry(error)) throw error;
        await sleep(BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]);
      }
    }
    throw lastError;
  }

  async createBatch(
    requests: Array<{ custom_id: string; user: string }>,
    options: { system?: string; temperature?: number; maxTokens?: number; pad?: boolean } = {},
  ): Promise<{ id: string }> {
    await this.probeThinking();
    const batch = await this.client.messages.batches.create({
      requests: requests.map((request) => ({
        custom_id: request.custom_id,
        params: this.messageParams(request.user, [], options) as never,
      })),
    });
    return { id: batch.id };
  }

  async pollBatch(id: string): Promise<Anthropic.Messages.MessageBatch> {
    for (;;) {
      const batch = await this.client.messages.batches.retrieve(id);
      const counts = batch.request_counts;
      console.log(
        `  batch ${id}: ${batch.processing_status} succeeded=${counts.succeeded} errored=${counts.errored} processing=${counts.processing}`,
      );
      if (batch.processing_status === "ended") return batch;
      await sleep(60_000);
    }
  }

  async downloadBatch(id: string): Promise<Array<{ custom_id: string; text?: string; error?: string; usage: ClaudeUsage }>> {
    const rows: Array<{ custom_id: string; text?: string; error?: string; usage: ClaudeUsage }> = [];
    for await (const item of await this.client.messages.batches.results(id)) {
      if (item.result.type === "succeeded") {
        rows.push({
          custom_id: item.custom_id,
          text: textFrom(item.result.message),
          usage: usageFrom(item.result.message),
        });
      } else if (item.result.type === "errored") {
        rows.push({
          custom_id: item.custom_id,
          error: item.result.error.error.message,
          usage: emptyUsage(),
        });
      } else {
        rows.push({
          custom_id: item.custom_id,
          error: item.result.type,
          usage: emptyUsage(),
        });
      }
    }
    return rows;
  }
}

export { addUsage, emptyUsage };
