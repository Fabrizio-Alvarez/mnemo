---
deck: Vue 3 — Entrevista
tags: [vue, frontend, javascript]
fuente: Guía de estudio Laravel+Vue (proyecto Supermercado DDD)
---

## ¿Qué es la reactividad en Vue?
Vue intercepta el acceso a variables reactivas. Cuando cambian, re-renderiza las partes del DOM que dependen de ellas.

### distractores
- Vue re-renderiza el componente completo cada vez que cambia cualquier dato del estado.
- Es un hook del ciclo de vida que se dispara después de cada actualización del DOM.
- Re-computa todos los `computed` del componente ante cualquier cambio, sin cache.

## ¿ref vs reactive?
`ref` envuelve un valor, necesita `.value`. `reactive` hace reactivo un objeto, sin `.value`, pero pierde reactividad al desestructurar.

### distractores
- `ref` solo sirve para primitivos; los objetos deben envolverse con `reactive` sí o sí.
- Es al revés: `reactive` requiere `.value` y `ref` accede directo al valor.
- Al desestructurar un `reactive`, las propiedades extraídas siguen siendo reactivas.

## ¿computed vs method?
`computed` deriva valor del estado, tiene cache. `method` es acción/evento, sin cache.

### distractores
- `computed` acepta parámetros y cachea el resultado por argumentos, igual que un method.
- `method` también cachea: no se re-ejecuta mientras no cambien sus dependencias.
- `computed` es para side effects; `method` es el que deriva valores del estado.

## ¿Cuándo usas watch?
Para side effects cuando algo cambia (animaciones, API calls, localStorage). No para derivar valores.

### distractores
- Para derivar un valor calculado a partir de otras variables reactivas.
- Para ejecutar algo una única vez al montar el componente, antes del primer render.
- Para manejar eventos de usuario como clicks o envíos de formulario.

## ¿Props hacia dónde van?
Padre → Hijo (hacia abajo). El hijo no puede mutar sus props.

### distractores
- De hijo a padre: el hijo pasa datos hacia arriba mediante props.
- En ambas direcciones: Vue sincroniza el valor automáticamente en los dos sentidos.
- El hijo puede mutar la prop siempre que avise al padre con un emit.

## ¿Cómo el hijo le habla al padre?
Emits. `defineEmits(['evento'])` en el hijo, `@evento="handler"` en el padre.

### distractores
- Mutando las props que el padre le pasó; el cambio sube solo.
- Con provide/inject: el hijo provee los datos y el ancestro los inyecta.
- Obteniendo una referencia al padre con `$refs` y llamando sus métodos directo.

## ¿Qué es un composable?
Función que retorna estado y lógica reutilizable. Extrae lógica del componente sin repetirla.

### distractores
- Un mixin renombrado: en Vue 3 ambos comparten estado entre componentes igual.
- Un componente sin template que se incrusta dentro de otro componente.
- Un plugin que se registra con `app.use()` para agregar funcionalidad global.

## ¿Cómo compartes estado global sin Pinia?
Composable con estado externo (patrón singleton). El estado se declara fuera de la función.

### distractores
- Declarando el estado dentro del composable: todos los componentes que lo llaman comparten la misma instancia.
- Guardando el estado en App.vue y leyéndolo desde los hijos vía `$root`.
- Exportando una variable plana de módulo y mutándola: el DOM se actualiza igual.

## ¿Para qué sirven los slots?
Composición. El hijo define la estructura, el padre inyecta el contenido.

### distractores
- El padre define la estructura y el hijo inyecta el contenido dentro de ella.
- Son un reemplazo de las props: pasan cualquier dato del padre al hijo sin declararlo.
- Solo aceptan contenido estático: no se pueden usar bindings reactivos adentro.

## ¿v-if vs v-show?
`v-if` quita el elemento del DOM. `v-show` usa `display: none`. v-if más costoso al inicio, v-show al toggle.

