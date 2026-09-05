import { MockAIProvider } from "@/lib/services/ai/mock";
import { OpenAIProvider } from "@/lib/services/ai/openai";
import type { AIProvider } from "@/lib/services/ai/types";

export function getAIProvider(): AIProvider {
  const named = process.env.AI_PROVIDER?.toLowerCase();
  const apiKey = process.env.OPENAI_API_KEY;
  if (named === "openai" && apiKey) {
    return new OpenAIProvider(
      apiKey,
      process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      process.env.OPENAI_MODEL || "gpt-4o-mini",
    );
  }
  return new MockAIProvider();
}

export function getAIProviderName() {
  const named = process.env.AI_PROVIDER?.toLowerCase();
  const apiKey = process.env.OPENAI_API_KEY;
  if (named === "openai" && apiKey) return "openai";
  return "mock";
}
