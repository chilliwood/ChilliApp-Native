# ChilliApp — proyecto nativo (Capacitor)

Este es un repo **separado** de `chilliwood/Repositorio` (donde vive
`clienteschilli.html`/`admin.html` para Netlify) — a propósito, para que
nada de este proyecto (carpeta `android/`, `node_modules`, configuración de
Capacitor) se mezcle con el sitio que ya está en producción. Ya pasamos por
un problema real de archivos con el mismo nombre pisándose entre proyectos
— separar esto de entrada evita que se repita.

## Qué hay acá

- `www/index.html` — una **copia** de `clienteschilli.html`, con la
  integración de cámara nativa ya agregada (pantalla de teleprompter con la
  cámara real de Capacitor detrás, guion de ChilliApp encima).
- `www/chilliapp-camera.js` — el puente a los plugins nativos (cámara +
  compartir), ya compilado en un solo archivo. **No editar a mano** — se
  genera con esbuild a partir de `bridge-src.js` (ver más abajo).
- `bridge-src.js` — el código fuente real del puente a la cámara (este sí se
  edita, si en algún momento hay que cambiar cómo se graba).
- `android/` — el proyecto nativo de Android que genera Capacitor. No hace
  falta tocarlo a mano.
- `.github/workflows/build-android.yml` — compila un APK instalable
  automáticamente en cada push, sin que necesites Android Studio ni una
  compu con Linux/Windows/Mac especial.

## Cómo conseguir un APK para probar en tu Samsung

1. Crea un repo nuevo en GitHub (ej. `chilliwood/ChilliApp-Native`) y sube
   todo el contenido de esta carpeta **excepto `node_modules/`** (ya está
   en `.gitignore`, GitHub Actions lo reinstala solo).
2. Anda a la pestaña **Actions** del repo — el build debería empezar solo
   apenas subas los archivos (o tócalo a mano con "Run workflow").
3. Espera a que termine (unos 3-5 minutos la primera vez).
4. Entra al build terminado → sección **Artifacts**, abajo → descarga
   `chilliapp-debug-apk`.
5. Pásate ese `.apk` al Samsung (por WhatsApp, correo, cable, como
   prefieras) y ábrelo para instalar — Android va a pedirte permitir
   "instalar apps de fuentes desconocidas" la primera vez, es normal para
   un APK de prueba (no viene de Play Store todavía).

## Cuando actualices clienteschilli.html más adelante

Si le agregas o cambias algo a `clienteschilli.html` (el de siempre, para
Netlify) y quieres que esos cambios también estén en la app nativa:

1. Copia el `clienteschilli.html` actualizado sobre `www/index.html` en
   **este** repo (reemplaza el archivo completo).
2. Vuelve a subirlo — el build de Android se dispara solo.

Esto es manual a propósito (copiar el archivo), no automático — así nunca
hay sorpresas de qué versión terminó en la app nativa.

## Qué falta para iOS (recién cuando tengas Mac + iPhone prestados)

Con Mac + iPhone en la mano:
```
npx cap add ios
npx cap sync ios
npx cap open ios
```
Eso abre Xcode con el proyecto ya armado — desde ahí se compila e instala
directo en el iPhone conectado por USB, usando la firma gratuita de Apple
("Personal Team", dura 7 días) para probar sin todavía tener la cuenta
paga de Developer.

## Sobre el DUNS / cuenta de Apple Developer

Nada de lo anterior depende de eso — es solo para el paso final de firmar
y subir de verdad a TestFlight/App Store, que llega después de las pruebas.
