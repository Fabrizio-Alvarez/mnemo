---
deck: React Server Components — Entrevista
tags: [react, rsc, nextjs, frontend]
fuente: Generado con prompts/generar-mazo.md
---

## ¿Qué es un Server Component?
Componente que ejecuta SOLO en el servidor: su código nunca se envía al browser. Accede a la BD/apis directamente y renderiza HTML.

### porque
El modelo tradicional manda todo el componente + sus datos al cliente y renderiza ahí. El RSC corre en el servidor, produce un árbol serializable y viaja solo el RESULTADO (más los client components que cuelguen). Menos JS en el bundle, secrets y queries sin endpoint intermedio, y async/await directo en el componente.

### distractores
- Un componente que se renderiza en el servidor y luego se hidrata en el browser para volverse interactivo
- Un componente marcado con "use server" en la primera línea del archivo
- Un componente que solo muestra contenido estático: no puede fetchear datos ni ser async

## ¿Server vs Client Component — dónde va la frontera?
Server por defecto (datos, await, secrets). Client (`"use client"`) solo lo que necesita interactividad: useState, efectos, event handlers, APIs del browser.

### porque
Todo en client = SPA con pasos extra (bundle enorme, fetching client-side). Todo en server = sin interactividad. La app real es un árbol mixto: server components fetchean y pasan DATOS a client components hoja (botón, form, timer). Regla práctica: `"use client"` lo más abajo posible, en las hojas interactivas.

### distractores
- Client por defecto: las páginas se marcan "use server" cuando necesitan datos
- "use client" en el layout raíz, así los componentes de abajo eligen libremente dónde correr
- Server en las hojas interactivas y client en los layouts, porque el estado global vive arriba

## ¿Qué marca exactamente la directiva "use client"?
El punto de entrada del bundle client: ese módulo y TODOS sus imports se envían al browser. No convierte en client lo que está encima.

### porque
Es una frontera de serialización, no un decorador: el server component que lo renderiza sigue en el servidor y le pasa props serializables. Por eso importar una librería pesada en un client component la suma al bundle aunque la página sea server-rendered — y por eso un import dinámico puede partirla en chunks.

### distractores
- Marca solo ese archivo: sus imports se resuelven en el servidor y no engordan el bundle
- Convierte en client todo el árbol, incluido el server component que lo renderiza
- Es solo documentación para el linter: el bundler decide por análisis estático qué código enviar

## ¿Qué puede cruzar la frontera server→client como props?
Datos serializables: strings, números, booleanos, arrays, objetos planos, Dates, y elementos React/componentes como children. NO funciones, clases ni instancias.

### porque
La frontera es una serialización: lo que no se puede representar como JSON-ish no cruza. Pasar un callback es imposible porque el server no vive cuando el cliente cliques — por eso existen las Server Actions: el server serializa una REFERENCIA a la función y el cliente la invoca por RPC.

### distractores
- Cualquier valor de JS: las funciones cruzan serializadas con su closure y se ejecutan en el cliente
- Solo JSON estricto: ni Dates ni elementos React pueden cruzar la frontera
- Objetos con métodos e instancias de clase, siempre que implementen toJSON

## ¿Qué son las Server Actions?
Funciones con `"use server"` que el cliente puede llamar como funciones: la llamada viaja al servidor, ejecuta, y devuelve el resultado.

### porque
Es RPC con types end-to-end: el form llama `calificar(...)` sin escribir un endpoint, fetch ni serialización manual — el framework la convierte en un POST con referencia criptográfica. El servidor re-valida y el cliente recibe el resultado. Ojo del proyecto: la action NO debe revalidar rutas mid-sesión (re-renderiza debajo del usuario que interactúa).

### distractores
- Componentes de servidor que se ejecutan automáticamente al enviar un <form>
- Endpoints REST que Next genera por convención para cada función exportada
- Funciones que corren durante el render para cargar datos en los server components

## ¿Por qué un Server Component no puede tener useState?
Porque no hay instancia viva en el cliente donde guardar el estado: el componente corre una vez en el servidor y viaja como resultado.

### porque
useState necesita una instancia persistente entre renders, hidratada en el browser. El RSC ni siquiera llega al browser — su "render" es un evento de servidor. La interactividad se resuelve bajando a un client component hoja con su propio estado, recibiendo datos como props del server.

