# Clasificación y Aplicaciones de los dispositivos móviles

## Hoja de respuestas · Dinámica presencial por equipos

**Actividad:** 5 preguntas de nivel intermedio, una por bloque de la exposición. Cada ronda dura **90 segundos** y los equipos anotan su respuesta en su cuaderno antes de que el expositor pulse **«Mostrar respuesta»**.

**Uso para el equipo expositor:**

1. Abre la presentación y pulsa **«Ir a la Dinámica por Equipos (5 preguntas)»**. El cronómetro de la pregunta 1 arranca solo.
2. Da minuto y medio a los equipos para leer las 4 tarjetas (A, B, C, D), discutir y anotar su letra.
3. Pulsa **«Mostrar respuesta»** cuando lo decidas: se detiene el cronómetro, se resalta la opción correcta en verde y aparece la explicación.
4. Comenta la explicación y pulsa **«Siguiente pregunta»**. El cronómetro se reinicia automáticamente en 90 segundos.
5. Al terminar la quinta pregunta, **«Finalizar dinámica»** muestra el resumen de respuestas. No hay puntuación: el objetivo es la discusión.

**Clave rápida:** 1 · A — 2 · B — 3 · A — 4 · A — 5 · B

---

## Pregunta 1 · Bloque 1 — Dispositivos y diseño web

**Integrante:** Diaz Vazquez Regina Valeria

**Enunciado:** Un formulario de reserva usa `height: 100vh` para ocupar toda la pantalla. En un iPhone, al aparecer la barra del navegador, el botón «Confirmar» queda tapado y el usuario no puede terminar. ¿Cuál es la mejor solución?

- **A)** Cambiar la altura a `100dvh` y usar botones de al menos 44×44 px, el tamaño táctil recomendado.
- **B)** Mantener `100vh` y reducir los botones a 24 px para que todo quepa en la pantalla.
- **C)** Bloquear el zoom del navegador para que la barra de URL no cambie de tamaño.
- **D)** Fijar todo el contenido con `position: fixed` para que nada se mueva.

**Respuesta correcta: A**

**Explicación:** `100vh` toma la altura máxima del viewport y no se ajusta cuando aparece la barra del navegador; `100dvh` sigue la altura visible real. Además, un objetivo táctil de 44×44 px evita pulsaciones fallidas. Bloquear el zoom o fijar el contenido no resuelve el recorte y empeora la accesibilidad.

---

## Pregunta 2 · Bloque 2 — Ecosistemas y motores

**Integrante:** Cruz Contreras Jonathan Ivan

**Enunciado:** En Android puedes instalar Chrome, Firefox o Edge y cada uno usa su propio motor. En iPhone y iPad, ¿qué ocurre con todos los navegadores?

- A) Cada navegador usa su propio motor, igual que en Android.
- **B)** Todos deben usar WebKit, el motor de Apple, y sus funciones dependen de la versión de iOS.
- C) Solo Safari puede abrir páginas web; los demás únicamente muestran texto.
- D) Todos usan Blink porque es el motor más popular del mundo.

**Respuesta correcta: B**

**Explicación:** En iOS y iPadOS no se puede elegir motor: Safari, Chrome, Firefox y cualquier WebView usan WebKit, y sus capacidades llegan con la actualización del sistema. Por eso conviene detectar funciones y ofrecer una alternativa cuando algo no está disponible, en lugar de prometer paridad con Android.

---

## Pregunta 3 · Bloque 3 — PWAs y apps híbridas

**Integrante:** Enriquez de la Cruz Emmanuel

**Enunciado:** Un equipo convierte su sitio web en una PWA. ¿Qué combinación le permite abrirse sin conexión e instalarse en la pantalla de inicio?

- **A)** Un Service Worker que guarda recursos en caché y un Web App Manifest con nombre, iconos y colores.
- B) Un archivo `robots.txt` y una hoja de estilos con *media queries*.
- C) Una base de datos en `localStorage` y un favicon en formato PNG.
- D) Un servidor con HTTPS y un botón que abra la tienda de aplicaciones.

**Respuesta correcta: A**

**Explicación:** El Service Worker actúa como intermediario de red y guarda en caché el shell para responder sin conexión. El Web App Manifest aporta nombre, iconos, color y modo de visualización para que el navegador ofrezca la instalación. HTTPS es necesario, pero por sí solo no da offline ni instalación.

---

## Pregunta 4 · Bloque 4 — Sectores y Web APIs

**Integrante:** Juarez Olivarez Armando Enrique

**Enunciado:** Una app de entregas necesita mostrar la ubicación del repartidor, tomar una foto de entrega y permitir el acceso con huella. ¿Qué APIs cubren esas funciones y qué necesitan para usarse?

- **A)** `Geolocation API`, `MediaDevices` (cámara) y `WebAuthn`; requieren HTTPS y el permiso del usuario.
- B) `Fetch API`, `WebSocket` y `Canvas`; funcionan en cualquier página, incluso sin HTTPS.
- C) `localStorage`, `sessionStorage` y cookies; no necesitan permisos porque son del navegador.
- D) `Web Bluetooth`, `WebUSB` y `WebGL`; son las únicas APIs que piden permiso.

**Respuesta correcta: A**

**Explicación:** `Geolocation` obtiene la posición, `MediaDevices.getUserMedia()` abre la cámara y `WebAuthn` gestiona credenciales con huella o rostro. Las tres exigen un contexto seguro (HTTPS) y consentimiento: el permiso se pide cuando el usuario activa la función y debe existir una alternativa si lo deniega.

---

## Pregunta 5 · Bloque 5 — Rendimiento y seguridad

**Integrante:** Vazquez García Carlos Angel

**Enunciado:** Al abrir una pantalla, el JavaScript tarda 800 ms en terminar y la app se siente «pegada» al tocar. Además, el token de sesión está guardado en `localStorage`. ¿Cuál es la corrección más completa?

- A) Mostrar un spinner para ocultar la tardanza y dejar el token en `localStorage`.
- **B)** Dividir el trabajo pesado y ceder el hilo principal para mejorar el INP; guardar el token en una cookie `HttpOnly` para que XSS no pueda leerlo.
- C) Aumentar la memoria del dispositivo y mover el token a `sessionStorage`.
- D) Cargar el JavaScript dos veces para que la segunda ejecución sea más rápida.

**Respuesta correcta: B**

**Explicación:** Un bloqueo de 800 ms impide pintar y responder al toque, así que el INP sube mucho más del objetivo de 200 ms. Hay que partir las tareas largas y devolver el control al navegador; un spinner solo disimula el problema. `localStorage` es legible por cualquier script inyectado (XSS), mientras que una cookie `HttpOnly` no se expone a JavaScript.

---

*Hoja de respuestas de la dinámica final · Seminario de Desarrollo Web Móvil.*
