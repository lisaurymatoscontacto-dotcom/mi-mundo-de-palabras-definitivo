import { touchSyncClock } from "./syncClock";

export type Region = "latam" | "mx" | "caribbean" | "andine" | "southern-cone";

export type ChildProfile = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  region: Region;
  createdAt: string;
};

const STORAGE_KEY = "mmdp.childProfiles.v1";
const ACTIVE_KEY = "mmdp.activeProfile.v1";
export const ACTIVE_PROFILE_EVENT = "mmdp-active-profile-change";

export const AGE_OPTIONS = [4, 5, 6, 7, 8, 9, 10] as const;
export const AVATAR_OPTIONS: string[] = ["🦊", "🐼", "🐯", "🐰", "🐸", "🦁"];
export const REGION_OPTIONS: { value: Region; label: string }[] = [
  { value: "latam", label: "Latinoamérica" },
  { value: "mx", label: "México" },
  { value: "caribbean", label: "Caribe" },
  { value: "andine", label: "Región Andina" },
  { value: "southern-cone", label: "Cono Sur" },
];

export function loadProfiles(): ChildProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<ChildProfile>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((profile) => ({
      id: profile.id || crypto.randomUUID(),
      name: profile.name || "Explorador",
      age: profile.age || 6,
      avatar: profile.avatar || AVATAR_OPTIONS[0],
      region: profile.region || "latam",
      createdAt: profile.createdAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: ChildProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  touchSyncClock();
}

export function createProfile(name: string, age: number, avatar: string, region: Region = "latam"): ChildProfile {
  return { id: crypto.randomUUID(), name: name.trim(), age, avatar, region, createdAt: new Date().toISOString() };
}

function notifyActiveProfileChange() {
  window.dispatchEvent(new Event(ACTIVE_PROFILE_EVENT));
}

export function setActiveProfileId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
  notifyActiveProfileChange();
}
export function loadActiveProfileId() { return localStorage.getItem(ACTIVE_KEY); }
export function clearActiveProfileId() {
  localStorage.removeItem(ACTIVE_KEY);
  notifyActiveProfileChange();
}
export function ageBand(age: number) { if (age <= 5) return "inicio"; if (age <= 7) return "base"; return "avance"; }
