# Mi Mundo de Palabras

Aplicación educativa gamificada para aprender a leer y escribir palabras en español latinoamericano, pensada para web/PWA, móviles y Smart TV.

## Experiencia V1

- **Lectura:** el niño ve la palabra; un adulto confirma `La leyó · Descubrir` y entonces se revela el visual, la recompensa y la pronunciación.
- **Escritura:** se muestra el visual y el niño ordena letras para formar la palabra.
- **Mixto:** alterna ambos retos.
- **Progreso:** 48 niveles en 8 etapas, con 10 encuentros por nivel; se requiere al menos 80% de aciertos para avanzar.
- **Repaso:** las palabras falladas reciben prioridad en sesiones posteriores.
- **Colección:** álbum, estrellas, cartas doradas y dominio por palabra.
- **Perfiles:** varios niños por familia, edad y variante regional del español.
- **Privacidad:** sin micrófono ni reconocimiento de voz en V1; local-first y sin publicidad/rastreadores de terceros.

## Estructura

- `apps/web`: React/Vite, PWA instalable, shell offline, navegación Smart TV, perfiles y experiencia infantil/adulta.
- `apps/sync-api`: servicio opcional de sincronización familiar mediante snapshots.
- `packages/core`: progresión, sesiones, lexicón, dificultad, mundos, regionalización y pipelines de contenido/assets.
- `content/assets.catalog.json`: registro canónico de visuales, procedencia, licencia y estado editorial.
- `content/licenses.json`: política central de licencias aceptadas.
- `scripts`: generación, importación y verificación editorial de contenido.
- `.github/workflows/mobile-build.yml`: genera APK Android Debug e iOS Simulator `.app` bajo demanda.

## Desarrollo

Requiere Node.js 20+.

```bash
npm install
npm run dev
```

Validación local:

```bash
npm run test
npm run typecheck
npm run content:assets:validate
npm run build
```

CI ejecuta además auditoría de dependencias runtime, publicación/verificación de metadata de assets, pipeline de contenido, smoke test del sync API y builds Docker.

## Contenido pedagógico

El repositorio mantiene un banco candidato de 384 palabras. Las palabras candidatas **no llegan automáticamente al niño**.

El pipeline combina:

- silabeo candidato;
- AoA cuando existe evidencia disponible;
- estructuras silábicas y rasgos ortográficos;
- dificultad provisional separada para lectura y escritura;
- variantes regionales y colisiones conceptuales;
- revisión editorial obligatoria.

Comandos:

```bash
npm run content:enrich:aoa
npm run content:enrich:syllables
npm run content:manifest:assets
npm run content:build:lexicon
npm run content:publish
```

`content/editorial-approvals.json` es el gate explícito de publicación. Para publicar una carta debe existir una aprobación editorial válida y también sus archivos físicos requeridos. El catálogo final se genera en `apps/web/public/content/lexicon.approved.json`.

## Sistema híbrido Emoji + Foto

La producción visual ya no depende de generar miles de ilustraciones IA. La regla principal es:

1. usar un emoji cuando el concepto sea inequívoco;
2. usar una foto cuando el emoji sea ambiguo o pedagógicamente inferior;
3. dejar `missing` si todavía no existe una representación segura.

Para consistencia entre plataformas, los emojis revisados pueden materializarse como SVG locales de **Twemoji** (CC BY 4.0). Las fotografías automáticas se restringen a **CC0 1.0** o **Dominio Público** con licencia verificable.

Estados de revisión:

```text
approved
pending_review
rejected
missing
```

Ninguna foto descargada por el importador se aprueba automáticamente.

Comandos del pipeline:

```bash
# Comprueba schema, procedencia, licencia y estados
npm run content:assets:validate

# Publica la metadata que usa la UI de créditos
npm run content:assets:publish

# Importa un lote pequeño; descarga/optimiza pero deja pending_review
npm run content:assets:import -- --limit=12

# Ejecución conservadora de prueba
npm run content:assets:import -- --dry-run --limit=5

# Conceptos concretos
npm run content:assets:import -- --ids=casa.mesa,naturaleza.rio
```

Las fotos se convierten a WebP de tamaño razonable y se genera thumbnail. El catálogo permite sustituir un visual editando datos y archivos, sin modificar la lógica de la aplicación.

Consulta también:

- `content/MEDIA_POLICY.md`
- `THIRD_PARTY_ASSETS.md`
- `THIRD_PARTY_NOTICES.md`

## Assets de producción

Rutas principales:

```text
apps/web/public/content/emoji/twemoji/*.svg
apps/web/public/content/photos/.../*.webp
apps/web/public/content/photos/.../*.thumb.webp
apps/web/public/content/audio/es-419/*.mp3
```

Los enlaces externos se conservan como procedencia/importación; un asset aprobado que necesita funcionar offline debe usar una ruta local.

## PWA y offline

La PWA precachea el shell real generado por Vite (HTML, CSS y JS con hash). Los medios de las cartas se cachean por separado.

Desde el Área de adultos se puede:

- exportar/restaurar respaldo;
- descargar contenido aprobado para uso sin conexión;
- liberar los medios descargados;
- consultar créditos de assets que requieren atribución;
- configurar sincronización familiar opcional.

La app sigue funcionando localmente aunque el servicio de sincronización no exista o no esté configurado.

## Sincronización familiar opcional

Ejemplo local:

```bash
cp apps/sync-api/.env.example apps/sync-api/.env
npm run sync-api:start
```

Variables principales:

- `MMDP_SYNC_TOKENS`: una o más claves familiares separadas por comas.
- `MMDP_SYNC_ORIGINS`: orígenes web permitidos.
- `MMDP_SYNC_DATA_DIR`: directorio de snapshots.
- `MMDP_SYNC_MAX_BYTES`: límite máximo por snapshot.

El servicio expone `GET/PUT /snapshot` y `GET /health`. La clave familiar queda bajo control adulto y no forma parte del perfil infantil ni de los respaldos.

## Android e iOS

Capacitor está configurado desde la raíz.

```bash
npm run cap:add:android
npm run cap:add:ios
npm run cap:sync
```

El workflow manual **Mobile Build** de GitHub Actions genera:

- APK Android Debug;
- aplicación iOS Simulator sin firma.

Publicar en Google Play o App Store todavía requiere identidad visual final, iconos de tienda y credenciales/firma correspondientes.

## Smart TV

La web incluye navegación espacial por flechas/control remoto sobre botones y campos visibles. Web/PWA sigue siendo la base compartida para TV; cualquier publicación específica de una tienda de Smart TV deberá validarse contra sus requisitos finales.

## Estado del contenido final

La arquitectura V1 conserva el banco piloto como fallback mientras `lexicon.approved.json` permanezca vacío. El nuevo catálogo de assets puede crecer de forma independiente y auditable sin obligar a publicar conceptos que todavía no hayan pasado revisión pedagógica, legal y editorial.
