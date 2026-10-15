# Política de medios — Mi Mundo de Palabras

La app usa dos representaciones principales para enseñar vocabulario:

1. **Emoji revisado** cuando el concepto es claro, directo e inequívoco.
2. **Fotografía real** cuando el emoji no existe, es ambiguo, demasiado estilizado o puede enseñar el concepto incorrecto.

La regla pedagógica es: **1 palabra = 1 concepto claro = 1 visual no ambiguo**.

## Emoji consistente y redistribuible

El carácter Unicode se conserva como significado/fallback. Para evitar que un mismo concepto cambie demasiado entre Windows, Android, iOS o TV, los conceptos revisados pueden usar una copia local del SVG correspondiente de **Twemoji**, cuya obra gráfica se distribuye bajo **CC BY 4.0**.

Solo se empaquetan los SVG realmente necesarios. Cada uno queda registrado en `content/assets.catalog.json` y la atribución se muestra desde el Área de adultos.

Si un emoji todavía no ha sido revisado/materializado, la app puede mostrar temporalmente el carácter Unicode durante desarrollo; eso no convierte el visual en aprobado para producción.

## Fotografías

La selección automática de fotografías acepta únicamente:

- **Public Domain / Dominio Público**;
- **CC0 1.0**.

No se aceptan automáticamente fotos con licencias desconocidas, editoriales, no comerciales, con restricciones de redistribución ni imágenes encontradas mediante buscadores generales.

El importador consulta metadatos de licencia de la página/servicio fuente, descarga el original o una derivada adecuada, genera WebP optimizado y thumbnail, registra procedencia y deja siempre el resultado como `pending_review`.

**Una licencia válida no implica aprobación pedagógica.** Ninguna fotografía se aprueba automáticamente.

## Estados editoriales

Todo asset usa uno de estos estados:

- `approved`: revisado, verificable y listo para la app;
- `pending_review`: obtenido o propuesto, pero todavía no aprobado por claridad pedagógica;
- `rejected`: no debe usarse;
- `missing`: no existe todavía una representación segura.

Cuando ninguna representación es clara, se usa `missing`; nunca se inventa una asociación incorrecta. Ejemplo: `VASO` no debe representarse con 🥛 porque el símbolo comunica leche/bebida y no un vaso genérico.

## Procedencia obligatoria

El registro central `content/assets.catalog.json` conserva como mínimo:

- palabra e identificador;
- categoría y mundo;
- tipo y ruta local;
- fuente y URL fuente;
- autor/procedencia;
- licencia;
- si exige atribución y texto correspondiente;
- verificación;
- fecha de descarga;
- estado de revisión.

Las reglas de cada licencia viven en `content/licenses.json`. Los avisos humanos viven en `THIRD_PARTY_ASSETS.md` y `THIRD_PARTY_NOTICES.md`.

## Offline y rendimiento

Los assets aprobados de producción deben ser locales. La app no debe depender de hotlinks externos durante una sesión infantil.

Las fotografías se guardan como WebP en tamaños razonables (piloto: máximo aproximado de 900×900) y se genera un thumbnail pequeño para vistas de colección. Los originales remotos no se empaquetan salvo que exista una razón editorial concreta para conservarlos.

## Criterio de aprobación

Antes de aprobar un visual se responde:

**¿Un niño podría identificar inmediatamente la palabra mirando solamente esta imagen?**

Si no es claramente sí, el asset permanece `pending_review`, se rechaza o vuelve a `missing`.

Ejemplo: `GATO → 🐱` es apropiado. `MESA → 🪑` no lo es; MESA requiere una fotografía inequívoca de una mesa.