### distractores
- Porque los hooks están deshabilitados en el servidor: React lanza error apenas los importa
- No es limitación del modelo: con "use client" en el mismo archivo, el server component guarda estado
- Porque compilaría pero el estado se compartiría entre todos los usuarios del servidor

## ¿Data fetching: await en RSC vs useEffect en client?
En RSC el componente es async y awaited: los datos llegan antes del render, sin estados de carga en cascada. En client, el efecto corre DESPUÉS de pintar (loader → fetch → repaint).

### porque
useEffect siempre implica una waterfall: pinta vacío, pide, vuelve a pintar. El await del server component bloquea el stream del servidor: llega HTML con datos. Además elimina el waterlogging de tokens: las queries corren donde vive la BD, no desde el browser del usuario. Client fetching queda para datos que dependen de interacción del usuario.

### distractores
- En RSC los datos se piden igual con useEffect, solo que el efecto corre en el servidor antes de responder
- El await del server component congela el navegador del usuario hasta que llegan los datos
- El fetch en cliente es más rápido: arranca apenas pinta, sin esperar el render del servidor

## ¿Qué significa force-dynamic y cuándo se usa?
Marca la ruta para renderizarse en cada request (SSR), sin caché estático ni build-time.

### porque
Por defecto Next puede cachear/estatizar una ruta sin datos dinámicos. Con datos que cambian por request (una sesión de estudio donde el estado muta), la versión estática muestra datos viejos. `force-dynamic` = "siempre fresco, siempre en el servidor". Costo: cero CDN cache — en apps personales con estado mutante por request, es el default correcto.

### distractores
- Fuerza a que todos los componentes de la ruta pasen a ser client components
- Desactiva la caché del browser pero mantiene el prerender estático hecho en build
- Solo tiene efecto si la ruta ya lee cookies o headers; en rutas estáticas no cambia nada

## ¿Qué es la hidratación y qué la rompe?
El client component llega como HTML y React "adjunta" los handlers en el browser (hidrata). Se rompe si el HTML del servidor difiere del primer render del cliente.

### porque
React asume que su primer render client coincide con el server HTML para adjuntarse encima. Si generás IDs aleatorios, fechas formateadas distinto o leés `window` en el primer render, los árboles difieren → hydration mismatch. Prevención: random/window solo en efectos (post-hidratación) o con `suppressHydrationWarning` en casos puntuales como temas.

### distractores
- Hidratar es ejecutar el componente de cero en el browser: React descarta el HTML del servidor y repinta
- La rompe registrar event handlers en el primer render: deben agregarse después de hidratar
- Se rompe si el server component que lo renderiza fetchea datos distintos en cada request

## ¿Cómo pasa un Server Component adentro de un Client Component?
Por `children`: el server renderiza el contenido y lo pasa como prop — el client component lo recibe como elemento ya renderizado.

### porque
Un client component no puede IMPORTAR un server component (lo convertiría en client). Pero puede recibirlo: `<Wrapper><DatoDelServer/></Wrapper>` — Wrapper es client, su children viene del server ya serializado como árbol. Es el patrón "client shell, server content": carousel, modal o tabs interactivos con contenido pesado que nunca viaja como JS.

### distractores
- Importándolo con import dinámico desde el client component, para que no entre al bundle
- Pasándolo como callback que el client component invoca cuando necesita el contenido
- No puede: todo lo que cuelga de un client component se convierte en client

## ¿revalidatePath — cuándo invalidar y cuándo NO?
Invalida la caché de una ruta tras un mutation para que la próxima navegación vea datos frescos.

### porque
Sin invalidar, la navegación posterior puede servir la versión cacheada. PERO invalidar dispara re-render de rutas activas: si el usuario está en medio de una sesión interactiva, el refresh pisa su estado. Regla aprendida: en flujos de sesión (study), la action no revalida; todas las rutas force-dynamic traen fresco en la próxima navegación igual.

### distractores
- Llamarla en cada render de la ruta, para que los datos viajen siempre frescos
- Llamarla antes del mutation, para pre-calentar la caché de la ruta
- Solo se puede invocar desde route handlers: dentro de las actions no está disponible

## ¿Qué gana un RSC vs una SPA para SEO y carga inicial?
HTML completo con datos en el primer response: indexable sin ejecutar JS y first paint sin waterfall de fetches.

