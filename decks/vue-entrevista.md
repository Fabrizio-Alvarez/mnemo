---
deck: Vue 3 — Entrevista
tags: [vue, frontend, javascript]
fuente: Guía de estudio Laravel+Vue (proyecto Supermercado DDD)
---

## ¿Qué es la reactividad en Vue?
Vue intercepta el acceso a variables reactivas. Cuando cambian, re-renderiza las partes del DOM que dependen de ellas.

## ¿ref vs reactive?
`ref` envuelve un valor, necesita `.value`. `reactive` hace reactivo un objeto, sin `.value`, pero pierde reactividad al desestructurar.

## ¿computed vs method?
`computed` deriva valor del estado, tiene cache. `method` es acción/evento, sin cache.

## ¿Cuándo usas watch?
Para side effects cuando algo cambia (animaciones, API calls, localStorage). No para derivar valores.

## ¿Props hacia dónde van?
Padre → Hijo (hacia abajo). El hijo no puede mutar sus props.

## ¿Cómo el hijo le habla al padre?
Emits. `defineEmits(['evento'])` en el hijo, `@evento="handler"` en el padre.

## ¿Qué es un composable?
Función que retorna estado y lógica reutilizable. Extrae lógica del componente sin repetirla.

## ¿Cómo compartes estado global sin Pinia?
Composable con estado externo (patrón singleton). El estado se declara fuera de la función.

## ¿Para qué sirven los slots?
Composición. El hijo define la estructura, el padre inyecta el contenido.

## ¿v-if vs v-show?
`v-if` quita el elemento del DOM. `v-show` usa `display: none`. v-if más costoso al inicio, v-show al toggle.

## ¿Por qué v-for necesita :key?
Para que Vue rastree elementos al reordenar/agregar/eliminar. Debe ser único y estable (ID, no índice).

## ¿Qué hace v-model?
Two-way binding. Es azúcar para `:value="x" @input="x = $event.target.value"`.

## ¿Para qué sirve Teleport?
Renderiza el HTML en otro punto del DOM (body). Útil para modals y toasts que no deben quedar limitados por overflow/z-index del padre.

## ¿Transition vs TransitionGroup?
`Transition` = un elemento (show/hide). `TransitionGroup` = lista de elementos (v-for), con animación de reordenamiento.

## ¿Qué hook usas para limpiar listeners?
`onUnmounted` (Composition API). Ahí quitas event listeners y cancelas timers.

## ¿Cuándo conviene la Composition API sobre la Options API?
Cuando el componente tiene mucha lógica que quieres agrupar por feature o extraer a composables. Para componentes chicos, la Options API sigue siendo perfectamente válida.

### porque
Options ordena el código por tipo (data, methods, computed), dispersando una feature en varias secciones; Composition la mantiene junta. Error clásico: creer que Options API está deprecada en Vue 3 — ambas se mantienen.

## ¿watch vs watchEffect?
`watch` observa fuentes declaradas explícitamente y recibe valor nuevo y viejo. `watchEffect` corre de inmediato y autodetecta dependencias, pero no ve el valor anterior.

### porque
Criterio: si necesitas el valor previo o controlar qué mirar → watch; si el efecto y sus dependencias son obvios → watchEffect. Error clásico: watchEffect para llamadas a API: se re-ejecuta por cualquier dependencia que toque.

## ¿Qué problema de props resuelve provide/inject?
El props drilling: deja de pasar datos por componentes intermedios que no los usan. Un ancestro hace `provide` y cualquier descendiente lejano hace `inject`.

### porque
Criterio: props para contratos padre→hijo visibles; provide/inject para theme, auth o i18n que cruzan muchos niveles. Error clásico: usarlo para estado de negocio general — vuelve invisible el flujo de datos.

## ¿Qué es un scoped slot?
Un slot donde el hijo expone datos hacia el contenido: el padre recibe esas variables y decide cómo renderizarlas (por ejemplo, cada ítem de una lista).

### porque
Invierte la dirección del slot normal: el hijo comparte su estado interno y el padre personaliza el render. Error clásico: armar cadenas de props/emits para que el padre pueda customizar cómo se dibuja un ítem del hijo.

## ¿Dónde no llega la reactividad de Vue 3?
Al destructurar un `reactive` (obtienes el valor crudo, sin Proxy) y a todo dato no envuelto en ref/reactive: se intercepta el acceso a propiedades, no variables sueltas.

### porque
Vue 3 envuelve el objeto en un Proxy que intercepta get/set. `const { items } = state` lee una vez y guarda el valor plano fuera del Proxy. Error clásico: destructurar reactive en setup y esperar que el template se actualice.

## ¿Cuándo elegirías shallowRef?
Con estructuras grandes o de terceros (árboles de datos, instancias de canvas) donde solo quieres re-disparar al reemplazar `.value` completo, sin trackear mutaciones internas.

### porque
Un ref profundo convierte cada nivel del objeto en reactivo: costo innecesario si nunca mutas por dentro. shallowRef solo dispara con `.value = nuevo`. Error clásico: mutar el objeto interno de un shallowRef y esperar que el DOM se actualice.

## ¿Para qué existe markRaw?
Para excluir un objeto del sistema reactivo: clases de librerías (charts, mapas, three.js) que no necesitan tracking y pueden romperse al envolverlas en un Proxy.

