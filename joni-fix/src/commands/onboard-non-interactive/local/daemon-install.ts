import type { OpenClawConfig } from "../../../config/config.js";
import type { RuntimeEnv } from "../../../runtime.js";
import type { OnboardOptions } from "../../onboard-types.js";
import { resolveGatewayService } from "../../../daemon/service.js";
import { buildGatewayInstallPlan } from "../../daemon-install-helpers.js";

export async function installGatewayDaemonNonInteractive(params: {
  nextConfig: OpenClawConfig;
  opts: OnboardOptions;
  runtime: RuntimeEnv;
  port: number;
  gatewayToken: string | undefined;
}): Promise<void> {
  const { nextConfig, opts, runtime, port, gatewayToken } = params;

  if (!opts.installDaemon) {
    return;
  }

  const daemonRuntime = opts.daemonRuntime ?? "node";
  const warnings: string[] = [];

  const { programArguments, workingDirectory, environment } = await buildGatewayInstallPlan({
    env: process.env,
    port,
    token: gatewayToken,
    runtime: daemonRuntime,
    warn: (message) => {
      if (!opts.json) {
        runtime.log(message);
      }
      warnings.push(message);
    },
    config: nextConfig,
  });

  const service = resolveGatewayService();

  try {
    await service.install({
      env: process.env,
      stdout: opts.json ? undefined : process.stdout,
      programArguments,
      workingDirectory,
      environment,
    });

    if (!opts.json) {
      runtime.log(`Gateway daemon installed (${daemonRuntime})`);
    }
  } catch (err) {
    runtime.error(`Gateway daemon install failed: ${String(err)}`);
    runtime.exit(1);
  }
}
