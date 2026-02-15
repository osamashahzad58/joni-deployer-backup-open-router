import type { OpenClawConfig } from "../../../config/config.js";
import type { RuntimeEnv } from "../../../runtime.js";
import type { AuthChoice, OnboardOptions } from "../../onboard-types.js";
import { upsertAuthProfile } from "../../../agents/auth-profiles.js";
import { upsertSharedEnvVar } from "../../../infra/env-file.js";
import { normalizeApiKeyInput } from "../../auth-choice.api-key.js";
import { applyDefaultModelChoice } from "../../auth-choice.default-model.js";
import { buildTokenProfileId } from "../../auth-token.js";
import { applyGoogleGeminiModelDefault } from "../../google-gemini-model-default.js";
import {
  applyAuthProfileConfig,
  setAnthropicApiKey,
  setOpenrouterApiKey,
  setVercelAiGatewayApiKey,
  setCloudflareAiGatewayConfig,
  setMoonshotApiKey,
  setKimiCodingApiKey,
  setGeminiApiKey,
  setZaiApiKey,
  setXiaomiApiKey,
  setMinimaxApiKey,
  setSyntheticApiKey,
  setVeniceApiKey,
  setOpencodeZenApiKey,
  setXaiApiKey,
  setQianfanApiKey,
  applyOpenrouterConfig,
  applyOpenrouterProviderConfig,
  applyVercelAiGatewayConfig,
  applyVercelAiGatewayProviderConfig,
  applyCloudflareAiGatewayConfig,
  applyCloudflareAiGatewayProviderConfig,
  applyMoonshotConfig,
  applyMoonshotProviderConfig,
  applyMoonshotConfigCn,
  applyMoonshotProviderConfigCn,
  applyKimiCodeConfig,
  applyKimiCodeProviderConfig,
  applyZaiConfig,
  applyXiaomiConfig,
  applyXiaomiProviderConfig,
  applyMinimaxApiConfig,
  applyMinimaxApiProviderConfig,
  applySyntheticConfig,
  applySyntheticProviderConfig,
  applyVeniceConfig,
  applyVeniceProviderConfig,
  applyOpencodeZenConfig,
  applyOpencodeZenProviderConfig,
  applyXaiConfig,
  applyXaiProviderConfig,
  applyQianfanConfig,
  applyQianfanProviderConfig,
  OPENROUTER_DEFAULT_MODEL_REF,
  VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF,
  CLOUDFLARE_AI_GATEWAY_DEFAULT_MODEL_REF,
  MOONSHOT_DEFAULT_MODEL_REF,
  KIMI_CODING_MODEL_REF,
  ZAI_DEFAULT_MODEL_REF,
  XIAOMI_DEFAULT_MODEL_REF,
  MINIMAX_HOSTED_MODEL_REF,
  SYNTHETIC_DEFAULT_MODEL_REF,
  VENICE_DEFAULT_MODEL_REF,
  XAI_DEFAULT_MODEL_REF,
  QIANFAN_DEFAULT_MODEL_REF,
} from "../../onboard-auth.js";
import {
  applyOpenAIConfig,
  applyOpenAIProviderConfig,
  OPENAI_DEFAULT_MODEL,
} from "../../openai-model-default.js";

type ApplyNonInteractiveAuthChoiceParams = {
  nextConfig: OpenClawConfig;
  authChoice: AuthChoice;
  opts: OnboardOptions;
  runtime: RuntimeEnv;
  baseConfig: OpenClawConfig;
};