### distractores
- Es al revés: `v-show` quita el elemento del DOM y `v-if` aplica `display: none`.
- Son equivalentes: `v-show` es solo azúcar sintáctica de `v-if`.
- `v-if` siempre rinde mejor porque nunca deja el nodo oculto en el DOM.

## ¿Por qué v-for necesita :key?
Para que Vue rastree elementos al reordenar/agregar/eliminar. Debe ser único y estable (ID, no índice).

### distractores
- Para que Vue ordene la lista según esa propiedad al reordenar elementos.
- El índice del array es la key ideal: único y estable por definición.
- Es decorativa: sin key Vue rastrea los elementos igual, solo genera un warning.

## ¿Qué hace v-model?
Two-way binding. Es azúcar para `:value="x" @input="x = $event.target.value"`.

### distractores
- One-way binding: solo refleja la variable en el input, no escucha los cambios.
- Solo existe para inputs nativos de formulario; los componentes propios no pueden recibirlo.
- Escribe directo el DOM sin eventos: el navegador sincroniza el estado por su cuenta.

## ¿Para qué sirve Teleport?
Renderiza el HTML en otro punto del DOM (body). Útil para modals y toasts que no deben quedar limitados por overflow/z-index del padre.

### distractores
- Para navegar el componente a otra ruta de la app sin recargar la página.
- Para pasar datos a componentes lejanos sin usar props ni provide/inject.
- Para cargar componentes pesados de forma diferida fuera del árbol actual.

## ¿Transition vs TransitionGroup?
`Transition` = un elemento (show/hide). `TransitionGroup` = lista de elementos (v-for), con animación de reordenamiento.

### distractores
- `Transition` también anima listas: basta con envolver el `v-for` completo.
- Son lo mismo: `TransitionGroup` es el nombre largo de `Transition`.
- `TransitionGroup` anima el cambio de página al alternar rutas del router.

## ¿Qué hook usas para limpiar listeners?
`onUnmounted` (Composition API). Ahí quitas event listeners y cancelas timers.

### distractores
- `onDestroyed`: así se llama el hook de limpieza en la Composition API de Vue 3.
- `onDeactivated`: se dispara en cada desmontaje, justo antes que `onUnmounted`.
- Ninguno: Vue remueve solo los listeners de window al desmontar el componente.

## ¿Cuándo conviene la Composition API sobre la Options API?
Cuando el componente tiene mucha lógica que quieres agrupar por feature o extraer a composables. Para componentes chicos, la Options API sigue siendo perfectamente válida.

### porque
Options ordena el código por tipo (data, methods, computed), dispersando una feature en varias secciones; Composition la mantiene junta. Error clásico: creer que Options API está deprecada en Vue 3 — ambas se mantienen.

### distractores
- Siempre: la Options API está deprecada en Vue 3 y solo se mantiene por compatibilidad.
- Cuando querés menos líneas: la Composition API siempre produce componentes más cortos.
- Solo en librerías: en aplicaciones propias la Composition API no está soportada.

## ¿watch vs watchEffect?
`watch` observa fuentes declaradas explícitamente y recibe valor nuevo y viejo. `watchEffect` corre de inmediato y autodetecta dependencias, pero no ve el valor anterior.

### porque
Criterio: si necesitas el valor previo o controlar qué mirar → watch; si el efecto y sus dependencias son obvios → watchEffect. Error clásico: watchEffect para llamadas a API: se re-ejecuta por cualquier dependencia que toque.

### distractores
- `watchEffect` también entrega el valor viejo y el nuevo; cambia solo la sintaxis.
- `watch` ejecuta su callback inmediatamente al declararlo, sin `immediate: true`.
- `watch` infiere las dependencias del callback, igual que un computed.

## ¿Qué problema de props resuelve provide/inject?
El props drilling: deja de pasar datos por componentes intermedios que no los usan. Un ancestro hace `provide` y cualquier descendiente lejano hace `inject`.

