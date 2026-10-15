# Mi Mundo de Palabras — instalación

Edición de prueba multiplataforma, 15 de octubre de 2026. Incluye el piloto visual revisado y guarda el progreso en cada dispositivo. Los paquetes nativos contienen las imágenes: pueden abrirse sin conexión desde el primer uso. La voz depende de las voces en español instaladas en el dispositivo; no se garantiza audio sin conexión en todos los equipos.

## Descargar el paquete correcto

Abre [Platform Packages en GitHub](https://github.com/lisaurymatoscontacto-dotcom/mi-mundo-de-palabras-definitivo/actions/workflows/platform-build.yml), entra en una ejecución verde y baja hasta **Artifacts**. Es necesario iniciar sesión en GitHub para descargar esos archivos. Descarga el artefacto de tu sistema; descomprime el ZIP exterior. Los artefactos tienen caducidad: conserva una copia local. La sección Actions muestra la fecha de expiración.

| Dispositivo | Artefacto | Qué contiene |
| --- | --- | --- |
| Teléfono/tableta Android, Android TV o Google TV | Android-y-Google-TV-APK | APK de prueba instalable |
| Windows Intel/AMD (64 bits) | Escritorio-win32-x64 | ZIP con ejecutable y archivos necesarios |
| Windows ARM (Snapdragon) | Escritorio-win32-arm64 | ZIP para ARM64 |
| Mac Intel | Escritorio-darwin-x64 | Aplicación .app dentro de tar.gz |
| Mac Apple Silicon (M1 o posterior) | Escritorio-darwin-arm64 | Aplicación .app dentro de tar.gz |
| Linux Intel/AMD (64 bits) | Escritorio-linux-x64 | Ejecutable dentro de tar.gz |
| Linux ARM64 | Escritorio-linux-arm64 | Ejecutable para ARM64 |
| iPhone/iPad: desarrollo | Apple-iOS-simulator-y-archivo-sin-firma | Simulador y archivo de dispositivo SIN FIRMA; no es un IPA instalable |
| Navegador/PWA | Web-PWA-para-alojamiento-HTTPS | Sitio compilado para alojar en HTTPS |

Los paquetes de escritorio no están firmados con un certificado comercial. El APK lleva firma de desarrollo. Son versiones de prueba para instalación directa; no están publicadas en Google Play, Microsoft Store ni App Store. Los archivos SHA256SUMS.txt permiten comprobar que la descarga no cambió.

## Android: teléfono o tableta

1. Descarga y extrae el artefacto Android-y-Google-TV-APK.
2. Envía el archivo mi-mundo-de-palabras-android-tv-preview.apk al teléfono o descárgalo allí.
3. Abre el APK desde Archivos. Si Android lo pide, permite **Instalar aplicaciones desconocidas** únicamente para la aplicación con la que lo estás abriendo.
4. Pulsa **Instalar**, después **Abrir**. Puedes retirar ese permiso al terminar.
5. Crea un perfil y prueba Leer y Escribir. Desactiva la conexión y comprueba que siguen apareciendo las imágenes.

Requiere Android 6 o posterior y un Android System WebView compatible y actualizado. Los dispositivos viejos pueden no admitir las funciones del navegador moderno aunque permitan instalar el APK. Si una actualización informa de firma incompatible, exporta primero el progreso desde Área de adultos, desinstala la versión anterior, instala la nueva e importa el respaldo. Las compilaciones de desarrollo pueden usar una firma distinta; no borres la versión anterior antes de guardar tus datos.

## Android TV y Google TV

1. Comprueba en **Ajustes → Información** que el sistema sea Android TV o Google TV. El APK no sirve para Tizen, webOS o tvOS.
2. Copia el mismo APK a una memoria USB o usa el método de transferencia de archivos que admita tu televisor.
3. Desde un administrador de archivos en el televisor, abre el APK y permite la instalación para ese administrador cuando se solicite.
4. Instala y busca **Mi Mundo de Palabras** en la lista de aplicaciones. El paquete incluye entrada para el menú de TV y un banner.
5. Usa las flechas para mover el foco, **OK/centro** para elegir y **Atrás** para volver. En el campo de nombre, abre el teclado del televisor con OK; también puedes conectar un teclado USB/Bluetooth.

Alternativa para una persona técnica con ADB: conecta el televisor mediante la depuración autorizada de su fabricante y ejecuta `adb install -r mi-mundo-de-palabras-android-tv-preview.apk`. No habilites depuración permanentemente después de instalar.

La compilación y las pruebas de teclado no sustituyen una prueba con el modelo concreto de televisor y su mando. Prueba primero crear perfil, Leer, Escribir, Atrás, reapertura y funcionamiento sin conexión.

## Windows

1. En Configuración → Sistema → Información comprueba si el procesador es x64 o ARM64.
2. Descarga el artefacto correspondiente y extrae el ZIP exterior y después Palabras-win32-....zip.
3. Conserva toda la carpeta extraída. Abre **mi-mundo-de-palabras.exe**; no necesita Node.js ni una instalación adicional.
4. Puedes crear un acceso directo al ejecutable en el escritorio. No copies únicamente el .exe: necesita los archivos de su carpeta.

Windows puede mostrar una advertencia de editor desconocido porque esta edición no tiene firma comercial. Verifica que procede del repositorio indicado y coincide con su SHA256. Si tu organización bloquea programas sin firma, usa la versión web en un alojamiento HTTPS autorizado. No cambies las políticas de seguridad de la organización.

## macOS

1. Menú Apple → Acerca de esta Mac: elige arm64 si dice Apple M1/M2/M3 o posterior; x64 si dice Intel.
2. Extrae el artefacto y el archivo Palabras-darwin-....tar.gz. Arrastra **Mi Mundo de Palabras.app** a Aplicaciones.
3. Ábrela. Al ser una edición sin notarizar, macOS puede bloquear la primera apertura. Si verificaste la procedencia, usa la opción de apertura permitida en Ajustes del Sistema → Privacidad y seguridad. No desactives Gatekeeper.
4. Para actualizar, cierra la aplicación y reemplaza el .app. Exporta primero el progreso como respaldo.

## Linux

1. Descarga x64 para Intel/AMD o arm64 para equipos ARM de 64 bits.
2. Extrae el ZIP y después el tar.gz, conservando sus permisos de ejecución.
3. Abre el archivo **mi-mundo-de-palabras** de la carpeta extraída.
4. Si el entorno no permite abrirlo con doble clic, ejecútalo desde una terminal en esa carpeta: `./mi-mundo-de-palabras`.

Requiere un escritorio gráfico y las bibliotecas de Chromium/Electron de tu distribución. Si el aislamiento de procesos está restringido, usa la PWA en un navegador compatible o pide al administrador que configure la instalación. No ejecutes la aplicación como root ni desactives su sandbox.

## iPhone e iPad

### Opción de uso cotidiano: web instalable

Necesitas que el paquete Web-PWA esté alojado en una dirección HTTPS. Este repositorio y los paquetes descargables no constituyen por sí mismos una dirección web publicada.

1. Abre la dirección HTTPS de la aplicación en Safari.
2. Pulsa Compartir → **Añadir a pantalla de inicio** → Añadir.
3. Abre el icono nuevo. En el primer uso mantén la conexión hasta que la aplicación y sus imágenes terminen de descargarse.
4. Prueba el modo avión después de esa primera carga. Safari puede borrar datos locales cuando falta espacio; conserva respaldos del progreso.

### Aplicación nativa: firma necesaria

El archivo iOS-Device-UNSIGNED.tar.gz es una compilación de dispositivo sin firma. **No se instala tocándolo en un iPhone y no es un IPA distribuible.** Para instalar nativamente hay que usar un Mac con Xcode, una cuenta Apple, un equipo de firma y el dispositivo registrado, o preparar TestFlight/App Store con Apple Developer.

Para preparar la instalación de desarrollo desde el código:

1. Descarga el repositorio de la misma revisión con que se generaron los paquetes. Instala Node.js 22.12 o posterior, Xcode y CocoaPods.
2. En la carpeta del proyecto ejecuta: `npm ci`, `npm run build`, `npx cap add ios`, `npx cap sync ios`.
3. Abre ios/App/App.xcworkspace en Xcode. Selecciona App → Signing & Capabilities, tu Team y un identificador de aplicación disponible para tu cuenta.
4. Conecta el iPhone/iPad, selecciónalo como destino y pulsa Run. Acepta la confianza y activa el modo de desarrollador cuando iOS lo solicite.
5. Para distribuir a otras personas, usa el proceso de Archive/Distribute de Xcode y TestFlight. La firma y los perfiles de aprovisionamiento dependen de la cuenta del propietario.

Para probar sin iPhone: extrae iOS-Simulator.tar.gz en un Mac con Xcode, inicia un simulador compatible y ejecuta `xcrun simctl install booted /ruta/App.app`. Es un paquete de simulador; no sirve para hardware real. La arquitectura debe coincidir con el simulador disponible.

## Samsung, LG, Apple TV y otros televisores

- **Samsung Tizen / LG webOS:** el APK Android no es compatible. Usa un PC conectado por HDMI, un dispositivo Android TV/Google TV con el APK, o la versión web publicada si el navegador del televisor es compatible. La navegación web puede necesitar teclado; no se afirma compatibilidad con todos los mandos.
- **Apple TV:** Capacitor no genera aquí una app tvOS. Usa AirPlay desde un dispositivo compatible o un ordenador por HDMI. El control sigue realizándose en el dispositivo de origen.
- **TV sin sistema inteligente:** conecta un PC o dispositivo Android TV/Google TV por HDMI.

No se incluyen paquetes nativos Tizen (.wgt), webOS (.ipk) ni tvOS. Requieren proyectos y pruebas específicos; esta entrega no los presenta como instaladores existentes.

## Publicar la versión web / instalar como PWA en PC

Para la persona que aloja la aplicación: extrae Web-PWA y publica su contenido en la **raíz de un sitio HTTPS**, con index.html como entrada. No publiques dentro de una subcarpeta: las rutas actuales empiezan en /. Configura index.html, sw.js y /content/*.json para revalidar; los archivos con hash pueden almacenarse en caché. No abras index.html directamente desde el explorador de archivos.

Con una dirección HTTPS operativa, en Chrome/Edge abre la aplicación y utiliza **Instalar aplicación** en el menú o en la barra de direcciones. En Safari compatible puede usarse **Añadir al Dock**. En navegadores sin instalación PWA, se puede usar como sitio web. La primera carga necesita conexión; el contenido local se guarda para el uso posterior sin conexión.

Para probar localmente desde el código: `npm ci`, `npm run build`, `npm run preview --workspace @mmdp/web` y abre http://localhost:4173. La excepción de seguridad para localhost solo vale en ese equipo; acceder por la IP de la red sin HTTPS no equivale a instalar una PWA offline.

## Fotos en las cartas

Las fotos e ilustraciones se muestran completas, centradas dentro de un marco circular verde. El encuadre se ajusta a la proporción de cada archivo para conservar el objeto entero. Los emojis mantienen su presentación. Este formato también se aplica a las vistas de escritura y al álbum.

## Modo Historias

En la pantalla principal, entra en **Historias**. Hay 16 relatos originales: dos por cada una de las ocho etapas. Se ofrecen las historias de la etapa alcanzada y las anteriores. Puedes cambiar el tamaño de la letra, escuchar una página si el dispositivo tiene voz española disponible, volver a leer y responder preguntas de comprensión. El botón Atrás del mando o Escape vuelve a la biblioteca.

Las historias proponen valores y conocimientos mediante situaciones cotidianas y preguntas para conversar. La dificultad es orientativa y se recomienda acompañamiento adulto, especialmente al inicio. Son contenido original del piloto con revisión editorial; su validación por un especialista en pedagogía queda pendiente. Están incluidas localmente en cada paquete.

## Progreso, actualizaciones y comprobación

El progreso está separado entre la aplicación de escritorio, la PWA, Android y cada navegador. No se sincroniza automáticamente solo por instalar. Antes de cambiar de plataforma, usa **Área de adultos** para exportar una copia y luego importarla en el destino. Guarda el archivo fuera de la carpeta de la aplicación.

Después de instalar, comprueba: crear un perfil; abrir Leer; revelar una carta; escuchar si hay voz española disponible; abrir Escribir y seleccionar letras; cerrar/reabrir; verificar progreso; abrir sin conexión. En TV, repite con el mando.

Estas versiones conservan el piloto de contenido actual. La compilación correcta no convierte automáticamente el catálogo pedagógico ampliado en contenido aprobado.

## Referencias de instalación

- [Android TV: entrada en el launcher, banner y pantalla táctil opcional](https://developer.android.com/training/tv/get-started/create)
- [Capacitor 7: entorno de desarrollo](https://capacitorjs.com/docs/v7/getting-started/environment-setup)
- [Apple: añadir una web a la pantalla de inicio del iPhone](https://support.apple.com/guide/iphone/turn-a-website-into-an-app-iph42ab2f3a7/ios)
- [Apple: abrir apps de desarrolladores identificados y protección de macOS](https://support.apple.com/en-us/102445)
