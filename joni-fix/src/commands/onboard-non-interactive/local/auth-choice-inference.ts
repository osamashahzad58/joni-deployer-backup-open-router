import type { AuthChoice, OnboardOptions } from "../../onboard-types.js";

type InferenceMatch = {
  choice: AuthChoice;
  label: string;
};

export type AuthChoiceInference = {
  choice: AuthChoice | null;
  matches: InferenceMatch[];
};

export function inferAuthChoiceFromFlags(opts: OnboardOptions): AuthChoiceInference {
  const matches: InferenceMatch[] = [];

  if (opts.anthropicApiKey) {
    matches.push({ choice: "claude-cli", label: "--anthropic-api-key" });
  }
  if (opts.openaiApiKey) {
    matches.push({ choice: "openai-api-key", label: "--openai-api-key" });
  }
  if (opts.openrouterApiKey) {
    matches.push({ choice: "openrouter-api-key", label: "--openrouter-api-key" });
  }
  if (opts.aiGatewayApiKey) {
    matches.push({ choice: "ai-gateway-api-key", label: "--ai-gateway-api-key" });
  }
  if (opts.cloudflareAiGatewayApiKey) {
    matches.push({
      choice: "cloudflare-ai-gateway-api-key",
      label: "--cloudflare-ai-gateway-api-key",
    });
  }
  if (opts.moonshotApiKey) {
    matches.push({ choice: "moonshot-api-key", label: "--moonshot-api-key" });
  }
  if (opts.kimiCodeApiKey) {
    matches.push({ choice: "kimi-code-api-key", label: "--kimi-code-api-key" });
  }
  if (opts.geminiApiKey) {
    matches.push({ choice: "gemini-api-key", label: "--gemini-api-key" });
  }
  if (opts.zaiApiKey) {
    matches.push({ choice: "zai-api-key", label: "--zai-api-key" });
  }
  if (opts.xiaomiApiKey) {
    matches.push({ choice: "xiaomi-api-key", label: "--xiaomi-api-key" });
  }
  if (opts.minimaxApiKey) {
    matches.push({ choice: "minimax-api", label: "--minimax-api-key" });
  }
  if (opts.syntheticApiKey) {
    matches.push({ choice: "synthetic-api-key", label: "--synthetic-api-key" });
  }
  if (opts.veniceApiKey) {
    matches.push({ choice: "venice-api-key", label: "--venice-api-key" });
  }
  if (opts.opencodeZenApiKey) {
    matches.push({ choice: "opencode-zen", label: "--opencode-zen-api-key" });
  }
  if (opts.xaiApiKey) {
    matches.push({ choice: "xai-api-key", label: "--xai-api-key" });
  }
  if (opts.qianfanApiKey) {
    matches.push({ choice: "qianfan-api-key", label: "--qianfan-api-key" });
  }
  if (opts.token && opts.tokenProvider) {
    matches.push({ choice: "token", label: "--token + --token-provider" });
  }

  return {
    choice: matches.length === 1 ? matches[0].choice : null,
    matches,
  };
}
