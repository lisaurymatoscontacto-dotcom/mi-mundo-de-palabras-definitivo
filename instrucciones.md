# INSTRUCCIONES — HANDOFF MAESTRO DE `MI MUNDO DE PALABRAS`

> **Documento de transferencia técnica y de producto para el siguiente agente.**
>
> Este archivo debe leerse **antes de modificar el proyecto**. Resume el objetivo del producto, la arquitectura actual, las decisiones ya tomadas, la migración del repositorio, la nueva progresión, el banco masivo de vocabulario, el pipeline híbrido de assets, los cambios de UI/TV, el estado real de CI, el trabajo ya completado, el trabajo que estaba en curso y los pasos exactos que faltan.
>
> **Fecha del handoff:** 2026-10-16  
> **Repositorio activo:** `lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo`  
> **Rama de trabajo:** `main`  
> **HEAD inmediatamente antes de crear este documento:** `255d4bd3db9ec7bae81803e54203ccaf5a41a25d`  
> **CI normal en ese HEAD:** `SUCCESS` (`CI` run #204).  
> Crear este archivo genera un commit posterior; por eso el SHA anterior debe tratarse como el snapshot técnico que se verificó antes del handoff.

---

## 1. LEER PRIMERO — ESTADO EJECUTIVO

`Mi Mundo de Palabras` es una aplicación educativa infantil en español, pensada aproximadamente para edades de 4 a 10 años, enfocada en:

- vocabulario;
- lectura inicial;
- asociación palabra ↔ imagen;
- escritura y ortografía básica;
- repetición pedagógica controlada;
- progresión temática comprensible para niños y padres;
- funcionamiento offline con recursos locales;
- soporte Web/PWA, Android móvil, Android TV/Google TV y Windows.

El producto ya no debe considerarse un simple prototipo de 24 palabras. La arquitectura fue ampliada para soportar un banco maestro grande y una progresión temática real.

### Estado actual resumido

- El repositorio original fue migrado a esta cuenta/repo nuevo y el desarrollo continuó aquí.
- La antigua progresión global y repetitiva fue rediseñada.
- El banco maestro llegó a **4,200 posiciones temáticas**.
- Se verificó un mínimo de **3,561 grafías/palabras únicas reales**, cumpliendo el objetivo solicitado de **3,500–5,000 palabras**.
- Existen **12 mundos temáticos**.
- La arquitectura actual permite aproximadamente **22 capítulos por mundo** y **66 bloques de 4 capítulos**.
- Cada capítulo debe tener **20 cartas**.
- Capítulos avanzados normalmente usan **16 palabras nuevas + 4 palabras de repaso**.
- Los primeros **48 capítulos** están publicados y validados: capítulos 1–4 de los 12 mundos.
- El CI permanente verifica hoy `--chapters=48`.
- Se comenzó el capítulo 5.
- El informe objetivo actual de capítulo 5 muestra **27/64 conceptos listos (42.2%)** para el primer bloque de capítulo 5: Animales 5, Casa 5, Comida 5 y Naturaleza 5.
- El CI normal del proyecto está verde en el snapshot verificado.
- Quedaron **dos workflows temporales fallidos/obsoletos** que deben limpiarse o reemplazarse; el fallo de esos workflows NO significa que el código base esté roto.

### Regla de oro

**Una palabra = un concepto claro = una representación visual inequívoca.**

No se debe aprobar un emoji o una foto solo porque “se parece”. Si el emoji no representa exactamente el concepto, usar una foto legal clara. Si tampoco existe una foto suficientemente clara y legal, el concepto permanece fuera del runtime hasta resolverlo.

---

## 2. REPOSITORIOS, MIGRACIÓN E HISTORIAL

### Repositorio activo

`lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo`

Este es el repositorio donde debe continuar todo el desarrollo.

### Repositorio histórico de origen

`KEYGEN-RD/mi-mundo-de-palabras`

No borrar, reescribir ni dañar el repositorio histórico. Parte del historial nativo de PR/issues quedó allí.

### Trabajo histórico importante

El pipeline híbrido de assets nació en:

- rama histórica: `feat/hybrid-asset-pipeline-v2`
- PR histórico: `KEYGEN-RD/mi-mundo-de-palabras#48`

La discusión nativa del PR no se migró como objeto de GitHub, pero el código útil fue incorporado/migrado al repositorio nuevo.

### Ramas visibles en el repositorio nuevo

En checkouts recientes de Actions se han visto, entre otras:

- `main`
- `feat/hybrid-asset-pipeline-v2`
- `migration/pr-48-snapshot`
- ramas Dependabot para Capacitor/Vitest.

No eliminar ramas históricas o de migración sin revisar si contienen información útil.

---

## 3. ARQUITECTURA DEL PROYECTO

Es un monorepo npm workspaces.

### `apps/web`

Frontend principal:

- React;
- Vite;
- PWA/offline;
- integración Capacitor;
- UI de aprendizaje;
- perfiles;
- navegación TV;
- runtime de contenido aprobado.

### `apps/sync-api`

API de sincronización familiar/perfiles.

### `packages/core`

Contiene la lógica central:

- modelos educativos;
- banco de vocabulario;
- currículo;
- progresión;
- assets;
- reglas de publicación;
- mundos;
- colas/editorial content.

### Empaquetado de escritorio

Windows se empaqueta con Electron/@electron/packager.

### Android

Capacitor Android.

### Android TV / Google TV

El mismo APK se diseñó para funcionar también en TV, incluyendo soporte de launcher/Leanback y navegación con D-pad.

### iOS/Apple

Existe infraestructura Capacitor iOS, pero **el usuario explícitamente no quiere priorizar Apple ahora mismo**. No gastar tiempo ahí salvo que el usuario reabra esa prioridad.

---

## 4. SCRIPTS IMPORTANTES DE `package.json`

Los scripts verificados en el snapshot del handoff incluyen:

```text
dev
build
typecheck
test
sync-api:start
sync-api:check
sync-api:smoke
content:assets:validate
content:assets:files
content:assets:publish
content:assets:queue
content:assets:import
content:assets:review
content:curriculum:verify
content:enrich:aoa
content:enrich:syllables
content:manifest:assets
content:build:lexicon
content:publish
cap:add:android
cap:add:ios
cap:sync
cap:android
cap:ios
desktop:package
platform:icons
content:stories:validate
```

El contrato de currículo actual es:

```text
content:curriculum:verify = tsx scripts/verify-published-curriculum.ts --chapters=48
```

**No subir este número a 52 hasta que Animales 5, Casa 5, Comida 5 y Naturaleza 5 estén completamente publicables y jugables.**

Node requerido:

```text
>=22.12
```

Dependencias/herramientas importantes vistas en el snapshot:

- Capacitor 7.4.3;
- Electron 44.7.2;
- @electron/packager 20.3.0;
- Playwright 1.64.1;
- Sharp 0.35.5;
- Vitest 3.2.4;
- tsx;
- silabacion.

---

## 5. LOS 12 MUNDOS TEMÁTICOS

El producto usa exactamente estos 12 mundos/categorías principales:

1. Animales
2. Casa
3. Comida
4. Naturaleza
5. Cuerpo
6. Ropa
7. Transporte
8. Escuela
9. Juguetes
10. Océano
11. Espacio
12. Granja

IDs internos históricos/principales:

```text
animals
home
food
nature
body
clothes
transport
school
toys
ocean
space
farm
```

**Regla de producto:** el mundo temático NO determina la dificultad pedagógica por sí solo.

---

## 6. PROBLEMA DE PROGRESIÓN ORIGINAL QUE YA SE CORRIGIÓ

La progresión anterior tenía problemas graves:

- 48 “niveles globales” que no pertenecían realmente a temas;
- sesión fija de 10 cartas;
- si un tema tenía menos de 10 palabras válidas, el código rellenaba repitiendo palabras en círculo;
- podía ocurrir que dos palabras se repitieran durante casi toda una sesión;
- completar cualquier sesión podía subir el nivel global aunque se repitiera el mismo tema;
- grandes rangos de niveles compartían el mismo límite de dificultad;
- el usuario terminaba niveles y no veía contenido nuevo;
- la app todavía dependía demasiado del antiguo piloto de 24 palabras.

Eso explicaba el comportamiento reportado por el usuario: completar “Lectura” sin desbloqueos claros y repetir las mismas dos palabras una y otra vez.

---

## 7. NUEVA PROGRESIÓN TEMÁTICA

La progresión fue rediseñada alrededor de capítulos temáticos visibles.

Ejemplo conceptual:

```text
Animales 1
Casa 1
Comida 1
Naturaleza 1
...
Animales 2
Casa 2
...
Animales 3
...
```

### Tamaño de capítulo

**20 cartas exactas por capítulo.**

No volver a 10 salvo una decisión explícita de producto.

### Capítulo 1

Normalmente 20 palabras nuevas.

### Capítulos posteriores

Normalmente:

```text
16 nuevas + 4 repaso = 20
```

La lógica puede redistribuir ligeramente si hace falta para cerrar un capítulo final, pero nunca debe rellenar mediante repetición accidental.

### Repetición permitida

Solo repetición pedagógica deliberada.

No repetir porque faltan palabras.

### Desbloqueo por bloques

La progresión visible se organizó en bloques de 4 capítulos.

Primer bloque:

```text
Animales 1
Casa 1
Comida 1
Naturaleza 1
```

Al completar ese bloque se abre:

```text
Cuerpo 1
Ropa 1
Transporte 1
Escuela 1
```

Luego:

```text
Juguetes 1
Océano 1
Espacio 1
Granja 1
```

Después el ciclo vuelve con capítulo 2.

### Progreso por modo

La arquitectura nueva contempla progreso separado por modo/habilidad:

- Leer
- Escribir
- Mixto

La progresión global vieja debe considerarse compatibilidad/legado, no el modelo principal de futuro.

---

## 8. BANCO MAESTRO DE PALABRAS

El usuario pidió explícitamente **3,500–5,000 palabras**.

La arquitectura se amplió a:

- **4,200 posiciones temáticas**;
- **≥3,561 grafías/palabras únicas reales verificadas**.

Esto cumple el rango solicitado.

### Importante: “banco maestro” NO significa “todo está publicado”

No se deben volcar 3,500+ términos directamente al runtime.

Una palabra solo entra al juego cuando tiene:

1. definición editorial/carta;
2. mundo/categoría;
3. dificultad;
4. asset local válido;
5. licencia/procedencia;
6. revisión visual;
7. estado aprobado;
8. pruebas/validaciones exitosas.

### Colisión de IDs ya corregida

Se detectó una colisión entre:

- MONO
- MOÑO

porque la normalización eliminaba la distinción de `Ñ`.

La generación de slug/ID fue corregida para preservar una forma inequívoca (`ñ` no debe colapsar como simple `n`; se utilizó una estrategia equivalente a `ny` donde corresponde).

No revertir esa corrección.

---

## 9. ESTADO PUBLICADO DEL CURRÍCULO

### Capítulos 1–4

**COMPLETOS en los 12 mundos.**

Esto equivale a los primeros:

```text
48 capítulos consecutivos
```

El CI permanente los verifica actualmente.

Al cerrar capítulo 4 se alcanzó aproximadamente:

- 816 assets aprobados;
- 1 asset deliberadamente rechazado (`SUPERNOVA`).

Commit importante de cierre de capítulo 4:

```text
c4349569...  feat: complete chapter-four curriculum
```

### SUPERNOVA

Se rechazó deliberadamente el candidato porque mostraba el remanente (por ejemplo la Nebulosa del Cangrejo), no el evento “supernova” en sí.

**No reintroducirlo como aprobado sin una representación verdaderamente correcta.**

---

## 10. CAPÍTULO 5 — ESTADO REAL ACTUAL

Archivo autoritativo:

```text
content/audits/chapter-five-readiness.json
```

Snapshot revisado antes de este handoff:

```text
total_concepts: 64
ready_concepts: 27
ready_percent: 42.2
cards_published: 27
assets_publishable: 27
```

### Por mundo

```text
Animales 5   4 / 16 listos
Casa 5       6 / 16 listos
Comida 5     7 / 16 listos
Naturaleza 5 10 / 16 listos
------------------------------
TOTAL        27 / 64
```

**Este informe es más importante que cualquier cifra histórica escrita en commits antiguos.**

### Animales 5 — listos conocidos

- BURRO
- TEJÓN
- ALCE
- CIERVO

### Animales 5 — pendientes vistos en el audit

- COMADREJA
- HURÓN
- TOPO
- PUMA
- JAGUAR
- GUEPARDO
- LINCE
- PANTERA
- ANTÍLOPE
- GACELA
- ÑU
- RENO

El archivo de audit debe usarse para confirmar la lista exacta si cambia el branch.

### Casa 5 — listos conocidos

- COLCHÓN — foto
- TOALLA — foto
- NEVERA — foto
- ARMARIO — foto
- CUADRO — emoji
- HORNO — foto

### Casa 5 — pendientes actuales del audit

- PISO
- TECHO
- PATIO
- BAÑO
- COCINA
- ESTUFA
- ALMOHADA
- SÁBANA
- CORTINA
- LÁMPARA

### Comida 5 — listos vistos

Entre los conceptos listos están:

- YUCA
- LENTEJA
- PAPAYA
- PESCADO
- SALCHICHA
- HARINA
- otro concepto aprobado/publicado ya incluido por el audit actual.

### Comida 5 — pendientes vistos

- CEREAL
- YOGUR
- MANDARINA
- TORONJA
- LIMA
- GUAYABA
- MARACUYÁ
- GRANADA
- CIRUELA
- cualquier otro que el audit actual marque `ready: false`.

### Naturaleza 5

El audit actual marca:

```text
10 / 16 listos
```

Usar `content/audits/chapter-five-readiness.json` para la lista exacta de los 6 faltantes.

### Distinción crítica

Un asset aprobado **no basta** para que un concepto esté “listo”.

La regla del audit es:

> un concepto está listo solo cuando existen una carta editorial explícitamente publicada **y** un asset local aprobado/publicable.

Por eso el número de assets aprobados puede ser mayor que el número de conceptos `ready` de capítulo 5.

---

## 11. PIPELINE HÍBRIDO DE ASSETS

Tipos admitidos:

```text
emoji
photo
custom
missing
```

Estados de revisión:

```text
approved
pending_review
rejected
missing
```

Licencias modeladas:

```text
CC-BY-4.0
CC0-1.0
PUBLIC-DOMAIN
OWNED
UNKNOWN
```

### Campos principales de un AssetRecord

El modelo central incluye campos equivalentes a:

```text
id
word
normalized_word
category
world
difficulty
asset_type
asset_path
source
source_url
download_url
author
license
attribution_required
attribution_text
verified
downloaded_at
review_status
emoji_unicode
thumbnail_path
notes
```

`canPublishAsset()` es una protección central. No saltarla.

---

## 12. TWEMOJI

Se utiliza jdecked/Twemoji mantenido, con licencia CC-BY 4.0.

Revisión fijada/pinned:

```text
b6b55fef1e8636b540a6d016a4729ca8cdf2e60b
```

Los SVG se materializan localmente.

### Corrección Unicode importante

Se endureció la resolución de nombres de archivo Twemoji para manejar:

- variation selector `FE0F`;
- secuencias compuestas;
- casos como `☀️`;
- casos con género/secuencia como `🧜‍♀️`.

No volver a una implementación que asuma un solo codepoint simple.

---

## 13. FOTOS / WIKIMEDIA / LICENCIAS

Preferencia del proyecto:

1. Public Domain;
2. CC0;
3. solo otras licencias permisivas si hay una razón explícita y compatible.

### Flujo correcto

1. encontrar candidato;
2. verificar fuente individual;
3. verificar licencia;
4. descargar;
5. convertir a WebP local;
6. crear thumbnail;
7. registrar procedencia;
8. dejar `pending_review`;
9. revisar claridad visual;
10. aprobar explícitamente;
11. publicar metadata;
12. validar archivos;
13. tests/typecheck/build.

### Regla

**Nunca autoaprobar una foto ambigua.**

### Optimización histórica

Aproximadamente:

- imagen principal: máximo ~900×900, WebP quality ~82;
- miniatura: ~320×320, quality ~76.

---

## 14. FOTOS DE CAPÍTULO 5 YA REVISADAS/APROBADAS

Archivo:

```text
content/asset-reviews/chapter-five-photos.json
```

Estado actual:

```text
approved
```

Contiene un lote de 25 fotos con trazabilidad fuerte:

- `selected_title` exacto;
- `source_url`;
- `download_url`;
- autor;
- licencia;
- `asset_path`;
- `thumbnail_path`;
- SHA-256 local/original;
- SHA-1 canónico de Commons en la versión final del flujo;
- `visual_review: approved`;
- nota de revisión.

Entre ellas:

### Casa

- NEVERA
- CAFETERA
- MICROONDAS
- LAVADORA
- SARTÉN

### Comida

- PESCADO
- SALCHICHA
- HUMMUS
- CHURRO

### Naturaleza

Incluye recursos como:

- LAGO
- ARENA
- BOSQUE
- CUEVA
- CASCADA
- VALLE
- SELVA
- PRADO
- ACANTILADO
- CAÑÓN
- GLACIAR
- ICEBERG
- CRÁTER
- GEISER
- BARRO
- CUARZO

Consultar el JSON para el inventario exacto de las 25.

---

## 15. LECCIÓN IMPORTANTE: HASH DE THUMBNAILS DE COMMONS

Durante la aprobación de fotos se encontró un problema real:

- los thumbnails de Wikimedia Commons pueden ser re-encodificados;
- el contenido visual puede seguir siendo el mismo;
- el SHA-256 binario del thumbnail remoto puede cambiar.

Un verificador ingenuo byte-a-byte falló, por ejemplo, con `naturaleza.bosque`.

La solución correcta fue endurecer la verificación usando:

- título exacto de Commons;
- licencia exacta;
- SHA-1 canónico del archivo fuente de Commons;
- hashes exactos de nuestros WebP/thumbnail locales;
- comparación/validación visual del upstream cuando el thumbnail se recodifica.

**No volver a usar solo el SHA-256 de un thumbnail generado por Wikimedia como identidad canónica del recurso.**

---

## 16. APROXIMACIONES VISUALES PROHIBIDAS / LECCIONES

No reintroducir estas asociaciones:

- `VASO -> 🥛` — incorrecto; el emoji representa leche/bebida, no un vaso vacío.
- `MAR -> 🌊` — demasiado ambiguo para “mar”.
- `PLATO -> emoji de comida` — no equivale a plato vacío.
- `CABEZA -> 🗣️` — incorrecto.
- `ESTÓMAGO -> 🫃` — incorrecto.
- `SUBMARINO -> 🛥️` — incorrecto.
- `GOMA -> 🧽` — incorrecto.
- `SUPERNOVA -> remanente/nebula` — explícitamente rechazado.
- planetas/objetos espaciales no deben representarse con círculos genéricos solo por color.
- no usar el mismo cohete para conceptos espaciales distintos.

### Ejemplo positivo

`VASO` finalmente usa una foto CC0 clara (`File:Drinkware.jpg`) y no el emoji ambiguo.

---

## 17. RUNTIME Y OFFLINE

Reglas de runtime implementadas:

- el catálogo aprobado es autoritativo;
- `pending_review`, `rejected` y `missing` bloquean fallback inseguro;
- fotos/custom aprobados usan archivos locales `/content/...`;
- emojis aprobados usan SVG local mediante `visualAssetPath`;
- si falta catálogo, evitar depender silenciosamente de imágenes remotas;
- tests offline fueron corregidos para aplicar la misma lógica autoritativa del runtime, no conteos hard-coded antiguos.

Archivos importantes:

```text
apps/web/src/runtimeContent.ts
apps/web/src/offlineMedia.ts
apps/web/src/CardVisual.tsx
apps/web/src/contentCatalog.ts
apps/web/src/assetCredits.ts
```

---

## 18. UI / MÓVIL / ESCRITURA / TV — REDISEÑO YA HECHO

El usuario reportó:

- emojis/fotos demasiado grandes;
- imágenes tapando las letras;
- en escritura, imagen tapando o compitiendo con el área de respuesta;
- en TV, cartas tan grandes que no cabían completas.

### Causa detectada

Había visuales de hasta aproximadamente 310 px y tarjetas con `min-height` cercanas a 570 px, incompatibles con un layout de TV 16:9 de referencia ~960×540dp.

### Cambios aplicados

- agregado/importado `responsive-learning.css`;
- imágenes más pequeñas en lectura;
- reducción todavía mayor en escritura;
- el área de escritura pasa a ser protagonista;
- layout específico de TV;
- safe area aproximada ~5%;
- escalado de tarjetas/encabezados/espacios;
- TV detectada por `MMDP-TV` o parámetro `?tv` y `data-tv="true"`;
- navegación TV/D-pad mediante `tvNavigation`.

### Archivos a revisar

```text
apps/web/src/main.tsx
apps/web/src/responsive-learning.css
apps/web/src/tvNavigation.ts
apps/web/src/App.tsx
apps/web/src/CardVisual.tsx
```

### Pendiente

Se necesita seguir haciendo QA en dispositivos reales, especialmente:

- móvil Android;
- Android TV/Google TV;
- modo Escribir;
- lectura a distancia;
- foco D-pad;
- scroll/foco al cambiar de tarjeta.

No encoger toda la app indiscriminadamente si un solo screen falla: ajustar el contexto específico.

---

## 19. PLATAFORMAS Y EMPAQUETADO

Prioridades actuales del usuario:

1. Android móvil
2. Android TV / Google TV
3. Web/PWA
4. Windows x64
5. Apple/iOS: **no prioritario**

### Android + TV

Actualmente se usa el mismo APK para móvil y Android TV/Google TV.

Se verificó soporte de launcher TV/Leanback en builds anteriores.

### Sideload TV

Puede instalarse sin Play Store mediante:

- USB + administrador de archivos;
- instalación de APK con permiso de fuentes desconocidas;
- ADB.

No sirve para Samsung Tizen ni LG webOS.

### Play Protect

El APK de desarrollo/debug puede ser bloqueado por Play Protect.

Para distribución real debe prepararse una **release firmada** con keystore apropiado.

### Windows

Empaquetado Electron x64.

Entregar carpeta completa en ZIP, no solo el `.exe` aislado.

### Web/PWA

Debe servirse por HTTPS; no asumir que abrir `index.html` por `file://` equivale al PWA real.

### Builds entregados anteriormente

Se entregaron al usuario versiones de prueba con nombres como:

```text
Mi-Mundo-de-Palabras-Android-TV-v2.apk
Mi-Mundo-de-Palabras-Windows-x64-v2.zip
Mi-Mundo-de-Palabras-Web-PWA-v2.zip
```

Esos archivos estaban en un sandbox de conversación, no deben tratarse como release canónica del repo. Generar nuevos artefactos desde `main` cuando corresponda.

---

## 20. ESTADO DE CI ACTUAL

### CI normal

En el snapshot inmediatamente anterior a este documento:

```text
SHA: 255d4bd3db9ec7bae81803e54203ccaf5a41a25d
CI run #204: SUCCESS
```

Esto confirma que el código base, catálogo, tests y verificaciones normales están saludables.

### Workflow temporal roto 1

Archivo:

```text
.github/workflows/approve-chapter-five-photos-v2.yml
```

Resultado reciente:

```text
FAILURE
```

Causa exacta:

```text
Error [ERR_MODULE_NOT_FOUND]
Cannot find module ... scripts/approve-chapter-five-photos.ts
```

La razón es que el helper original fue eliminado después de una aprobación exitosa, pero posteriormente se dejó un workflow `v2` que intenta volver a llamarlo.

**Acción recomendada:** eliminar este workflow temporal. Las 25 fotos ya aparecen aprobadas en `content/asset-reviews/chapter-five-photos.json`; no hay razón para reaprobarlas.

### Workflow temporal roto 2

Archivo:

```text
.github/workflows/stage-chapter-five-home-nature-missing.yml
```

Helper temporal asociado visto en el repo:

```text
scripts/stage-chapter-five-home-nature-missing.ts
```

Objetivo: intentar staged photos para 16 conceptos faltantes de Casa/Naturaleza.

Falló en:

```text
No legal bitmap candidate for table lamp isolated photograph
```

correspondiente a `casa.lampara`.

### Lo más importante de ese intento

Aunque algunas coincidencias eran legales, varias eran pedagógicamente malas:

- BAÑO -> interior/pintura histórica del Palacio de Invierno;
- COCINA -> pintura/interior artístico;
- ALMOHADA -> obra de arte japonesa;
- SÁBANA -> fotografía histórica no centrada en el objeto;
- CORTINA -> pintura/interior;
- etc.

Por tanto, **NO reparar el workflow simplemente relajando la búsqueda**.

La estrategia correcta es:

- fijar/pinear archivos exactos CC0/PD visualmente limpios por palabra;
- o usar un emoji solo si Unicode representa exactamente el concepto;
- nunca “primer resultado legal = aprobado”.

Si se reemplaza este workflow, borrar luego el workflow/helper temporal viejo para no seguir disparando jobs inútiles.

---

## 21. HISTORIAL IMPORTANTE DE CAPÍTULO 5

### Aprobación de fotos

Commit importante:

```text
863e54b6...  feat: approve chapter-five photo candidates
```

El lote de 25 fotos quedó aprobado con verificación canónica de Commons.

### Primera ola real

Commit:

```text
1cfe490341ddd463dd062fab3bf86d3f45aa831d
feat: publish first real chapter-five concepts
```

Publicó:

- 15 fotos ya revisadas;
- 5 Twemoji exactos.

Los 5 emojis fueron:

```text
animales.burro   🫏
animales.tejon   🦡
animales.alce    🫎
animales.ciervo  🦌
casa.cuadro      🖼️
```

### Segunda ola/refinamiento

Commit importante:

```text
13aa36aa...
feat: publish chapter-five refinement wave two
```

Llevó la preparación objetiva a:

```text
27 / 64 = 42.2%
```

### Intento posterior

Se intentó staged de conceptos restantes de Casa/Naturaleza, pero falló en LÁMPARA y no hizo commit parcial de esos resultados.

No asumir que los resultados temporales de ese job están en `main`.

---

## 22. CONTEOS DE ASSETS — CÓMO INTERPRETARLOS

Al cerrar capítulo 4:

```text
~816 approved
1 rejected
```

Después se aprobaron 25 fotos de capítulo 5:

```text
~841 approved
1 rejected
```

Después la primera ola añadió 5 Twemoji nuevos:

```text
~846 approved
1 rejected
```

La segunda ola principalmente publicó cartas sobre recursos ya aprobados, por lo que el conteo de readiness creció sin necesariamente agregar el mismo número de assets.

**No usar estas cifras históricas como verdad eterna.**

Para cualquier nueva operación, calcular los conteos directamente desde:

```text
content/assets.catalog.json
```

---

## 23. ARCHIVOS CLAVE — LEER ANTES DE MODIFICAR

### Raíz

```text
package.json
THIRD_PARTY_ASSETS.md
THIRD_PARTY_NOTICES.md
instrucciones.md
```

### Contenido

```text
content/assets.catalog.json
content/asset-reviews/chapter-five-photos.json
content/audits/chapter-five-readiness.json
content/asset-reviews/*.webp
```

`content/assets.catalog.json` es el catálogo editorial canónico.

La copia publicada para frontend se genera en:

```text
apps/web/public/content/assets.catalog.json
```

No editar manualmente la copia generada si existe un script de publicación; editar la fuente canónica y regenerar.

### Core

Revisar especialmente:

```text
packages/core/src/assets.ts
packages/core/src/worlds.ts
packages/core/src/curriculum.ts
packages/core/src/curriculum-priorities.ts
packages/core/src/curriculum-progress.ts
packages/core/src/candidate.words.ts
packages/core/src/index.ts
packages/core/src/asset-queue.ts
packages/core/src/publishable-runtime.ts
```

### Web

```text
apps/web/src/App.tsx
apps/web/src/main.tsx
apps/web/src/runtimeContent.ts
apps/web/src/offlineMedia.ts
apps/web/src/CardVisual.tsx
apps/web/src/contentCatalog.ts
apps/web/src/assetCredits.ts
apps/web/src/responsive-learning.css
apps/web/src/tvNavigation.ts
```

### Scripts

```text
scripts/import-assets.ts
scripts/materialize-curriculum-block.ts
scripts/review-assets.ts
scripts/validate-asset-catalog.ts
scripts/validate-asset-files.ts
scripts/publish-asset-metadata.ts
scripts/queue-missing-assets.ts
scripts/verify-published-curriculum.ts
scripts/build-candidate-lexicon.ts
scripts/enrich-syllables.ts
scripts/enrich-aoa.ts
scripts/stage-chapter-five-home-nature-missing.ts   # TEMPORAL / revisar
```

### Workflows

```text
.github/workflows/ci.yml
.github/workflows/platform-build.yml
.github/workflows/mobile-build.yml
.github/workflows/approve-chapter-five-photos-v2.yml       # OBSOLETO/ROTO
.github/workflows/stage-chapter-five-home-nature-missing.yml # TEMPORAL/ROTO
```

---

## 24. VALIDACIONES QUE DEBEN CORRER DESPUÉS DE BLOQUES IMPORTANTES

Como mínimo:

```bash
npm ci
npm test
npm run typecheck
npm run content:stories:validate
npm run sync-api:check
npm run sync-api:smoke
npm run content:assets:validate
npm run content:assets:files
npm run content:curriculum:verify
npm run content:assets:publish
npm run build
npm run content:enrich:aoa
npm run content:enrich:syllables
npm run content:manifest:assets
npm run content:build:lexicon
npm run content:publish
```

Para bloques de infraestructura/release también validar Docker:

```bash
docker build -t mi-mundo-de-palabras:ci .
docker build -t mi-mundo-de-palabras-sync:ci -f apps/sync-api/Dockerfile .
```

No considerar un bloque terminado solo porque “compila”.

---

## 25. SEGURIDAD / `npm audit`

`npm ci` ha reportado históricamente vulnerabilidades en dependencias de desarrollo:

```text
3 vulnerabilities
1 moderate
2 critical
```

Pero el audit de producción:

```bash
npm audit --omit=dev --audit-level=high
```

ha pasado sin vulnerabilidades high de producción en CI anteriores.

No ejecutar `npm audit fix --force` a ciegas: puede saltar a majors y romper Capacitor/Electron/Vitest.

Hay ramas Dependabot disponibles; revisar cambios y pruebas antes de fusionar.

---

## 26. PRÓXIMOS PASOS — ORDEN RECOMENDADO

### PRIORIDAD 0 — limpiar automatizaciones temporales

1. borrar `approve-chapter-five-photos-v2.yml` porque ya no sirve y falla por helper inexistente;
2. reemplazar o retirar `stage-chapter-five-home-nature-missing.yml` y su helper;
3. confirmar que solo quedan workflows deliberados.

### PRIORIDAD 1 — completar los 37 conceptos faltantes del primer bloque de capítulo 5

Objetivo actual:

```text
64 total
27 ready
37 faltantes
```

Distribución:

```text
Animales:   faltan 12
Casa:       faltan 10
Comida:     faltan 9
Naturaleza: faltan 6
```

Para cada palabra:

1. comprobar que la palabra/ID existe en el banco;
2. comprobar que no existe ya otro asset/carta válida;
3. emoji solo si es exacto;
4. si no, buscar **fuente exacta** CC0/PD;
5. pinnear título/file concreto;
6. descargar y materializar local;
7. registrar autor/licencia/fuente;
8. generar thumbnail;
9. marcar `pending_review`;
10. revisar visualmente;
11. aprobar explícitamente;
12. crear/publicar la carta editorial;
13. regenerar metadata;
14. ejecutar tests/typecheck/build;
15. regenerar audit.

### PRIORIDAD 2 — llegar a 64/64

Recalcular:

```text
content/audits/chapter-five-readiness.json
```

No avanzar a publicar bloque 49–52 hasta:

```text
ready_concepts = 64
ready_percent = 100
```

### PRIORIDAD 3 — publicar capítulos 49–52

Cuando el bloque esté completo:

```text
Animales 5
Casa 5
Comida 5
Naturaleza 5
```

Cada capítulo debe poder producir:

```text
20 cartas = 16 nuevas + 4 repaso
```

sin relleno accidental.

Entonces sí:

```text
content:curriculum:verify --chapters=52
```

### PRIORIDAD 4 — continuar capítulo 5

Siguiente bloque:

```text
Cuerpo 5
Ropa 5
Transporte 5
Escuela 5
```

Después:

```text
Juguetes 5
Océano 5
Espacio 5
Granja 5
```

### PRIORIDAD 5 — continuar capítulo 6 en adelante

Mantener patrón:

```text
16 nuevas + 4 repaso
```

hasta agotar el banco útil y aprobado.

---

## 27. DEFINICIÓN DE “DONE” PARA UN BLOQUE DE CURRÍCULO

Un bloque NO está terminado hasta cumplir todo:

- todas las palabras objetivo existen en el banco;
- no hay duplicados accidentales;
- cada nueva palabra tiene visual inequívoco;
- cada asset tiene procedencia/licencia;
- cada foto está local/offline;
- cada foto fue revisada explícitamente;
- cada asset está `approved`;
- cada carta editorial está publicada;
- cada capítulo da exactamente 20 cartas;
- las 4 cartas de repaso son intencionales;
- no existe relleno por repetición;
- el verificador de currículo pasa;
- tests pasan;
- typecheck pasa;
- build pasa;
- catálogo y archivos pasan validación;
- el audit objetivo refleja el nuevo estado;
- no quedan workflows temporales huérfanos.

---

## 28. LO QUE NO SE DEBE HACER

1. No volver al sistema de 10 cartas.
2. No rellenar sesiones repitiendo palabras porque falten conceptos.
3. No usar un “nivel global” como única progresión.
4. No publicar las 3,500–5,000 palabras de golpe.
5. No autoaprobar fotos ambiguas.
6. No aceptar el primer resultado de Wikimedia solo porque la licencia es legal.
7. No usar emojis aproximados.
8. No introducir assets remotos como dependencia normal del runtime final.
9. No editar la copia publicada del catálogo ignorando la fuente canónica.
10. No subir el contrato de capítulos de CI antes de que el bloque sea verdaderamente jugable.
11. No ignorar pruebas offline.
12. No gastar tiempo en iOS/Apple ahora salvo petición explícita del usuario.
13. No asumir que un workflow global rojo significa que Android/Web/Windows fallaron; inspeccionar jobs individuales.
14. No ejecutar `npm audit fix --force` sin evaluar breaking changes.
15. No borrar el repositorio histórico o ramas de migración.

---

## 29. PLATFORM PACKAGES — ADVERTENCIA SOBRE EL ESTADO ROJO

En varias ejecuciones, `Platform Packages` puede aparecer `failure` aunque algunas plataformas útiles hayan construido correctamente.

Históricamente:

- Android/TV pasó;
- Web pasó;
- Windows x64 pasó;
- Apple/macOS/iOS puede cancelar o fallar y dejar el workflow completo rojo.

Como el usuario no quiere Apple ahora, una mejora razonable es refactorizar el workflow para:

- excluir Apple por defecto;
- o hacer Apple opcional/manual;
- o separar workflow Apple del resto.

No romper Android/TV/Web/Windows intentando “arreglar” Apple.

---

## 30. MIGRACIÓN DE UI PARA TV — CRITERIOS

Para TV mantener:

- orientación horizontal;
- navegación D-pad;
- foco visible;
- tarjetas completas dentro del viewport;
- margen seguro exterior;
- texto legible desde lejos;
- no demasiadas tarjetas por fila;
- no heredar ciegamente escala de móvil.

Para modo escritura:

- la imagen debe ser referencia secundaria;
- letras/casillas deben tener prioridad visual;
- imagen nunca encima de las letras;
- evitar scroll extraño al enfocar inputs en Android/TV.

---

## 31. DOCUMENTOS LEGALES

Mantener actualizados:

```text
THIRD_PARTY_ASSETS.md
THIRD_PARTY_NOTICES.md
```

Twemoji requiere atribución CC-BY 4.0.

Para fotos PD/CC0 preservar igualmente fuente/procedencia en metadata aunque no sea estrictamente obligatorio atribuir en todos los casos.

---

## 32. COMMIT LANDMARKS ÚTILES

Estos commits sirven como puntos de referencia históricos:

```text
c4349569...  feat: complete chapter-four curriculum
863e54b6...  feat: approve chapter-five photo candidates
1cfe490341ddd463dd062fab3bf86d3f45aa831d  feat: publish first real chapter-five concepts
13aa36aa...  feat: publish chapter-five refinement wave two
255d4bd3db9ec7bae81803e54203ccaf5a41a25d  chore: rerun guarded chapter-five photo approval with canonical verification
```

Usar `git log` para ver SHAs completos cuando sea necesario.

---

## 33. RECOMENDACIÓN PARA EL NUEVO AGENTE — PRIMEROS 30 MINUTOS

Antes de escribir código:

```bash
git status
git log -10 --oneline
npm ci
npm test
npm run typecheck
npm run content:assets:validate
npm run content:assets:files
npm run content:curriculum:verify
npm run build
```

Después leer:

```text
instrucciones.md
content/audits/chapter-five-readiness.json
content/asset-reviews/chapter-five-photos.json
content/assets.catalog.json
packages/core/src/curriculum.ts
packages/core/src/curriculum-priorities.ts
packages/core/src/curriculum-progress.ts
scripts/materialize-curriculum-block.ts
.github/workflows/ci.yml
```

Luego limpiar los workflows temporales y continuar los 37 conceptos faltantes.

---

## 34. PRINCIPIO DE TRABAJO QUE DEBE CONSERVARSE

El usuario prefiere que el agente:

- trabaje de forma autónoma;
- agrupe pasos repetitivos y seguros;
- no pregunte por cada microdecisión;
- se detenga solo ante un bloqueo real, riesgo de pérdida de datos, problema legal/licencia o decisión importante de producto;
- ejecute validaciones al terminar cada bloque;
- corrija fallos y continúe;
- no declare “terminado” algo que solo compila.

---

## 35. OBJETIVO A MEDIO PLAZO

Llegar a una aplicación donde:

- los 12 mundos reaparezcan en capítulos progresivos;
- haya entre 3,500 y 5,000 palabras útiles en el banco;
- el usuario vea una progresión entendible;
- cada capítulo tenga 20 cartas;
- las repeticiones sean pedagógicas;
- cada visual sea exacto;
- todos los recursos estén disponibles offline;
- la app funcione bien en móvil, TV, Web y Windows;
- cada asset tenga trazabilidad legal;
- el sistema pueda seguir creciendo por bloques sin scripts ad-hoc desechables cada vez.

---

## 36. NOTA FINAL PARA EL SIGUIENTE AGENTE

Este documento describe el estado verificado al momento del handoff. Si al leerlo `main` contiene commits posteriores, **no confíes ciegamente en cifras estáticas**. Recalcula el estado desde las fuentes autoritativas:

```text
content/audits/chapter-five-readiness.json
content/assets.catalog.json
content/asset-reviews/*.json
package.json
.github/workflows/*.yml
```

La prioridad inmediata no es “meter más palabras por volumen”; es terminar bien el primer bloque de capítulo 5, limpiar automatizaciones temporales, alcanzar 64/64 con assets correctos y después publicar 49–52.

El proyecto ya tiene una base mucho más sólida que el prototipo inicial. La regla que debe protegerse por encima de todo es:

> **No sacrificar claridad pedagógica, legalidad ni estabilidad solo para aumentar el contador de contenido.**
