const KEY = "mmdp.familySync.v1";

export interface FamilySyncSettings {
  endpoint: string;
  accessToken: string;
}

export function loadFamilySyncSettings(): FamilySyncSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<FamilySyncSettings>;
    return {
      endpoint: typeof parsed.endpoint === "string" ? parsed.endpoint : "",
      accessToken: typeof parsed.accessToken === "string" ? parsed.accessToken : "",
    };
  } catch {
    return { endpoint: "", accessToken: "" };
  }
}

export function saveFamilySyncSettings(settings: FamilySyncSettings) {
  localStorage.setItem(KEY, JSON.stringify({
    endpoint: settings.endpoint.trim().replace(/\/$/, ""),
    accessToken: settings.accessToken.trim(),
  }));
}

export function clearFamilySyncSettings() {
  localStorage.removeItem(KEY);
}
