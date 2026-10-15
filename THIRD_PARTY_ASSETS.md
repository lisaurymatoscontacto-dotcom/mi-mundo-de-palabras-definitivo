# Third-party assets

Mi Mundo de Palabras keeps third-party media auditable and replaceable. The canonical machine-readable registry is `content/assets.catalog.json`; license policy lives in `content/licenses.json`.

## Rules

- Production media must be stored locally; published lessons must not hotlink external images.
- Automatic photo sourcing accepts only verified **CC0 1.0** or **Public Domain** media.
- Every photo keeps its source page, author/provenance, license, download timestamp and editorial review state.
- A legally reusable photo is **not automatically pedagogically approved**. New imports remain `pending_review` until an explicit editorial review confirms that one word maps to one unmistakable concept.
- Assets with uncertain provenance are not used. They remain `missing`/`needs_asset` until resolved.
- The runtime treats the central asset catalog as authoritative. A `missing`, `pending_review` or `rejected` record cannot silently fall back to an older ambiguous visual.
- CI checks both metadata and the actual local files behind usable records, including SVG/WebP type and photo thumbnail presence.

## Emoji set

The preferred consistent emoji artwork is **Twemoji** (`jdecked/twemoji`). Twemoji graphics are licensed under **CC BY 4.0**. Only the individual SVGs actually needed by approved concepts are bundled, keeping the application small and offline-friendly.

Imports are pinned to Twemoji revision `b6b55fef1e8636b540a6d016a4729ca8cdf2e60b` (v17.0.3) rather than a moving `main` reference. Source and download URLs in the asset catalog point to that immutable revision for reproducibility.

Attribution used by the app:

> Twemoji graphics © Twitter, Inc. and other contributors, licensed CC-BY 4.0.

Approved Twemoji concepts currently include the initial pilot (`GATO`, `PATO`, `VACA`, `LUNA`, `CASA`, `PAN`) plus the controlled second batch (`LOBO`, `RANA`, `MONO`, `NUBE`, `SOL`, `FLOR`, `CAMA`, `SOPA`, `PERA`, `UVA`, `TOMATE`, `QUESO`). Each selected concept was materialized first as `pending_review`, validated, and then approved through the explicit editorial review command.

The Unicode character remains in asset metadata as the semantic reference. Runtime rendering uses the approved local SVG `asset_path` directly, so adding a reviewed emoji does not require editing a hardcoded UI map.

## Approved pilot photos

The first photo pilot is materialized as local WebP + thumbnail and has passed explicit pedagogical review:

| Word | Source | Author / provenance | License | Status |
| --- | --- | --- | --- | --- |
| MESA | Wikimedia Commons — `File:Table, 17th century (CH 18493239).jpg` | Unknown artist · Cooper Hewitt, Smithsonian Design Museum | Public Domain | approved |
| RÍO | Wikimedia Commons — `File:River scene.jpg` | U.S. Fish and Wildlife Service | Public Domain | approved |
| PUERTA | Wikimedia Commons — `File:Door1.jpg` | Bachrach44 | Public Domain | approved |

The exact source URLs, download URLs, optimized local paths and download timestamps are stored in `content/assets.catalog.json`.

`VASO` is deliberately marked `missing`: the prior 🥛 visual represents milk/a drink and is not an unequivocal representation of a generic glass.

## Updating an asset

Do not edit application code to swap an image. Update or queue the relevant record in `content/assets.catalog.json`, materialize the file through the importer, keep the automatic result in `pending_review`, review it with `npm run content:assets:review`, and approve it only after the validation gates pass. This keeps pedagogy, provenance and licensing separate from UI implementation.
