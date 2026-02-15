import type { RuntimeEnv } from "../../../runtime.js";
import type { GatewayDaemonRuntime } from "../../daemon-runtime.js";
import type { AuthChoice, GatewayBind, OnboardMode, TailscaleMode } from "../../onboard-types.js";
import type { OnboardOptions } from "../../onboard-types.js";

type GatewayInfo = {
  port: number;
  bind: GatewayBind;
  authMode: "token" | "password" | "none";
  tailscaleMode: TailscaleMode;
};

export function logNonInteractiveOnboardingJson(params: {
  opts: OnboardOptions;
  runtime: RuntimeEnv;
  mode: OnboardMode;
  workspaceDir: string;
  authChoice: AuthChoice;
  gateway: GatewayInfo;
  installDaemon: boolean;
  daemonRuntime?: GatewayDaemonRuntime;
  skipSkills: boolean;
  skipHealth: boolean;
}): void {
  const {
    opts,
    runtime,
    mode,
    workspaceDir,
    authChoice,
    gateway,
    installDaemon,
    daemonRuntime,
    skipSkills,
    skipHealth,
  } = params;

  const payload = {
    mode,
    workspace: workspaceDir,
    authChoice: authChoice !== "skip" ? authChoice : undefined,
    gateway: {
      port: gateway.port,
      bind: gateway.bind,
      auth: gateway.authMode,
      tailscale: gateway.tailscaleMode !== "off" ? gateway.tailscaleMode : undefined,
    },
    daemon: installDaemon
      ? {
          installed: true,
          runtime: daemonRuntime,
        }
      : undefined,
    skills: !skipSkills ? "enabled" : "skipped",
    health: !skipHealth ? "checked" : "skipped",
  };

  if (opts.json) {
    runtime.log(JSON.stringify(payload, null, 2));
  } else {
    runtime.log(`Mode: ${mode}`);
    runtime.log(`Workspace: ${workspaceDir}`);
    if (authChoice !== "skip") {
      runtime.log(`Auth: ${authChoice}`);
    }
    runtime.log(`Gateway: ${gateway.bind}:${gateway.port} (auth=${gateway.authMode})`);
    if (gateway.tailscaleMode !== "off") {
      runtime.log(`Tailscale: ${gateway.tailscaleMode}`);
    }
    if (installDaemon) {
      runtime.log(`Daemon: installed (${daemonRuntime})`);
    }
  }
}
