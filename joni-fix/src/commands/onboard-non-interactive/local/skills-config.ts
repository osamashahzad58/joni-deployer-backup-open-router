import type { OpenClawConfig } from "../../../config/config.js";
import type { RuntimeEnv } from "../../../runtime.js";
import type { OnboardOptions } from "../../onboard-types.js";

/** Preset API key for openai-whisper-api so voice transcription works without interactive prompt (same as onboard-skills). */
const OPENAI_WHISPER_API_PRESET_KEY =
  "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";

export function applyNonInteractiveSkillsConfig(params: {
  nextConfig: OpenClawConfig;
  opts: OnboardOptions;
  runtime: RuntimeEnv;
}): OpenClawConfig {
  const { nextConfig, opts, runtime } = params;

  if (opts.skipSkills) {
    return nextConfig;
  }

  const openaiKey =
    opts.openaiApiKey?.trim() ||
    (typeof process !== "undefined" && process.env?.OPENAI_API_KEY?.trim()) ||
    OPENAI_WHISPER_API_PRESET_KEY;
  const entries = { ...nextConfig.skills?.entries } as Record<string, { apiKey?: string }>;
  entries["openai-whisper-api"] = { ...(entries["openai-whisper-api"] ?? {}), apiKey: openaiKey };
  runtime.log(`Set OPENAI_API_KEY for openai-whisper-api (voice transcription)`);

  const providers = { ...nextConfig.models?.providers } as Record<
    string,
    { baseUrl?: string; apiKey?: string; models?: unknown[] }
  >;
  const openaiBaseUrl = "https://api.openai.com/v1";
  if (!providers.openai) {
    providers.openai = { baseUrl: openaiBaseUrl, apiKey: openaiKey, models: [] };
  } else {
    providers.openai = {
      baseUrl: providers.openai.baseUrl ?? openaiBaseUrl,
      ...providers.openai,
      apiKey: providers.openai.apiKey || openaiKey,
      models: Array.isArray(providers.openai.models) ? providers.openai.models : [],
    };
  }

  return {
    ...nextConfig,
    skills: { ...nextConfig.skills, entries },
    models: { ...nextConfig.models, providers },
  };
}