### porque
Criterio: props para contratos padre→hijo visibles; provide/inject para theme, auth o i18n que cruzan muchos niveles. Error clásico: usarlo para estado de negocio general — vuelve invisible el flujo de datos.

### distractores
- El descendiente hace `provide` y el ancestro hace `inject`: los datos suben.
- Resuelve la comunicación entre hermanos: cualquier hermano puede inyectar lo que otro provee.
- Todo valor inyectado es reactivo, aunque se provea un dato plano sin ref ni reactive.

## ¿Qué es un scoped slot?
Un slot donde el hijo expone datos hacia el contenido: el padre recibe esas variables y decide cómo renderizarlas (por ejemplo, cada ítem de una lista).

### porque
Invierte la dirección del slot normal: el hijo comparte su estado interno y el padre personaliza el render. Error clásico: armar cadenas de props/emits para que el padre pueda customizar cómo se dibuja un ítem del hijo.

### distractores
- Un slot donde el padre expone sus datos y el hijo decide cómo renderizarlos.
- Un slot cuyo contenido hereda los estilos `scoped` del componente que lo define.
- Un slot privado: solo el propio componente puede proyectar contenido en él.

## ¿Dónde no llega la reactividad de Vue 3?
Al destructurar un `reactive` (obtienes el valor crudo, sin Proxy) y a todo dato no envuelto en ref/reactive: se intercepta el acceso a propiedades, no variables sueltas.

### porque
Vue 3 envuelve el objeto en un Proxy que intercepta get/set. `const { items } = state` lee una vez y guarda el valor plano fuera del Proxy. Error clásico: destructurar reactive en setup y esperar que el template se actualice.

### distractores
- A los niveles anidados de un `reactive`: cada propiedad interna necesita su propio envoltorio.
- A los arrays: `push` y `splice` sobre un reactive no disparan actualización.
- A las props: el hijo recibe una copia congelada que no se actualiza cuando el padre cambia el valor.

## ¿Cuándo elegirías shallowRef?
Con estructuras grandes o de terceros (árboles de datos, instancias de canvas) donde solo quieres re-disparar al reemplazar `.value` completo, sin trackear mutaciones internas.

### porque
Un ref profundo convierte cada nivel del objeto en reactivo: costo innecesario si nunca mutas por dentro. shallowRef solo dispara con `.value = nuevo`. Error clásico: mutar el objeto interno de un shallowRef y esperar que el DOM se actualice.

### distractores
- Cuando mutás propiedades internas y esperás que igual dispare la actualización.
- Cuando querés un ref que nunca dispare re-render, ni siquiera al reemplazar `.value`.
- Para primitivos: es la forma liviana de envolver strings o números sin Proxy.

## ¿Para qué existe markRaw?
Para excluir un objeto del sistema reactivo: clases de librerías (charts, mapas, three.js) que no necesitan tracking y pueden romperse al envolverlas en un Proxy.

### porque
El Proxy puede interferir con getters internos o estado propio de la clase, además de sumar overhead. Error clásico: guardar una instancia de clase dentro de reactive y pelear contra warnings y comportamientos raros.

### distractores
- Para congelar el objeto: vuelve sus propiedades inmutables y de solo lectura.
- Para que el Proxy envuelva las clases de librerías de forma segura y se vuelvan reactivas.
- Para trackear solo el primer nivel del objeto: la versión superficial de reactive.

## ¿Por qué los composables empiezan con use?
Es una convención: le indica a humanos, linters y tooling que la función usa APIs reactivas de Vue y debe ejecutarse en el contexto sincrónico de setup.

### distractores
- Es obligatorio: Vue lanza error si un composable no empieza con `use`.
- Es el mecanismo de registro global: las funciones `use*` quedan disponibles en toda la app.
- Solo las funciones `use*` pueden crear refs reactivas en su interior.

