import type { OpenClawConfig } from "../../../config/config.js";
import type { RuntimeEnv } from "../../../runtime.js";
import type {
  GatewayAuthChoice,
  GatewayBind,
  OnboardOptions,
  TailscaleMode,
} from "../../onboard-types.js";
import { normalizeGatewayTokenInput, randomToken } from "../../onboard-helpers.js";

type ApplyNonInteractiveGatewayConfigParams = {
  nextConfig: OpenClawConfig;
  opts: OnboardOptions;
  runtime: RuntimeEnv;
  defaultPort: number;
};

type ApplyNonInteractiveGatewayConfigResult = {
  nextConfig: OpenClawConfig;
  port: number;
  bind: GatewayBind;
  authMode: GatewayAuthChoice | "none";
  gatewayToken: string | undefined;
  tailscaleMode: TailscaleMode;
};

const DEFAULT_DANGEROUS_NODE_DENY_COMMANDS = [
  "camera.snap",
  "camera.clip",
  "screen.record",
  "calendar.add",
  "contacts.add",
  "reminders.add",
];

export function applyNonInteractiveGatewayConfig(
  params: ApplyNonInteractiveGatewayConfigParams,
): ApplyNonInteractiveGatewayConfigResult | null {
  const { nextConfig, opts, runtime, defaultPort } = params;
  let config = nextConfig;

  // Port
  const port = opts.gatewayPort ?? defaultPort;
  if (!Number.isFinite(port) || port <= 0) {
    runtime.error(`Invalid gateway port: ${port}`);
    runtime.exit(1);
    return null;
  }

  // Bind
  let bind: GatewayBind = opts.gatewayBind ?? "loopback";
  const validBindModes: GatewayBind[] = ["loopback", "lan", "auto", "custom", "tailnet"];
  if (!validBindModes.includes(bind)) {
    runtime.error(`Invalid --gateway-bind "${bind}" (use: ${validBindModes.join(", ")})`);
    runtime.exit(1);
    return null;
  }

  // Custom bind host validation
  let customBindHost: string | undefined;
  if (bind === "custom") {
    customBindHost = nextConfig.gateway?.customBindHost;
    if (!customBindHost) {
      runtime.error(
        "Custom bind mode requires gateway.customBindHost in config or --gateway-bind with a custom IP",
      );
      runtime.exit(1);
      return null;
    }
  }

  // Tailscale
  const tailscaleMode: TailscaleMode = opts.tailscale ?? "off";
  const validTailscaleModes: TailscaleMode[] = ["off", "serve", "funnel"];
  if (!validTailscaleModes.includes(tailscaleMode)) {
    runtime.error(
      `Invalid --tailscale "${tailscaleMode}" (use: ${validTailscaleModes.join(", ")})`,
    );
    runtime.exit(1);
    return null;
  }

  // Safety: Tailscale requires bind=loopback
  if (tailscaleMode !== "off" && bind !== "loopback") {
    runtime.error("Tailscale serve/funnel requires --gateway-bind=loopback");
    runtime.exit(1);
    return null;
  }

  // Auth mode
  let authMode: GatewayAuthChoice | "none" = opts.gatewayAuth ?? "token";
  const validAuthModes = ["token", "password"];
  if (!validAuthModes.includes(authMode)) {
    runtime.error(`Invalid --gateway-auth "${authMode}" (use: token, password)`);
    runtime.exit(1);
    return null;
  }

  // Safety: Tailscale funnel requires password auth
  if (tailscaleMode === "funnel" && authMode !== "password") {
    runtime.error("Tailscale funnel requires --gateway-auth=password");
    runtime.exit(1);
    return null;
  }

  // Gateway token or password
  let gatewayToken: string | undefined;

  if (authMode === "token") {
    if (opts.gatewayToken) {
      gatewayToken = normalizeGatewayTokenInput(opts.gatewayToken) || randomToken();
    } else {
      gatewayToken = config.gateway?.auth?.token || randomToken();
    }

    config = {
      ...config,
      gateway: {
        ...config.gateway,
        auth: {
          ...config.gateway?.auth,
          mode: "token",
          token: gatewayToken,
        },
      },
    };
  } else if (authMode === "password") {
    if (!opts.gatewayPassword && !config.gateway?.auth?.password) {
      runtime.error("Password auth requires --gateway-password");
      runtime.exit(1);
      return null;
    }

    const password = opts.gatewayPassword || config.gateway?.auth?.password || "";
    config = {
      ...config,
      gateway: {
        ...config.gateway,
        auth: {
          ...config.gateway?.auth,
          mode: "password",
          password,
        },
      },
    };
  }

  // Apply gateway config
  config = {
    ...config,
    gateway: {
      ...config.gateway,
      port,
      bind,
      ...(bind === "custom" && customBindHost ? { customBindHost } : {}),
      tailscale: {
        ...config.gateway?.tailscale,
        mode: tailscaleMode,
        resetOnExit: opts.tailscaleResetOnExit ?? false,
      },
    },
  };

  // Apply default dangerous command denylist if this is a new setup
  const hasExistingGatewayConfig = Boolean(
    nextConfig.gateway?.port || nextConfig.gateway?.bind || nextConfig.gateway?.auth?.mode,
  );

  if (
    !hasExistingGatewayConfig &&
    config.gateway?.nodes?.denyCommands === undefined &&
    config.gateway?.nodes?.allowCommands === undefined &&
    config.gateway?.nodes?.browser === undefined
  ) {
    config = {
      ...config,
      gateway: {
        ...config.gateway,
        nodes: {
          ...config.gateway?.nodes,
          denyCommands: [...DEFAULT_DANGEROUS_NODE_DENY_COMMANDS],
        },
      },
    };
  }

  return {
    nextConfig: config,
    port,
    bind,
    authMode,
    gatewayToken,
    tailscaleMode,
  };
}
