// bridge-src.js
//
// Punto de entrada que se empaqueta con esbuild (ver build.sh) para producir
// chilliapp-camera.js — un solo archivo JS plano que clienteschilli.html
// carga con un <script> normal, sin que Alonso tenga que instalar ni correr
// nada. Cada vez que se cambie este archivo, hay que volver a correr
// build.sh y subir el chilliapp-camera.js resultante — igual que subir
// cualquier otro archivo a Netlify/GitHub.
//
// Por qué existe este paso de empaquetado (y no un <script src> directo al
// plugin): el registerPlugin() real de Capacitor vive adentro del paquete
// @capacitor/core, no en el puente nativo que Android inyecta en tiempo de
// ejecución. Cargar el build suelto del plugin sin pasar por un import real
// tira "capacitorExports is not defined". Empaquetar con esbuild resuelve
// los imports de verdad, exactamente como Capacitor espera.
//
// window.ChilliCamera es la única superficie que el resto de clienteschilli.html
// necesita conocer — nombres en español, sin exponer la forma interna del
// plugin, para que el código de la app no dependa del plugin específico que
// se use por debajo (si el día de mañana se cambia de plugin, solo cambia
// este archivo).

import { CameraPreview } from '@capgo/camera-preview';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

// enableVideoMode:true es obligatorio en Android para poder grabar video
// (confirmado en la definición de tipos del plugin) — sin esto, startRecordVideo
// puede fallar en silencio en algunos dispositivos Android.
const OPCIONES_BASE = {
  toBack: true,           // cámara detrás del WebView -> el HTML de ChilliApp queda encima, visible
  enableVideoMode: true,
  disableAudio: false,
  enableOpacity: false,
  aspectMode: 'cover',
  videoQuality: 'high',
  width: 0,                // se completa en tiempo real con innerWidth/innerHeight (ver iniciar())
  height: 0,
  x: 0,
  y: 0
};

let posicionActual = 'front'; // ChilliApp graba principalmente hablando a cámara -> frontal por defecto

async function pedirPermisos() {
  const estado = await CameraPreview.requestPermissions({ disableAudio: false });
  if (estado.camera !== 'granted') {
    throw new Error('Permiso de cámara denegado. Actívalo en Ajustes del teléfono para usar esta función.');
  }
  // El micrófono es recomendable pero no bloqueante — si el usuario lo niega,
  // igual puede grabar (sin audio), no se corta el flujo por eso.
}

async function iniciar(opts) {
  await pedirPermisos();
  posicionActual = (opts && opts.position) || 'front';
  return await CameraPreview.start(Object.assign({}, OPCIONES_BASE, {
    position: posicionActual,
    width: window.innerWidth,
    height: window.innerHeight
  }));
}

async function grabar() {
  return await CameraPreview.startRecordVideo(Object.assign({}, OPCIONES_BASE, {
    position: posicionActual,
    width: window.innerWidth,
    height: window.innerHeight
  }));
}

async function detenerGrabacion() {
  // Devuelve { videoFilePath, reason } — reason indica si se detuvo manual,
  // por duración máxima, o por tamaño máximo de archivo.
  const resultado = await CameraPreview.stopRecordVideo();
  return {
    ruta: resultado.videoFilePath,
    razon: resultado.reason,
    // convertFileSrc transforma la ruta nativa (file:///... o content://...)
    // en una URL que el <video> del WebView puede reproducir directo.
    url: Capacitor.convertFileSrc(resultado.videoFilePath)
  };
}

async function detener(forzar) {
  return await CameraPreview.stop({ force: !!forzar });
}

async function cambiarCamara() {
  await CameraPreview.flip();
  posicionActual = posicionActual === 'front' ? 'rear' : 'front';
  return posicionActual;
}

async function estaCorriendo() {
  try {
    const r = await CameraPreview.isRunning();
    return !!(r && r.isRunning);
  } catch (e) {
    return false;
  }
}

// No hay una opción nativa de "guardar video en galería" para grabación de
// video en este plugin (sí existe para fotos, pero no para video) — se usa
// el panel nativo de compartir/guardar del sistema en su lugar, mismo
// resultado práctico para el usuario (puede elegir "Guardar en Fotos",
// "Guardar en Archivos", enviarlo a otra app, etc.), sin pelear con permisos
// de almacenamiento por versión de Android.
async function guardarOCompartir(rutaVideo) {
  await Share.share({
    title: 'Video grabado en ChilliApp',
    url: rutaVideo,
    dialogTitle: 'Guardar o compartir tu video'
  });
}

window.ChilliCamera = {
  disponible: () => Capacitor.isNativePlatform(),
  iniciar,
  grabar,
  detenerGrabacion,
  detener,
  cambiarCamara,
  estaCorriendo,
  guardarOCompartir
};
