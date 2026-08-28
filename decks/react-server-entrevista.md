---
deck: React Server Components — Entrevista
tags: [react, rsc, nextjs, frontend]
fuente: Generado con prompts/generar-mazo.md
---

## ¿Qué es un Server Component?
Componente que ejecuta SOLO en el servidor: su código nunca se envía al browser. Accede a la BD/apis directamente y renderiza HTML.

### porque
El modelo tradicional manda todo el componente + sus datos al cliente y renderiza ahí. El RSC corre en el servidor, produce un árbol serializable y viaja solo el RESULTADO (más los client components que cuelguen). Menos JS en el bundle, secrets y queries sin endpoint intermedio, y async/await directo en el componente.

## ¿Server vs Client Component — dónde va la frontera?
Server por defecto (datos, await, secrets). Client (`"use client"`) solo lo que necesita interactividad: useState, efectos, event handlers, APIs del browser.

### porque
Todo en client = SPA con pasos extra (bundle enorme, fetching client-side). Todo en server = sin interactividad. La app real es un árbol mixto: server components fetchean y pasan DATOS a client components hoja (botón, form, timer). Regla práctica: `"use client"` lo más abajo posible, en las hojas interactivas.

## ¿Qué marca exactamente la directiva "use client"?
El punto de entrada del bundle client: ese módulo y TODOS sus imports se envían al browser. No convierte en client lo que está encima.

### porque
Es una frontera de serialización, no un decorador: el server component que lo renderiza sigue en el servidor y le pasa props serializables. Por eso importar una librería pesada en un client component la suma al bundle aunque la página sea server-rendered — y por eso un import dinámico puede partirla en chunks.

## ¿Qué puede cruzar la frontera server→client como props?
Datos serializables: strings, números, booleanos, arrays, objetos planos, Dates, y elementos React/componentes como children. NO funciones, clases ni instancias.

### porque
La frontera es una serialización: lo que no se puede representar como JSON-ish no cruza. Pasar un callback es imposible porque el server no vive cuando el cliente cliques — por eso existen las Server Actions: el server serializa una REFERENCIA a la función y el cliente la invoca por RPC.

## ¿Qué son las Server Actions?
Funciones con `"use server"` que el cliente puede llamar como funciones: la llamada viaja al servidor, ejecuta, y devuelve el resultado.

### porque
Es RPC con types end-to-end: el form llama `calificar(...)` sin escribir un endpoint, fetch ni serialización manual — el framework la convierte en un POST con referencia criptográfica. El servidor re-valida y el cliente recibe el resultado. Ojo del proyecto: la action NO debe revalidar rutas mid-sesión (re-renderiza debajo del usuario que interactúa).

## ¿Por qué un Server Component no puede tener useState?
Porque no hay instancia viva en el cliente donde guardar el estado: el componente corre una vez en el servidor y viaja como resultado.

### porque
useState necesita una instancia persistente entre renders, hidratada en el browser. El RSC ni siquiera llega al browser — su "render" es un evento de servidor. La interactividad se resuelve bajando a un client component hoja con su propio estado, recibiendo datos como props del server.

## ¿Data fetching: await en RSC vs useEffect en client?
En RSC el componente es async y awaited: los datos llegan antes del render, sin estados de carga en cascada. En client, el efecto corre DESPUÉS de pintar (loader → fetch → repaint).

### porque
useEffect siempre implica una waterfall: pinta vacío, pide, vuelve a pintar. El await del server component bloquea el stream del servidor: llega HTML con datos. Además elimina el waterlogging de tokens: las queries corren donde vive la BD, no desde el browser del usuario. Client fetching queda para datos que dependen de interacción del usuario.

## ¿Qué significa force-dynamic y cuándo se usa?
Marca la ruta para renderizarse en cada request (SSR), sin caché estático ni build-time.

### porque
Por defecto Next puede cachear/estatizar una ruta sin datos dinámicos. Con datos que cambian por request (una sesión de estudio donde el estado muta), la versión estática muestra datos viejos. `force-dynamic` = "siempre fresco, siempre en el servidor". Costo: cero CDN cache — en apps personales con estado mutante por request, es el default correcto.

## ¿Qué es la hidratación y qué la rompe?
El client component llega como HTML y React "adjunta" los handlers en el browser (hidrata). Se rompe si el HTML del servidor difiere del primer render del cliente.

### porque
React asume que su primer render client coincide con el server HTML para adjuntarse encima. Si generás IDs aleatorios, fechas formateadas distinto o leés `window` en el primer render, los árboles difieren → hydration mismatch. Prevención: random/window solo en efectos (post-hidratación) o con `suppressHydrationWarning` en casos puntuales como temas.

## ¿Cómo pasa un Server Component adentro de un Client Component?
Por `children`: el server renderiza el contenido y lo pasa como prop — el client component lo recibe como elemento ya renderizado.

### porque
Un client component no puede IMPORTAR un server component (lo convertiría en client). Pero puede recibirlo: `<Wrapper><DatoDelServer/></Wrapper>` — Wrapper es client, su children viene del server ya serializado como árbol. Es el patrón "client shell, server content": carousel, modal o tabs interactivos con contenido pesado que nunca viaja como JS.

## ¿revalidatePath — cuándo invalidar y cuándo NO?
Invalida la caché de una ruta tras un mutation para que la próxima navegación vea datos frescos.

### porque
Sin invalidar, la navegación posterior puede servir la versión cacheada. PERO invalidar dispara re-render de rutas activas: si el usuario está en medio de una sesión interactiva, el refresh pisa su estado. Regla aprendida: en flujos de sesión (study), la action no revalida; todas las rutas force-dynamic traen fresco en la próxima navegación igual.

## ¿Qué gana un RSC vs una SPA para SEO y carga inicial?
HTML completo con datos en el primer response: indexable sin ejecutar JS y first paint sin waterfall de fetches.

### porque
La SPA manda un shell vacío + JS: el crawler (y el usuario) ven contenido recién después de ejecutar. El RSC streamea HTML con contenido: el bot lee todo, el usuario ve datos de una. En apps de estudio el efecto es doble: el JS del bundle es solo la fracción interactiva (botones de calificación), el resto de la página es HTML casi gratis.

## ¿Streaming con Suspense — qué resuelve?
Partir la respuesta en chunks: mandás el shell ya y cada sección lenta (suspense boundary) llega cuando su dato está listo.

### porque
Sin streaming, la sección más lenta (una query pesada) bloquea TODO el response. Con `<Suspense fallback>`, el shell pinta inmediato y cada boundary se rellena en orden de llegada. Es perceived performance: el usuario ve estructura al instante y contenido cuando hay. Las boundaries van donde los datos son independientes, no una por componente.

## ¿Cuándo RSC NO es la mejor herramienta?
Apps 100% interactivas tras la carga (editores, juegos, dashboards con drag&drop y realtime): casi todo termina siendo client components y pagás el server de más.

### porque
Si el 90% del árbol vive en el cliente, el modelo server solo agrega una capa: hidratación, acciones y fronteras sin beneficio. RSC brilla cuando la mayor parte es contenido (texto, datos, lectura) con islas interactivas. La pregunta correcta: ¿cuánto de esta pantalla es contenido estático-derivable vs estado vivo del usuario?
