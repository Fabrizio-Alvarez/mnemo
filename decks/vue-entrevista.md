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