### porque
La SPA manda un shell vacío + JS: el crawler (y el usuario) ven contenido recién después de ejecutar. El RSC streamea HTML con contenido: el bot lee todo, el usuario ve datos de una. En apps de estudio el efecto es doble: el JS del bundle es solo la fracción interactiva (botones de calificación), el resto de la página es HTML casi gratis.

### distractores
- Lo mismo en menos bytes: el HTML comprimido pesa menos que el bundle de JS
- Cero JavaScript en el browser: también las partes interactivas viajan como HTML puro
- Un time-to-interactive inmediato, porque no hay hidratación de ningún componente

## ¿Streaming con Suspense — qué resuelve?
Partir la respuesta en chunks: mandás el shell ya y cada sección lenta (suspense boundary) llega cuando su dato está listo.

### porque
Sin streaming, la sección más lenta (una query pesada) bloquea TODO el response. Con `<Suspense fallback>`, el shell pinta inmediato y cada boundary se rellena en orden de llegada. Es perceived performance: el usuario ve estructura al instante y contenido cuando hay. Las boundaries van donde los datos son independientes, no una por componente.

### distractores
- Ejecuta automáticamente en paralelo los fetches de cada boundary
- Manda todo el HTML junto al final, para que no se vea ningún fallback intermedio
- Una boundary por componente: granularidad máxima y cada uno streamea independiente

## ¿Cuándo RSC NO es la mejor herramienta?
Apps 100% interactivas tras la carga (editores, juegos, dashboards con drag&drop y realtime): casi todo termina siendo client components y pagás el server de más.

### porque
Si el 90% del árbol vive en el cliente, el modelo server solo agrega una capa: hidratación, acciones y fronteras sin beneficio. RSC brilla cuando la mayor parte es contenido (texto, datos, lectura) con islas interactivas. La pregunta correcta: ¿cuánto de esta pantalla es contenido estático-derivable vs estado vivo del usuario?

### distractores
- Sitios de contenido mayormente estático: sin islas interactivas el RSC no se justifica
- Apps con autenticación o datos privados: el servidor no debe tener acceso a credenciales
- Apps con API REST propia: el RSC obliga a reemplazarla por queries directas a la BD

## ¿Cuándo se muestra not-found.tsx y cómo la dispara tu código?
Next la renderiza ante una URL sin match y cuando una page llama `notFound()`: es la UI de las rutas inexistentes.

### porque
App Router es convención de archivos: `page` define la ruta, `layout` la envuelve, `loading`/`error`/`not-found` son boundaries automáticas por segmento. Error clásico: renderizar tu propio componente "no existe" con un if — perdés el status 404 que `notFound()` sí emite en el response.

### distractores
- La dispara automáticamente un fetch a tu API que devuelve 404
- La dispara tu propio componente "no existe" renderizado con un if, que emite el mismo status 404
- Solo para URLs sin match: no existe notFound(), hay que redirigir a una ruta /404

## ¿Layout o page — qué pasa con el estado al navegar entre páginas hermanas?
No se desmonta el layout: conserva estado y scroll mientras la page se reemplaza. Para forzar re-mount existe `template.tsx` (o sacarlo del layout).

### porque
La navegación client-side solo intercambia el segmento page y reutiliza los layouts comunes: por eso el sidebar abierto o el audio del layout siguen vivos entre rutas. Error clásico: esperar que un estado de la page sobreviva a la navegación — se desmontó con su página — o al revés, necesitar que algo se resetee y haberlo puesto en el layout.

### distractores
- El layout se desmonta en cada navegación; template.tsx es el que conserva el estado
- La page conserva su estado al navegar: React reutiliza el componente y solo cambia la URL
- El estado del layout se pierde salvo que lo guardes en un store global

## ¿Qué envuelve exactamente loading.tsx?
Un límite de Suspense automático alrededor del segmento: mientras el servidor fetchea, viaja el shell con el fallback visible.

### porque
Es azúcar sobre el streaming de RSC: el await del server component pausa ese subtree y el resto del documento se streamea ya. Error clásico: declarar el loading en el layout raíz cuando lo lento es una sección: toda la página cae al fallback en vez de solo ese bloque.

### distractores
- Un fallback global de la primera carga únicamente: en navegación client-side no se muestra
- El fallback de la hidratación: cubre mientras el browser descarga y ejecuta el JS del cliente
- Solo los assets del segmento: el HTML de los datos viaja siempre completo y de una vez

