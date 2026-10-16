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

The exact approved set is intentionally derived from the machine-readable catalog instead of duplicated as a hand-maintained list here. The complete first two curriculum rounds plus the first two chapter-three blocks are now publishable: **32 chapters** across the twelve learning worlds. The canonical catalog contains **560 approved local asset records**; review slots deliberately reuse earlier approved concepts instead of duplicating files. Their local paths, source revision, license, review status and pedagogical difficulty are enforced by `content/assets.catalog.json` and CI. Later chapters remain locked until their own new concepts pass the same review gates.

The Unicode character remains in asset metadata as the semantic reference. Runtime rendering uses the approved local SVG `asset_path` directly, so adding a reviewed emoji does not require editing a hardcoded UI map.

## Approved pilot photos

The first photo pilot is materialized as local WebP + thumbnail and has passed explicit pedagogical review:

| Word | Source | Author / provenance | License | Status |
| --- | --- | --- | --- | --- |
| MESA | Wikimedia Commons — `File:Table, 17th century (CH 18493239).jpg` | Unknown artist · Cooper Hewitt, Smithsonian Design Museum | Public Domain | approved |
| RÍO | Wikimedia Commons — `File:River scene.jpg` | U.S. Fish and Wildlife Service | Public Domain | approved |
| PUERTA | Wikimedia Commons — `File:Door1.jpg` | Bachrach44 | Public Domain | approved |

The exact source URLs, download URLs, optimized local paths and download timestamps are stored in `content/assets.catalog.json`.

`VASO` now uses a reviewed photo of one empty drinking glass. The prior 🥛 visual remains unsuitable because it depicts milk/a drink.

## Updating an asset

Do not edit application code to swap an image. Update or queue the relevant record in `content/assets.catalog.json`, materialize the file through the importer, keep the automatic result in `pending_review`, review it with `npm run content:assets:review`, and approve it only after the validation gates pass. This keeps pedagogy, provenance and licensing separate from UI implementation.

## Completed pilot: MAR, PLATO and VASO (2026-10-15)

All 24 pilot concepts now have approved local visuals: 18 Twemoji SVGs and 6 photos.

| Word | Source page | Author | License | Visual review |
| --- | --- | --- | --- | --- |
| MAR | [Pixnio](https://pixnio.com/nature-landscapes/beaches/blue-horizon-water-nature-sky-summer-ocean-beach-sea-coast-landscape) | photo_collections | CC0 1.0 | Open sea, continuous horizon and visible surf; no river banks or dominant boats/people. |
| PLATO | [Pixnio](https://pixnio.com/objects/yellow-ceramic-plate) | Marcelo | CC0 1.0 | One complete empty yellow plate, with visible rim and surface, without food or cutlery. |
| VASO | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Drinkware.jpg) | rawpixel.com, via PxHere | CC0 1.0 | One complete empty transparent tumbler; no milk, handle or wine-glass stem. |

The individual source pages explicitly identify the image license as CC0; this does not rely on the generic licensing footer of a media site. Photos were staged as `pending_review`, validated and visually inspected at full and thumbnail sizes, then explicitly approved with `content:assets:review`. They retain the full frame without cropping, resized to at most 960×960 (thumbnail 320×320) and encoded as WebP. `content/asset-reviews/pilot-photos.json` records license verification, visual decisions, transformations, and SHA-256 fingerprints of the downloaded source and both local derivatives.

The runtime uses a bundled copy of the reviewed catalog when its network request fails. Editorial metadata is refreshed online and falls back to its local cache offline, preventing an old cached catalog from hiding newly reviewed photos. Static media remains cache-first. The milk, wave-only and plate-with-cutlery demo symbols cannot replace the reviewed pilot photos when metadata is unavailable.