## ¿Qué pasa si llamas onMounted después de un await en setup?
El hook no se registra: tras el await se perdió la instancia activa. Todos los composables deben correr de forma sincrónica antes del primer await.

### porque
Vue rastrea la "instancia actual" en una variable sincrónica durante setup; el await corta ese contexto y onMounted ya no sabe a qué componente pertenece. Error clásico: `await fetch()` arriba, hooks debajo — fallan en silencio.

### distractores
- Se registra igual, pero se dispara en el render siguiente al await.
- Vue lo reubica automáticamente antes del primer await para no perder la instancia.
- El hook queda registrado en el componente padre, que sí tiene instancia activa.

## ¿Un fetch va en setup directo o en onMounted?
Si no tocas el DOM, directo en setup (arranca antes y habilita async setup con Suspense). onMounted es para cuando necesitas elementos ya renderizados: medir, inicializar librerías visuales.

### porque
setup corre antes del primer render; onMounted después. Error clásico: demorar el fetch hasta onMounted por hábito de Options API, cuando el request ya podía arrancar en created/setup.

### distractores
- Siempre en onMounted: setup no admite operaciones asíncronas.
- Da igual: ambos corren en el mismo momento del ciclo de vida, solo cambia el nombre.
- En onBeforeMount: ese hook existe específicamente para disparar llamadas a API.

## ¿Qué simplifica defineModel?
Declarar un v-model en un componente propio: una sola macro expone la prop y el emit, sin escribir `modelValue` + `update:modelValue` a mano.

### porque
Antes necesitabas la prop, el emit y un computed puente; defineModel devuelve un ref que lees y escribes directo. Error clásico: seguir armando el par prop/emit manual en Vue ≥ 3.4.

### distractores
- Reemplaza `defineProps`: con una macro alcanza para declarar todas las props.
- Habilita v-model sin props ni emits: el hijo escribe directo la variable del padre.
- Es solo tipado: declara la forma del modelo en TypeScript sin crear la prop.

## ¿Qué te da KeepAlive?
Cachea la instancia de un componente dinámico: al volver a él conserva estado y DOM (form, scroll) sin re-ejecutar setup.

### porque
Alternar componentes los desmonta y remonta perdiendo todo; KeepAlive los desactiva en vez de destruirlos. Error clásico: esperar onMounted al volver — ahí se usan onActivated/onDeactivated.

### distractores
- Al volver, re-ejecuta setup y onMounted para reconstruir el estado cacheado.
- Guarda el estado pero destruye el DOM: al volver lo regenera desde cero.
- La caché persiste entre sesiones: el estado sobrevive incluso a una recarga de página.

## ¿Qué resuelve Suspense?
Mostrar un fallback mientras componentes asíncronos (con async setup) resuelven, en lugar de administrar un isLoading en cada uno.

### porque
Centraliza el estado de carga en el árbol: el fallback se muestra hasta que todos los descendientes async terminan. Ojo: sigue siendo experimental en Vue 3.

### distractores
- Capturar los errores de los componentes hijos: es el error boundary oficial de Vue.
- Retener la navegación hasta que resuelvan los guards: funciona como guard del router.
- Cargar los componentes async al montar la app para que el fallback nunca aparezca.

## ¿Para qué sirve defineAsyncComponent?
Cargar un componente recién cuando va a renderizarse, con placeholders de loading y error integrados: code-splitting a nivel componente.

### porque
Como una lazy route pero por pieza de UI: ideal para modals o widgets pesados que la mayoría nunca abre. Diferencia clave: el router divide por navegación, esto por render.

### distractores
- Registrar componentes globalmente cuando se usan por primera vez, vía `app.component` diferido.
- Cargar todos los componentes async al iniciar, para paralelizar las descargas.
- Es idéntico al lazy loading de rutas: no hay diferencia en qué dispara la descarga.

## ¿Dónde validas autenticación en Vue Router?
En guards: `beforeEach` global para auth de toda la app, `beforeEnter` para una ruta puntual. Corren antes de confirmar la navegación y pueden redirigir.