## ¿Qué dos cosas exige error.tsx y por qué?
Debe ser client component y recibe `{ error, reset }`: es una error boundary de React, y esas solo existen del lado del cliente.

### porque
`reset` reintenta el render del segmento. Las boundaries no atrapan handlers de eventos (eso es try/catch) ni errores del layout del mismo segmento (para eso va `global-error.tsx` o un boundary padre). Error clásico: confiar en un try/catch de la page para errores de render de los hijos — solo la boundary los atrapa.

### distractores
- Debe ser server component, para loguear el error con acceso a la BD
- Debe atrapar también los errores de los handlers con un try/catch interno
- Recibe { error, reset } y reintenta llamando de nuevo a la action que falló

## ¿Cómo ejecutás dos queries independientes en paralelo en un server component?
Sin await intermedio: `const [a, b] = await Promise.all([getA(), getB()])`. El total es la más lenta, no la suma.

### porque
El await detiene la función: cada promesa arranca cuando la esperás. Crearlas primero y esperarlas juntas las lanza concurrentes. Error clásico: `await getA()` arriba "para tener contexto" y recién ahí el Promise.all — la primera query ya corrió sola en serie.

### distractores
- await getA() y await getB() seguidos: el servidor ya ejecuta las queries en paralelo por defecto
- Promise.all no funciona en server components: hay que separar cada query en un Suspense
- Envolver cada query en un componente distinto para que Next las paralelice automáticamente

## ¿Qué es el waterfall entre componentes y cuándo es aceptable?
El hijo espera su dato y recién entonces renderiza al nieto que pide el suyo: latencias sumadas en cadena. Aceptable solo si un dato depende del anterior.

### porque
Cada await pausa el subtree: repartir datos independientes por niveles los vuelve una secuencia accidental. Solución: fetchea todo en el page con Promise.all y baja los datos por props — los hijos quedan presentacionales. Error clásico: "cada componente pide lo que usa" aplicado a ciegas: encapsulación prolija, cadena de latencia.

### distractores
- Dos fetches paralelos compitiendo por el pool de conexiones de la BD
- Siempre aceptable en server components: entre niveles del servidor no se paga latencia de red
- Se soluciona envolviendo cada nivel en su propia Suspense boundary

## ¿Qué tiene de especial leer cookies() o headers() en un server component?
Son dynamic APIs: solo tienen valor con un request concreto, así que leerlas saca la ruta del prerender estático.

### porque
Comparación estático vs dinámico: sin datos del request Next prerenderiza en build y sirve desde CDN; cookies()/headers() exigen render per-request, por eso su lectura "opta por" dinámico. Error clásico: leer cookies en el layout raíz (tema, sesión) y dinamizar TODAS las rutas por debajo — va lo más profundo posible.

### distractores
- Están prohibidas en server components: cookies y headers se leen en route handlers o middleware
- Leerlas deshabilita también la Data Cache de todos los fetch de esa ruta
- Solo dinamizan la ruta si el valor cambia entre dos requests del mismo usuario

## ¿Por qué leer searchParams puede tirar abajo tu página estática?
Es parte del request (la URL): leerla o awaitearla la vuelve dinámica. Declararla como prop sin leerla no rompe el prerender.

### porque
Sutileza de cuándo: la prop llega siempre, lo que dinamiza es su lectura — mismo mecanismo que cookies(). En Next 15+ además es una Promise que se awaitea. Error clásico: desestructurarla como objeto plano y no entender por qué la página dejó de prerenderizar.

### distractores
- Declararla como prop ya dinamiza: hay que omitirla de las props para poder prerenderizar
- Rompe el prerender solo si la lee un client component con useSearchParams
- En Next 15+ hay que marcar la página con "use dynamic" para poder awaitearla

## ¿Cuáles son las tres capas de caché del servidor en Next?
Request memoization (deduplica el mismo fetch dentro de UNA pasada de render), Data Cache (persiste respuestas fetch ENTRE requests), Full Route Cache (guarda el HTML+RSC ya renderizado por ruta).

### porque
Criterio: ¿a qué distancia del request está lo cacheado? Misma pasada → memoization, que no se invalida porque solo deduplica. Entre requests → data cache, con revalidateTag/Path o TTL. Resultado final → route cache. Encima vive la cuarta, el Router Cache, en el browser. Error clásico: diagnosticar "el servidor no revalidó" cuando era el Router Cache del cliente sirviendo su copia.

