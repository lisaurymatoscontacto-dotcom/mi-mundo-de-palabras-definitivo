import { useRef, useState } from "react";
import { AssetCredits } from "./AssetCredits";
import { downloadBackup, importBackup } from "./backup";
import { loadProductionCards } from "./contentCatalog";
import { clearOfflineCardMedia, prefetchCardMedia } from "./offlineMedia";
import { loadActiveProfileId, loadProfiles } from "./profile";
import { HttpSyncProvider } from "./sync";
import { synchronize } from "./syncCoordinator";
import { clearFamilySyncSettings, loadFamilySyncSettings, saveFamilySyncSettings } from "./syncSettings";
import "./parent-data.css";

export function ParentDataControls() {
  const fileRef = useRef<HTMLInputElement>(null);
  const initialSync = loadFamilySyncSettings();
  const [message, setMessage] = useState("");
  const [syncEndpoint, setSyncEndpoint] = useState(initialSync.endpoint);
  const [syncToken, setSyncToken] = useState(initialSync.accessToken);
  const [syncing, setSyncing] = useState(false);
  const [downloadingOffline, setDownloadingOffline] = useState(false);

  async function handleImport(file?: File) {
    if (!file) return;
    try {
      await importBackup(file);
      setMessage("Respaldo restaurado correctamente. Recargando…");
      window.setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo importar el respaldo.");
    }
  }

  async function downloadOfflineContent() {
    const activeId = loadActiveProfileId();
    const profile = activeId ? loadProfiles().find((entry) => entry.id === activeId) : undefined;
    if (!profile) {
      setMessage("Selecciona primero el perfil del niño.");
      return;
    }
    setDownloadingOffline(true);
    setMessage("Preparando contenido sin conexión…");
    try {
      const cards = await loadProductionCards(profile.region);
      if (!cards.length) {
        setMessage("Todavía no hay cartas de producción aprobadas para descargar. El piloto sigue funcionando sin conexión.");
        return;
      }
      const result = await prefetchCardMedia(cards);
      setMessage(`Contenido offline listo: ${result.cached} de ${result.requested} archivos de imagen/audio disponibles en este dispositivo.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la descarga offline.");
    } finally {
      setDownloadingOffline(false);
    }
  }

  async function clearOfflineContent() {
    const cleared = await clearOfflineCardMedia();
    setMessage(cleared ? "Contenido multimedia offline eliminado de este dispositivo." : "No había contenido multimedia offline guardado.");
  }

  async function syncNow() {
    const endpoint = syncEndpoint.trim().replace(/\/$/, "");
    const accessToken = syncToken.trim();
    if (!endpoint || !accessToken) {
      setMessage("Escribe la dirección del servicio familiar y la clave de sincronización.");
      return;
    }
    setSyncing(true);
    setMessage("Sincronizando…");
    try {
      saveFamilySyncSettings({ endpoint, accessToken });
      const result = await synchronize(new HttpSyncProvider(endpoint, accessToken));
      if (result.direction === "remote-to-local") {
        setMessage("Progreso más reciente descargado. Recargando…");
        window.setTimeout(() => window.location.reload(), 450);
      } else if (result.direction === "local-to-remote") {
        setMessage("Progreso guardado en la sincronización familiar.");
      } else setMessage("Todo está sincronizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  function disconnectSync() {
    clearFamilySyncSettings();
    setSyncEndpoint("");
    setSyncToken("");
    setMessage("Sincronización familiar desconectada de este dispositivo.");
  }

  return (
    <>
      <section className="parent-details parent-data-controls">
        <h2>Datos y contenido offline</h2>
        <p>Guarda una copia del progreso o descarga las ilustraciones y pronunciaciones aprobadas para usar la app sin internet.</p>
        <div className="parent-data-actions">
          <button className="secondary" type="button" onClick={downloadBackup}>⬇️ Exportar respaldo</button>
          <button className="secondary" type="button" onClick={() => fileRef.current?.click()}>⬆️ Restaurar respaldo</button>
          <button className="secondary" type="button" disabled={downloadingOffline} onClick={() => void downloadOfflineContent()}>{downloadingOffline ? "Descargando…" : "📦 Descargar contenido offline"}</button>
          <button className="secondary" type="button" disabled={downloadingOffline} onClick={() => void clearOfflineContent()}>🧹 Liberar contenido offline</button>
        </div>
        <input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => { void handleImport(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      </section>

      <section className="parent-details family-sync-controls">
        <h2>Sincronización familiar</h2>
        <p>Opcional. Permite compartir progreso entre dispositivos cuando un adulto configura el servicio familiar.</p>
        <label className="sync-field">Dirección del servicio<input type="url" value={syncEndpoint} onChange={(event) => setSyncEndpoint(event.target.value)} placeholder="https://sync.ejemplo.com" autoComplete="url" /></label>
        <label className="sync-field">Clave familiar<input type="password" value={syncToken} onChange={(event) => setSyncToken(event.target.value)} placeholder="Clave privada del adulto" autoComplete="off" /></label>
        <div className="parent-data-actions">
          <button className="primary" type="button" disabled={syncing} onClick={() => void syncNow()}>{syncing ? "Sincronizando…" : "☁️ Sincronizar ahora"}</button>
          {(initialSync.endpoint || syncEndpoint || syncToken) && <button className="secondary" type="button" disabled={syncing} onClick={disconnectSync}>Desconectar</button>}
        </div>
        <p className="privacy-note">La clave queda solo en este dispositivo. No forma parte del perfil infantil ni se incluye en los respaldos.</p>
      </section>

      {message && <p className="data-message parent-status" role="status">{message}</p>}

      <AssetCredits />

      <section className="parent-details privacy-summary">
        <h2>Privacidad infantil</h2>
        <ul>
          <li><strong>Sin micrófono en V1:</strong> esta versión no escucha, graba ni almacena la voz del niño.</li>
          <li><strong>Local por defecto:</strong> perfiles y progreso funcionan en el dispositivo incluso sin conexión.</li>
          <li><strong>Sin publicidad ni seguimiento de terceros:</strong> la experiencia infantil no incorpora anuncios ni rastreadores publicitarios.</li>
          <li><strong>Sincronización bajo control adulto:</strong> solo se activa cuando el adulto configura un servicio y una clave familiar.</li>
          <li><strong>Descarga offline bajo control adulto:</strong> los medios de producción se guardan localmente solo cuando el adulto lo solicita y pueden borrarse desde aquí.</li>
        </ul>
        <p className="privacy-note">Este resumen describe el comportamiento técnico de la V1; antes de una publicación comercial se revisarán también los avisos y requisitos legales de cada tienda y jurisdicción.</p>
      </section>
    </>
  );
}
