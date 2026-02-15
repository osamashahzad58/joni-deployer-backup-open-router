import os from "node:os";
import path from "node:path";
import type { OpenClawConfig } from "../../../config/config.js";
import type { OnboardOptions } from "../../onboard-types.js";

export function resolveNonInteractiveWorkspaceDir(params: {
  opts: OnboardOptions;
  baseConfig: OpenClawConfig;
  defaultWorkspaceDir: string;
}): string {
  const { opts, baseConfig, defaultWorkspaceDir } = params;

  // Command-line flag takes highest priority
  if (opts.workspace) {
    if (path.isAbsolute(opts.workspace)) {
      return opts.workspace;
    }
    return path.resolve(process.cwd(), opts.workspace);
  }

  // Existing config value
  if (baseConfig.agents?.defaults?.workspace) {
    return baseConfig.agents.defaults.workspace;
  }

  // Default
  return path.resolve(os.homedir(), defaultWorkspaceDir);
}
