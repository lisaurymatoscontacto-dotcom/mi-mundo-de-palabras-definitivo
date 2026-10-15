const SYNC_CLOCK_KEY = "mmdp.syncUpdatedAt.v1";

export function touchSyncClock(at = new Date().toISOString()) {
  localStorage.setItem(SYNC_CLOCK_KEY, at);
  return at;
}

export function readSyncClock() {
  return localStorage.getItem(SYNC_CLOCK_KEY) ?? new Date(0).toISOString();
}
