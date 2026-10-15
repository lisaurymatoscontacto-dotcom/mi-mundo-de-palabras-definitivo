import type { ChildProfile } from "./profile";
import type { ProfileProgress } from "./progress";

export interface SyncSnapshot {
  profiles: ChildProfile[];
  progress: Record<string, ProfileProgress>;
  updatedAt: string;
  schemaVersion: 1;
}

export interface SyncProvider {
  pull(): Promise<SyncSnapshot | null>;
  push(snapshot: SyncSnapshot): Promise<void>;
}

export class SyncError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "SyncError";
  }
}

/**
 * Adaptador para el futuro backend de cuentas/familias.
 * Contrato esperado:
 *   GET  /snapshot -> SyncSnapshot | 204
 *   PUT  /snapshot <- SyncSnapshot
 * El token pertenece al adulto; nunca al perfil infantil.
 */
export class HttpSyncProvider implements SyncProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly accessToken: string,
  ) {}

  private headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  async pull(): Promise<SyncSnapshot | null> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/snapshot`, {
      method: "GET",
      headers: this.headers(),
    });
    if (response.status === 204 || response.status === 404) return null;
    if (!response.ok) throw new SyncError("No se pudo descargar el progreso.", response.status);
    return (await response.json()) as SyncSnapshot;
  }

  async push(snapshot: SyncSnapshot): Promise<void> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/snapshot`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(snapshot),
    });
    if (!response.ok) throw new SyncError("No se pudo guardar el progreso.", response.status);
  }
}

/** Usa el snapshot más reciente como regla de conflicto inicial. */
export function newestSnapshot(local: SyncSnapshot, remote: SyncSnapshot | null): SyncSnapshot {
  if (!remote) return local;
  return Date.parse(remote.updatedAt) > Date.parse(local.updatedAt) ? remote : local;
}

/** V1 sigue funcionando al 100% sin backend. */
export class NoopSyncProvider implements SyncProvider {
  async pull() { return null; }
  async push(_snapshot: SyncSnapshot) { return; }
}
