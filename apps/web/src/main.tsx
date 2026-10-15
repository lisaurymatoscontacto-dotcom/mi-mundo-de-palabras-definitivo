import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { applyRuntimeWordCatalog } from "@mmdp/core/runtime-catalog";
import { App } from "./App";
import { loadProductionCards } from "./contentCatalog";
import { ACTIVE_PROFILE_EVENT, loadActiveProfileId, loadProfiles } from "./profile";
import { enableTvNavigation } from "./tvNavigation";
import "./styles.css";
import "./extras.css";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

enableTvNavigation();

function RuntimeApp() {
  const [catalogVersion, setCatalogVersion] = useState(0);

  const refreshCatalog = useCallback(async () => {
    const activeId = loadActiveProfileId();
    const profile = activeId ? loadProfiles().find((entry) => entry.id === activeId) : undefined;
    const approvedCards = profile ? await loadProductionCards(profile.region) : [];
    applyRuntimeWordCatalog(approvedCards);
    setCatalogVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    void refreshCatalog();
    const onProfileChange = () => { void refreshCatalog(); };
    window.addEventListener(ACTIVE_PROFILE_EVENT, onProfileChange);
    window.addEventListener("storage", onProfileChange);
    return () => {
      window.removeEventListener(ACTIVE_PROFILE_EVENT, onProfileChange);
      window.removeEventListener("storage", onProfileChange);
    };
  }, [refreshCatalog]);

  return <App key={`catalog-${catalogVersion}`} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RuntimeApp />
  </React.StrictMode>
);