### porque
El guard se ejecuta antes de resolver los componentes async de la ruta: la vista protegida ni se descarga sin sesión. Error clásico: chequear auth en onMounted — el usuario ya recibió el componente.

### distractores
- En el `onMounted` de la vista protegida: sin sesión, redirigís ahí.
- En el guard `afterEach`: corre antes de confirmar la navegación y puede cancelarla.
- En un watcher global de la sesión en App.vue que bloquee el router entero.

## ¿Por qué cargar rutas con import() dinámico?
Lazy loading: cada vista se descarga al visitarla por primera vez, reduciendo el bundle inicial y el tiempo de primera carga.

### porque
Sin lazy, todas las vistas entran al bundle principal; `component: () => import(...)` genera un chunk por ruta pedido on-demand. Criterio: lazy para rutas secundarias, eager para las del flujo principal.

### distractores
- Para precargar todas las vistas en segundo plano mientras el usuario navega.
- Porque Vue Router no admite imports estáticos de componentes.
- Para que las vistas queden en caché de disco y la app funcione offline.

## ¿Pinia vs Vuex?
Pinia: stores independientes, sin mutations, TypeScript de primera y usable fuera de componentes. Vuex: un único store global con mutations obligatorias, el estándar de Vue 2.

### porque
Las mutations de Vuex eran indirección para el trackeo de devtools; Pinia logra lo mismo sin ceremonia y es el sucesor oficial en Vue 3. Error clásico: elegir Vuex en un proyecto nuevo "por costumbre".

### distractores
- Pinia también exige un único store global; la diferencia es solo el nombre.
- En Pinia las mutations son opcionales pero recomendadas para los devtools.
- Es al revés: Vuex es el sucesor oficial recomendado para proyectos Vue 3 nuevos.

## ¿Dónde va la lógica asíncrona en Pinia?
En los actions: pueden ser async, llamar APIs y modificar state. Los getters son derivados síncronos cacheados — nunca fetch ahí.

### porque
Los getters se comportan como computed: se recomputan según dependencias reactivas, un fetch adentro dispararía llamadas impredecibles. Error clásico: poner llamadas en getters "porque se ejecutan al renderizar".

### distractores
- En los getters: como están cacheados, el fetch se ejecuta una sola vez.
- En el state: declarás el valor como promesa y Pinia la resuelve sola.
- Fuera del store: el componente hace el fetch y actualiza con `$patch` directamente.

## ¿Qué es la hidratación en SSR?
El server envía HTML ya renderizado y visible; el cliente hidrata: adjunta listeners y estado reactivo sobre ese mismo HTML sin re-renderizar desde cero.

### porque
El HTML del server es markup estático: sin interactividad. Error clásico: mismatch entre el HTML del server y el primer render del cliente — produce warnings y fuerza re-render; el cliente debe generar markup idéntico.

### distractores
- El cliente descarta el HTML del server y lo regenera completo en el navegador.
- Hidratar es volver a pedir el HTML al server con los datos nuevos del usuario.
- Es cachear el HTML del server para servirlo instantáneo en las próximas visitas.

## ¿Qué optimiza el compilador de Vue que JSX no puede?
El template es analizable en compile time: hoisting del contenido estático, marcado de bloques dinámicos y patch de solo lo que cambió, sin diffear el árbol completo.

### porque
React re-ejecuta la función del componente y compara el virtual DOM entero; Vue sabe de antemano qué es estático y qué binding es dinámico. Error clásico: asumir que los virtual DOM de Vue y React trabajan igual.

### distractores
- JSX también optimiza el contenido estático en compile time; la diferencia es solo la sintaxis.
- Vue 3 elimina el virtual DOM: el compilador genera mutaciones directas al HTML.
- Vue memoiza la función del componente entera y solo la re-ejecuta al cambiar las props.