### distractores
- Router Cache, Data Cache y Full Route Cache: el Router Cache es la tercera capa del servidor
- Request memoization persiste respuestas ENTRE requests y la Data Cache deduplica dentro de UNA pasada
- Caché del browser, caché del CDN y caché de la BD: Next no cachea nada más

## ¿revalidateTag o revalidatePath — cómo decidís?
Tag para invalidación por DATO: los fetches etiquetados (`next: { tags: [...] }`) quedan frescos en todas las vistas. Path para refrescar una RUTA completa por URL.

### porque
El tag desacopla la invalidación de las rutas: todos los consumers del dato se actualizan sin enumerar URLs. El path acierta cuando no hay tags y la unidad natural es la pantalla. Error clásico: revalidatePath sobre la URL actual esperando que refresque OTRA vista del mismo dato — con tag eso no pasa.

### distractores
- Tag para refrescar la URL actual; path para actualizar el dato en todas las vistas que lo consumen
- revalidateTag solo corre dentro de server actions: en route handlers hay que usar revalidatePath
- Son sinónimos: el tag es el alias moderno del path desde Next 14

## ¿Route handler (route.ts) o server action — cuándo cada uno?
Handler para consumidores externos: webhooks, APIs públicas, descargas con verbos HTTP reales. Action para mutations disparados desde tu propia UI.

### porque
Criterio: ¿quién llama? Un sistema de afuera necesita una URL estable con GET/POST — route.ts. Tu form necesita RPC tipado sin endpoint — la action, que además integra revalidación y estado. Error clásico: exponer actions como API para terceros: son POST con referencia opaca y chequeo de origen, no un contrato versionable.

### distractores
- Action para exponer APIs públicas: ya trae el POST con chequeo de origen incluido
- Handler para los forms: acepta GET y POST del form sin escribir JavaScript de cliente
- Son intercambiables: la action es azúcar que genera un route.ts por debajo

## ¿Qué problema resuelve useActionState en un form con action?
Te da el estado del resultado dentro del componente: `pending`, el retorno y los errores — sin flags manuales ni onSubmit custom.

### porque
La action firma `(prevState, formData) => newState`: lo que devuelve vuelve como estado del form, y pending sale de ahí. Error clásico: llamar la action a mano en onSubmit y guardar el resultado en useState — perdés pending automático y duplicás la fuente de verdad.

### distractores
- Reemplaza la action: define el handler en el cliente sin "use server"
- Da el pending de cualquier hijo del form sin conocer la action, como useFormStatus
- Maneja el envío: serializa el FormData y hace el fetch al endpoint por vos

## ¿useFormStatus o useActionState — cuándo alcanza con la primera?
Con useFormStatus un componente HIJO del form (el botón) lee `pending` del form ancestro — sin props, sin conocer la action, sin re-render del padre.

### porque
Es context del `<form>`: ideal para deshabilitar/mostrar "Enviando…" encapsulado. Restricción clave: no funciona en el MISMO componente que renderiza el form — ahí no hay ancestro que leer y corresponde useActionState. Error clásico: usarlo fuera del form y verlo siempre en false.

### distractores
- Cuando el componente que renderiza el <form> necesita leer su propio pending
- En cualquier componente de la pantalla: lee el estado global de la action en curso
- También devuelve el resultado y los errores de la action, no solo el pending

## ¿Cómo mostrás una mutation como hecha antes de que el servidor responda?
Aplicando el estado "esperado" con useOptimistic: la UI refleja el click al instante y React revierte si falla o confirma con el dato real.

### porque
Sin optimistic, cada click espera el round-trip para reflejarse: la UI se siente lenta aunque el servidor sea rápido. Dentro de startTransition el estado optimista convive con el real sin flicker. Error clásico: optimizar items sin id/key: si el servidor reordena, el estado queda pegado a la posición equivocada.

### distractores
- Con startTransition solo: React pinta la update no urgente apenas clickeás, sin estado extra
- Guardando el estado esperado en un useState que la action limpia al confirmar
- Llamando router.refresh() inmediatamente después del click para traer datos nuevos

## ¿Qué garantiza el paquete server-only en un módulo?
Rompe el build si ese módulo (secrets, queries directas) termina importado por un client component — en vez de terminar silencioso en el bundle.

