type StateDirEnvSnapshot = {
  openclawStateDir: string | undefined;
  clawdbotStateDir: string | undefined;
};

export function snapshotStateDirEnv(): StateDirEnvSnapshot {
  return {
    openclawStateDir: process.env.JONI_STATE_DIR,
    clawdbotStateDir: process.env.JONI_STATE_DIR,
  };
}

export function restoreStateDirEnv(snapshot: StateDirEnvSnapshot): void {
  if (snapshot.joniStateDir === undefined) {
    delete process.env.JONI_STATE_DIR;
  } else {
    process.env.JONI_STATE_DIR = snapshot.joniStateDir;
  }
  if (snapshot.clawdbotStateDir === undefined) {
    delete process.env.JONI_STATE_DIR;
  } else {
    process.env.JONI_STATE_DIR = snapshot.clawdbotStateDir;
  }
}

export function setStateDirEnv(stateDir: string): void {
  process.env.JONI_STATE_DIR = stateDir;
  delete process.env.JONI_STATE_DIR;
}
