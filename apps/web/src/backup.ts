import type { ChildProfile } from "./profile";
import type { ProfileProgress } from "./progress";

export interface LocalBackupV1 {
  app: "mi-mundo-de-palabras";
  schemaVersion: 1;
  exportedAt: string;
  profiles: ChildProfile[];
  progress: Record<string, ProfileProgress>;
  activeProfileId: string | null;
}

const PROFILE_KEY = "mmdp.childProfiles.v1";
const ACTIVE_KEY = "mmdp.activeProfile.v1";
const PROGRESS_KEY = "mmdp-progress-v1";

export function createLocalBackup(): LocalBackupV1 {
  let profiles: ChildProfile[] = [];
  let progress: Record<string, ProfileProgress> = {};
  try { profiles = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]"); } catch {}
  try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch {}
  return {
    app: "mi-mundo-de-palabras",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profiles,
    progress,
    activeProfileId: localStorage.getItem(ACTIVE_KEY),
  };
}

export function downloadBackup() {
  const backup = createLocalBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mi-mundo-de-palabras-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function validateBackup(value: unknown): value is LocalBackupV1 {
  if (!value || typeof value !== "object") return false;
  const backup = value as Partial<LocalBackupV1>;
  return backup.app === "mi-mundo-de-palabras"
    && backup.schemaVersion === 1
    && Array.isArray(backup.profiles)
    && !!backup.progress
    && typeof backup.progress === "object";
}

export async function importBackup(file: File): Promise<LocalBackupV1> {
  const raw = await file.text();
  const parsed = JSON.parse(raw) as unknown;
  if (!validateBackup(parsed)) throw new Error("El archivo no es un respaldo válido de Mi Mundo de Palabras.");
  localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed.profiles));
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(parsed.progress));
  if (parsed.activeProfileId) localStorage.setItem(ACTIVE_KEY, parsed.activeProfileId);
  else localStorage.removeItem(ACTIVE_KEY);
  return parsed;
}
