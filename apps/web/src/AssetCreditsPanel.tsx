import { useEffect, useState } from "react";
import { loadAssetCredits, type AssetCredit } from "./assetCredits";

export function AssetCredits() {
  const [credits, setCredits] = useState<AssetCredit[]>([]);

  useEffect(() => {
    let active = true;
    void loadAssetCredits()
      .then((entries) => {
        if (active) setCredits(entries);
      })
      .catch(() => {
        if (active) setCredits([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!credits.length) return null;

  return (
    <section className="parent-details asset-credits">
      <h2>Créditos de imágenes</h2>
      <p>Recursos de terceros incluidos en la aplicación y su atribución correspondiente.</p>
      <ul>
        {credits.map((credit) => (
          <li key={credit.key}>
            {credit.sourceUrl
              ? <a href={credit.sourceUrl} target="_blank" rel="noreferrer">{credit.text}</a>
              : credit.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
