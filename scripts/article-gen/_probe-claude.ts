import { config } from "dotenv";
config({ path: ".env", quiet: true });

async function main() {
  const key =
    process.env.Claude_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.CLAUDE_API_KEY;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL_SONNET || "claude-sonnet-4-5-20250929",
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with OK" }],
    }),
  });
  console.log("status", res.status);
  console.log(await res.text());
}

main();