export async function applyNonInteractiveAuthChoice(
  params: ApplyNonInteractiveAuthChoiceParams,
): Promise<OpenClawConfig | null> {
  const { nextConfig, authChoice, opts, runtime } = params;
  let config = nextConfig;

  // Skip auth
  if (authChoice === "skip") {
    return config;
  }

  // Claude (Anthropic) - just set API key, model defaults are handled elsewhere
  if (authChoice === "claude-cli" || authChoice === "apiKey") {
    if (opts.anthropicApiKey) {
      await setAnthropicApiKey(normalizeApiKeyInput(opts.anthropicApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "anthropic:default",
        provider: "anthropic",
        mode: "api_key",
      });
      return config;
    }
    runtime.error("Missing --anthropic-api-key for auth-choice=claude-cli");
    runtime.exit(1);
    return null;
  }

  // Token auth
  if (authChoice === "token" || authChoice === "setup-token" || authChoice === "oauth") {
    if (!opts.token || !opts.tokenProvider) {
      runtime.error("--token and --token-provider required for auth-choice=token");
      runtime.exit(1);
      return null;
    }

    const profileId =
      opts.tokenProfileId ||
      buildTokenProfileId({
        provider: opts.tokenProvider,
        name: "default",
      });
    upsertAuthProfile({
      profileId,
      agentDir: undefined,
      credential: {
        type: "token",
        provider: opts.tokenProvider,
        token: opts.token.trim(),
        expiresIn: opts.tokenExpiresIn,
      },
    });

    config = applyAuthProfileConfig(config, {
      profileId,
      provider: opts.tokenProvider,
      mode: "token",
    });
    return config;
  }

  // OpenAI
  if (authChoice === "openai-api-key") {
    if (opts.openaiApiKey) {
      const trimmed = normalizeApiKeyInput(opts.openaiApiKey);
      upsertSharedEnvVar({
        key: "OPENAI_API_KEY",
        value: trimmed,
      });
      process.env.OPENAI_API_KEY = trimmed;

      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: OPENAI_DEFAULT_MODEL,
        applyDefaultConfig: applyOpenAIConfig,
        applyProviderConfig: applyOpenAIProviderConfig,
        noteDefault: OPENAI_DEFAULT_MODEL,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --openai-api-key");
    runtime.exit(1);
    return null;
  }

  // Openrouter
  if (authChoice === "openrouter-api-key") {
    if (opts.openrouterApiKey) {
      await setOpenrouterApiKey(normalizeApiKeyInput(opts.openrouterApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "openrouter:default",
        provider: "openrouter",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: OPENROUTER_DEFAULT_MODEL_REF,
        applyDefaultConfig: applyOpenrouterConfig,
        applyProviderConfig: applyOpenrouterProviderConfig,
        noteDefault: OPENROUTER_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --openrouter-api-key");
    runtime.exit(1);
    return null;
  }

  // Vercel AI Gateway
  if (authChoice === "ai-gateway-api-key") {
    if (opts.aiGatewayApiKey) {
      await setVercelAiGatewayApiKey(normalizeApiKeyInput(opts.aiGatewayApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "vercel-ai-gateway:default",
        provider: "vercel-ai-gateway",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF,
        applyDefaultConfig: applyVercelAiGatewayConfig,
        applyProviderConfig: applyVercelAiGatewayProviderConfig,
        noteDefault: VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --ai-gateway-api-key");
    runtime.exit(1);
    return null;
  }

  // Cloudflare AI Gateway
  if (authChoice === "cloudflare-ai-gateway-api-key") {
    if (
      opts.cloudflareAiGatewayAccountId &&
      opts.cloudflareAiGatewayGatewayId &&
      opts.cloudflareAiGatewayApiKey
    ) {
      await setCloudflareAiGatewayConfig({
        accountId: opts.cloudflareAiGatewayAccountId,
        gatewayId: opts.cloudflareAiGatewayGatewayId,
        apiKey: normalizeApiKeyInput(opts.cloudflareAiGatewayApiKey),
        agentDir: undefined,
      });
      config = applyAuthProfileConfig(config, {
        profileId: "cloudflare-ai-gateway:default",
        provider: "cloudflare-ai-gateway",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: CLOUDFLARE_AI_GATEWAY_DEFAULT_MODEL_REF,
        applyDefaultConfig: applyCloudflareAiGatewayConfig,
        applyProviderConfig: applyCloudflareAiGatewayProviderConfig,
        noteDefault: CLOUDFLARE_AI_GATEWAY_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error(
      "Missing Cloudflare AI Gateway config (--cloudflare-ai-gateway-account-id, --cloudflare-ai-gateway-gateway-id, --cloudflare-ai-gateway-api-key)",
    );
    runtime.exit(1);
    return null;
  }

  // Moonshot
  if (authChoice === "moonshot-api-key") {
    if (opts.moonshotApiKey) {
      await setMoonshotApiKey(normalizeApiKeyInput(opts.moonshotApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "moonshot:default",
        provider: "moonshot",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: MOONSHOT_DEFAULT_MODEL_REF,
        applyDefaultConfig: applyMoonshotConfig,
        applyProviderConfig: applyMoonshotProviderConfig,
        noteDefault: MOONSHOT_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --moonshot-api-key");
    runtime.exit(1);
    return null;
  }

  // Moonshot CN
  if (authChoice === "moonshot-api-key-cn") {
    if (opts.moonshotApiKey) {
      await setMoonshotApiKey(normalizeApiKeyInput(opts.moonshotApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "moonshot:default",
        provider: "moonshot",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: MOONSHOT_DEFAULT_MODEL_REF,
        applyDefaultConfig: applyMoonshotConfigCn,
        applyProviderConfig: applyMoonshotProviderConfigCn,
        noteDefault: MOONSHOT_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --moonshot-api-key");
    runtime.exit(1);
    return null;
  }

  // Kimi Code
  if (authChoice === "kimi-code-api-key") {
    if (opts.kimiCodeApiKey) {
      await setKimiCodingApiKey(normalizeApiKeyInput(opts.kimiCodeApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "kimi-coding:default",
        provider: "kimi-coding",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: KIMI_CODING_MODEL_REF,
        applyDefaultConfig: applyKimiCodeConfig,
        applyProviderConfig: applyKimiCodeProviderConfig,
        noteDefault: KIMI_CODING_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --kimi-code-api-key");
    runtime.exit(1);
    return null;
  }

  // Gemini
  if (authChoice === "gemini-api-key") {
    if (opts.geminiApiKey) {
      await setGeminiApiKey(normalizeApiKeyInput(opts.geminiApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "google:default",
        provider: "google",
        mode: "api_key",
      });
      const applied = applyGoogleGeminiModelDefault(config);
      config = applied.next;
      return config;
    }
    runtime.error("Missing --gemini-api-key");
    runtime.exit(1);
    return null;
  }

  // Zai
  if (authChoice === "zai-api-key") {
    if (opts.zaiApiKey) {
      await setZaiApiKey(normalizeApiKeyInput(opts.zaiApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "zai:default",
        provider: "zai",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: ZAI_DEFAULT_MODEL_REF,
        applyDefaultConfig: applyZaiConfig,
        applyProviderConfig: () => Promise.resolve(config),
        noteDefault: ZAI_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --zai-api-key");
    runtime.exit(1);
    return null;
  }

  // Xiaomi
  if (authChoice === "xiaomi-api-key") {
    if (opts.xiaomiApiKey) {
      await setXiaomiApiKey(normalizeApiKeyInput(opts.xiaomiApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "xiaomi:default",
        provider: "xiaomi",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: XIAOMI_DEFAULT_MODEL_REF,
        applyDefaultConfig: applyXiaomiConfig,
        applyProviderConfig: applyXiaomiProviderConfig,
        noteDefault: XIAOMI_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --xiaomi-api-key");
    runtime.exit(1);
    return null;
  }

  // Minimax
  if (
    authChoice === "minimax" ||
    authChoice === "minimax-api" ||
    authChoice === "minimax-api-lightning"
  ) {
    if (opts.minimaxApiKey) {
      await setMinimaxApiKey(normalizeApiKeyInput(opts.minimaxApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "minimax:default",
        provider: "minimax",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: MINIMAX_HOSTED_MODEL_REF,
        applyDefaultConfig: applyMinimaxApiConfig,
        applyProviderConfig: applyMinimaxApiProviderConfig,
        noteDefault: MINIMAX_HOSTED_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --minimax-api-key");
    runtime.exit(1);
    return null;
  }

  // Synthetic
  if (authChoice === "synthetic-api-key") {
    if (opts.syntheticApiKey) {
      await setSyntheticApiKey(normalizeApiKeyInput(opts.syntheticApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "synthetic:default",
        provider: "synthetic",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: SYNTHETIC_DEFAULT_MODEL_REF,
        applyDefaultConfig: applySyntheticConfig,
        applyProviderConfig: applySyntheticProviderConfig,
        noteDefault: SYNTHETIC_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --synthetic-api-key");
    runtime.exit(1);
    return null;
  }

  // Venice
  if (authChoice === "venice-api-key") {
    if (opts.veniceApiKey) {
      await setVeniceApiKey(normalizeApiKeyInput(opts.veniceApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "venice:default",
        provider: "venice",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: VENICE_DEFAULT_MODEL_REF,
        applyDefaultConfig: applyVeniceConfig,
        applyProviderConfig: applyVeniceProviderConfig,
        noteDefault: VENICE_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --venice-api-key");
    runtime.exit(1);
    return null;
  }

  // Opencode Zen
  if (authChoice === "opencode-zen") {
    if (opts.opencodeZenApiKey) {
      await setOpencodeZenApiKey(normalizeApiKeyInput(opts.opencodeZenApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "opencode-zen:default",
        provider: "opencode-zen",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: "opencode-zen/qwen-3-235b-max",
        applyDefaultConfig: applyOpencodeZenConfig,
        applyProviderConfig: applyOpencodeZenProviderConfig,
        noteDefault: "opencode-zen/qwen-3-235b-max",
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --opencode-zen-api-key");
    runtime.exit(1);
    return null;
  }

  // xAI
  if (authChoice === "xai-api-key") {
    if (opts.xaiApiKey) {
      await setXaiApiKey(normalizeApiKeyInput(opts.xaiApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "xai:default",
        provider: "xai",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: XAI_DEFAULT_MODEL_REF,
        applyDefaultConfig: applyXaiConfig,
        applyProviderConfig: applyXaiProviderConfig,
        noteDefault: XAI_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --xai-api-key");
    runtime.exit(1);
    return null;
  }

  // Qianfan
  if (authChoice === "qianfan-api-key") {
    if (opts.qianfanApiKey) {
      await setQianfanApiKey(normalizeApiKeyInput(opts.qianfanApiKey), undefined);
      config = applyAuthProfileConfig(config, {
        profileId: "qianfan:default",
        provider: "qianfan",
        mode: "api_key",
      });
      const applied = await applyDefaultModelChoice({
        config,
        setDefaultModel: true,
        defaultModel: QIANFAN_DEFAULT_MODEL_REF,
        applyDefaultConfig: applyQianfanConfig,
        applyProviderConfig: applyQianfanProviderConfig,
        noteDefault: QIANFAN_DEFAULT_MODEL_REF,
        noteAgentModel: async () => {},
        prompter: null as any,
      });
      config = applied.config;
      return config;
    }
    runtime.error("Missing --qianfan-api-key");
    runtime.exit(1);
    return null;
  }

  runtime.error(`Unsupported auth choice in non-interactive mode: ${authChoice}`);
  runtime.exit(1);
  return null;
}