### porque
El Proxy puede interferir con getters internos o estado propio de la clase, además de sumar overhead. Error clásico: guardar una instancia de clase dentro de reactive y pelear contra warnings y comportamientos raros.

## ¿Por qué los composables empiezan con use?
Es una convención: le indica a humanos, linters y tooling que la función usa APIs reactivas de Vue y debe ejecutarse en el contexto sincrónico de setup.

## ¿Qué pasa si llamas onMounted después de un await en setup?
El hook no se registra: tras el await se perdió la instancia activa. Todos los composables deben correr de forma sincrónica antes del primer await.

### porque
Vue rastrea la "instancia actual" en una variable sincrónica durante setup; el await corta ese contexto y onMounted ya no sabe a qué componente pertenece. Error clásico: `await fetch()` arriba, hooks debajo — fallan en silencio.

## ¿Un fetch va en setup directo o en onMounted?
Si no tocas el DOM, directo en setup (arranca antes y habilita async setup con Suspense). onMounted es para cuando necesitas elementos ya renderizados: medir, inicializar librerías visuales.

### porque
setup corre antes del primer render; onMounted después. Error clásico: demorar el fetch hasta onMounted por hábito de Options API, cuando el request ya podía arrancar en created/setup.

## ¿Qué simplifica defineModel?
Declarar un v-model en un componente propio: una sola macro expone la prop y el emit, sin escribir `modelValue` + `update:modelValue` a mano.

### porque
Antes necesitabas la prop, el emit y un computed puente; defineModel devuelve un ref que lees y escribes directo. Error clásico: seguir armando el par prop/emit manual en Vue ≥ 3.4.

## ¿Qué te da KeepAlive?
Cachea la instancia de un componente dinámico: al volver a él conserva estado y DOM (form, scroll) sin re-ejecutar setup.

### porque
Alternar componentes los desmonta y remonta perdiendo todo; KeepAlive los desactiva en vez de destruirlos. Error clásico: esperar onMounted al volver — ahí se usan onActivated/onDeactivated.

## ¿Qué resuelve Suspense?
Mostrar un fallback mientras componentes asíncronos (con async setup) resuelven, en lugar de administrar un isLoading en cada uno.

### porque
Centraliza el estado de carga en el árbol: el fallback se muestra hasta que todos los descendientes async terminan. Ojo: sigue siendo experimental en Vue 3.

## ¿Para qué sirve defineAsyncComponent?
Cargar un componente recién cuando va a renderizarse, con placeholders de loading y error integrados: code-splitting a nivel componente.

### porque
Como una lazy route pero por pieza de UI: ideal para modals o widgets pesados que la mayoría nunca abre. Diferencia clave: el router divide por navegación, esto por render.

## ¿Dónde validas autenticación en Vue Router?
En guards: `beforeEach` global para auth de toda la app, `beforeEnter` para una ruta puntual. Corren antes de confirmar la navegación y pueden redirigir.

### porque
El guard se ejecuta antes de resolver los componentes async de la ruta: la vista protegida ni se descarga sin sesión. Error clásico: chequear auth en onMounted — el usuario ya recibió el componente.

## ¿Por qué cargar rutas con import() dinámico?
Lazy loading: cada vista se descarga al visitarla por primera vez, reduciendo el bundle inicial y el tiempo de primera carga.

### porque
Sin lazy, todas las vistas entran al bundle principal; `component: () => import(...)` genera un chunk por ruta pedido on-demand. Criterio: lazy para rutas secundarias, eager para las del flujo principal.

## ¿Pinia vs Vuex?
Pinia: stores independientes, sin mutations, TypeScript de primera y usable fuera de componentes. Vuex: un único store global con mutations obligatorias, el estándar de Vue 2.

### porque
Las mutations de Vuex eran indirección para el trackeo de devtools; Pinia logra lo mismo sin ceremonia y es el sucesor oficial en Vue 3. Error clásico: elegir Vuex en un proyecto nuevo "por costumbre".

## ¿Dónde va la lógica asíncrona en Pinia?
En los actions: pueden ser async, llamar APIs y modificar state. Los getters son derivados síncronos cacheados — nunca fetch ahí.

### porque
Los getters se comportan como computed: se recomputan según dependencias reactivas, un fetch adentro dispararía llamadas impredecibles. Error clásico: poner llamadas en getters "porque se ejecutan al renderizar".

## ¿Qué es la hidratación en SSR?
El server envía HTML ya renderizado y visible; el cliente hidrata: adjunta listeners y estado reactivo sobre ese mismo HTML sin re-renderizar desde cero.

### porque
El HTML del server es markup estático: sin interactividad. Error clásico: mismatch entre el HTML del server y el primer render del cliente — produce warnings y fuerza re-render; el cliente debe generar markup idéntico.

## ¿Qué optimiza el compilador de Vue que JSX no puede?
El template es analizable en compile time: hoisting del contenido estático, marcado de bloques dinámicos y patch de solo lo que cambió, sin diffear el árbol completo.

### porque
React re-ejecuta la función del componente y compara el virtual DOM entero; Vue sabe de antemano qué es estático y qué binding es dinámico. Error clásico: asumir que los virtual DOM de Vue y React trabajan igual.
