import type { ChildProfile } from "./profile";
import type { ProfileProgress } from "./progress";
import type { SyncProvider, SyncSnapshot } from "./sync";
import { newestSnapshot } from "./sync";
import { readSyncClock, touchSyncClock } from "./syncClock";

const PROFILE_KEY = "mmdp.childProfiles.v1";
const PROGRESS_KEY = "mmdp-progress-v1";

export interface SyncResult {
  direction: "local-to-remote" | "remote-to-local" | "equal";
  snapshot: SyncSnapshot;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function createSyncSnapshot(): SyncSnapshot {
  return {
    profiles: readJson<ChildProfile[]>(PROFILE_KEY, []),
    progress: readJson<Record<string, ProfileProgress>>(PROGRESS_KEY, {}),
    updatedAt: readSyncClock(),
    schemaVersion: 1,
  };
}

export function applySyncSnapshot(snapshot: SyncSnapshot) {
  if (snapshot.schemaVersion !== 1) throw new Error("Versión de sincronización no compatible.");
  localStorage.setItem(PROFILE_KEY, JSON.stringify(snapshot.profiles));
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(snapshot.progress));
  touchSyncClock(snapshot.updatedAt);
}

export async function synchronize(provider: SyncProvider): Promise<SyncResult> {
  const local = createSyncSnapshot();
  const remote = await provider.pull();
  const chosen = newestSnapshot(local, remote);

  if (!remote) {
    await provider.push(local);
    return { direction: "local-to-remote", snapshot: local };
  }

  if (chosen === remote) {
    applySyncSnapshot(remote);
    return { direction: "remote-to-local", snapshot: remote };
  }

  if (Date.parse(local.updatedAt) > Date.parse(remote.updatedAt)) {
    await provider.push(local);
    return { direction: "local-to-remote", snapshot: local };
  }

  return { direction: "equal", snapshot: local };
}
