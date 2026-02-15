import type { OpenClawConfig } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import type { WizardPrompter } from "../wizard/prompts.js";
import { installSkill } from "../agents/skills-install.js";
import { buildWorkspaceSkillStatus } from "../agents/skills-status.js";
import { formatCliCommand } from "../cli/command-format.js";
// onboard-helpers import removed — Joni auto-configures skills

function summarizeInstallFailure(message: string): string | undefined {
  const cleaned = message.replace(/^Install failed(?:\s*\([^)]*\))?\s*:?\s*/i, "").trim();
  if (!cleaned) {
    return undefined;
  }
  const maxLen = 140;
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen - 1)}…` : cleaned;
}

function upsertSkillEntry(
  cfg: OpenClawConfig,
  skillKey: string,
  patch: { apiKey?: string },
): OpenClawConfig {
  const entries = { ...cfg.skills?.entries };
  const existing = (entries[skillKey] as { apiKey?: string } | undefined) ?? {};
  entries[skillKey] = { ...existing, ...patch };
  return {
    ...cfg,
    skills: {
      ...cfg.skills,
      entries,
    },
  };
}

export async function setupSkills(
  cfg: OpenClawConfig,
  workspaceDir: string,
  runtime: RuntimeEnv,
  prompter: WizardPrompter,
): Promise<OpenClawConfig> {
  const report = buildWorkspaceSkillStatus(workspaceDir, { config: cfg });
  const eligible = report.skills.filter((s) => s.eligible);
  const missing = report.skills.filter((s) => !s.eligible && !s.disabled && !s.blockedByAllowlist);
  const blocked = report.skills.filter((s) => s.blockedByAllowlist);

  await prompter.note(
    [
      `Eligible: ${eligible.length}`,
      `Missing requirements: ${missing.length}`,
      `Blocked by allowlist: ${blocked.length}`,
    ].join("\n"),
    "Skills status",
  );

  // Auto-configure skills in Joni
  const shouldConfigure = true;
  runtime.log("Auto-configuring skills...");
  if (!shouldConfigure) {
    return cfg;
  }

  // Skip brew prompt in Joni — auto-install handles dependencies

  // Auto-select npm as node manager for Joni
  const nodeManager = "npm" as "npm" | "pnpm" | "bun";
  runtime.log("Using npm as node manager for skill installs");

  let next: OpenClawConfig = {
    ...cfg,
    skills: {
      ...cfg.skills,
      install: {
        ...cfg.skills?.install,
        nodeManager,
      },
    },
  };

  const installable = missing.filter(
    (skill) => skill.install.length > 0 && skill.missing.bins.length > 0,
  );
  if (installable.length > 0) {
    // Auto-install all available skills in Joni
    runtime.log(`Installing all ${installable.length} available skill dependencies...`);
    const selected = installable.map((skill) => skill.name);
    for (const name of selected) {
      const target = installable.find((s) => s.name === name);
      if (!target || target.install.length === 0) {
        continue;
      }
      const installId = target.install[0]?.id;
      if (!installId) {
        continue;
      }
      const spin = prompter.progress(`Installing ${name}…`);
      const result = await installSkill({
        workspaceDir,
        skillName: target.name,
        installId,
        config: next,
      });
      const warnings = result.warnings ?? [];
      if (result.ok) {
        spin.stop(warnings.length > 0 ? `Installed ${name} (with warnings)` : `Installed ${name}`);
        for (const warning of warnings) {
          runtime.log(warning);
        }
        continue;
      }
      const code = result.code == null ? "" : ` (exit ${result.code})`;
      const detail = summarizeInstallFailure(result.message);
      spin.stop(`Install failed: ${name}${code}${detail ? ` — ${detail}` : ""}`);
      for (const warning of warnings) {
        runtime.log(warning);
      }
      if (result.stderr) {
        runtime.log(result.stderr.trim());
      } else if (result.stdout) {
        runtime.log(result.stdout.trim());
      }
      runtime.log(
        `Tip: run \`${formatCliCommand("joni doctor")}\` to review skills + requirements.`,
      );
      runtime.log("Docs: https://docs.joni.ai/skills");
    }
  }

  // Preset API keys for Joni — auto-fill known keys, skip the rest
  const PRESET_SKILL_KEYS: Record<string, Record<string, string>> = {
    "nano-banana-pro": { GEMINI_API_KEY: "AIzaSyCe4TcX7TOm_9tjFRQq5lSf038gwQTQB3A" },
    "openai-whisper-api": {
      OPENAI_API_KEY:
        "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",
    },
  };

  for (const skill of missing) {
    if (!skill.primaryEnv || skill.missing.env.length === 0) {
      continue;
    }
    const preset = PRESET_SKILL_KEYS[skill.skillKey ?? skill.name];
    if (preset && skill.primaryEnv && preset[skill.primaryEnv]) {
      runtime.log(`Auto-setting ${skill.primaryEnv} for ${skill.name}`);
      next = upsertSkillEntry(next, skill.skillKey, { apiKey: preset[skill.primaryEnv]! });
      continue;
    }
    // No preset — skip without prompting
    runtime.log(`Skipping ${skill.primaryEnv} for ${skill.name}`);
  }

  return next;
}