### porque
`import 'server-only'` marca el módulo para el resolver: cruzar la frontera client rompe la compilación. No es lo mismo que `"use server"`: esa crea un endpoint RPC invocable; server-only es una guardia de import que no expone nada. Error clásico: importar el cliente de BD "solo para un tipo" y shippear la cadena de conexión.

### distractores
- Garantiza que el módulo corra solo en el servidor en runtime, sin romper el build
- Convierte el módulo en una server action invocable desde el cliente
- Tree-shakea el módulo del bundle client dejando pasar solo los tipos importados

## ¿Qué protege una server action de llamadas cross-site?
El chequeo de Origin: el POST con origen ajeno al Host de la app se rechaza antes de ejecutar la action — CSRF cortado por defecto.

### porque
La action es un endpoint HTTP disfrazado: quien adivine su referencia podría POSTearle. El check de origen bloquea otros dominios, pero NO es autorización: cualquier usuario legítimo puede invocarla. Error clásico: creer que la referencia opaca "encripta" el acceso — los permisos se validan DENTRO de la action.

### distractores
- La referencia opaca de la action: un tercero no puede adivinar el endpoint
- Un token CSRF que generás y validás manualmente en cada formulario
- CORS: el browser bloquea el POST cross-site a endpoints sin Access-Control-Allow-Origin

## ¿Qué limitación de streaming tiene generateMetadata?
Que no puede streamear: Next espera que resuelva antes de mandar el head; un fetch lento ahí frena todo el documento.

### porque
El metadata vive en el `<head>`, que no puede llegar a mitad de documento. Si genera el mismo fetch que la page, request memoization lo deduplica — conviene reusarlo en vez de una query extra. Error clásico: una consulta adicional (distinta URL) en generateMetadata "para el SEO": suma su latencia completa al primer byte.

### distractores
- Streamea después del body: el head llega al final del documento
- Puede streamear si envolvés su fetch en un Suspense con fallback de metadata
- No puede fetchear: la page debe pasarle los datos ya resueltos por props

## ¿Qué es el Router Cache y cómo lo aprovecha el prefetch de Link?
La caché en memoria del browser con los payloads RSC por ruta: Link los precarga y navegar o volver atrás no pide al servidor.

### porque
Es la cuarta capa de caché, del lado cliente: por eso tras un mutation podés ver datos viejos al navegar — no fue el servidor, fue esta copia. Se purga con router.refresh() o con la revalidación que dispara la action. Error clásico: desactivar el prefetch "para ahorrar" justo en la navegación más usada.

### distractores
- La caché del servidor que guarda los payloads RSC por ruta tras el build
- Un service worker que precarga el HTML completo de las rutas enlazadas
- Se limpia en cada navegación: por eso Link siempre pide la ruta fresca al servidor

## ¿Por qué next/image y no un <img> directo?
Resize por viewport (srcset/densidades), conversión a WebP/AVIF, lazy por defecto y width/height que reservan el espacio — sin layout shift.

### porque
El original de 3MB nunca viaja entero: el image optimizer sirve el tamaño justo para el dispositivo y lo cachea en la CDN. Los atributos de tamaño evitan el salto de contenido al cargar (Core Web Vital). Error clásico: usar una URL externa sin declararla en images.remotePatterns — el optimizer la rechaza en runtime.

### distractores
- Principalmente el lazy loading: con loading="lazy" en el <img> directo obtenés lo mismo
- Convierte las imágenes a WebP en build y las deja optimizadas en /public
- Evita el layout shift ocultando la imagen hasta que termina de cargar

## ¿Cómo componés server page + client list + action + optimistic?
Fetchea en la page (server) y baja los datos a la lista client; la action muta y devuelve estado; la lista aplica useActionState + useOptimistic y confirma al revalidar.

### porque
Es la síntesis del modelo: el server es dueño de datos y validación, el client solo de la interacción inmediata, la action es el puente RPC. Error clásico: mover el fetch a la lista "para simplificar": perdés streaming, deduplicación de requests y el contenido indexable.

### distractores
- La lista fetchea sus datos con useEffect y la action revalida; la page queda de armazón
- La page guarda el estado de la lista y le baja setters y callbacks por props
- La action devuelve el HTML nuevo de la lista y el cliente lo inyecta directamente
