---
deck: TypeScript — Entrevista
tags: [typescript, tipos, frontend]
fuente: Generado con prompts/generar-mazo.md
---

## ¿Qué es el structural typing?
TS compara por FORMA, no por nombre: si un objeto tiene las propiedades que el tipo pide, asigna. Dos tipos con distinto nombre e igual estructura son intercambiables.

### porque
Lenguajes nominales (Java, C#) exigen declarar la relación; TS la infiere del shape. Por eso un objeto literal puede pasar por una interface que nunca importó — y por qué un typo en una propiedad opcional compatible no se detecta (duck typing con compile-time).

## ¿unknown vs any?
`any` apaga el checker por completo. `unknown` es "cualquier cosa, pero verificá antes de usar": no se puede usar sin narrow primero.

### porque
`any` es una mentira de tipos: contagia (cualquier operación con any es any) y esconde errores hasta runtime. `unknown` te obliga a un type guard o check (`typeof`, `in`, instanceof) antes de tocar el valor — el error aparece en compile, donde es barato. Regla: `unknown` en fronteras (parsear JSON, respuestas externas), nunca `any`.

## ¿type vs interface?
`type` define cualquier forma (uniones, intersecciones, primitivas, condicionales). `interface` solo objetos, pero es extendible por declaración (`extends` y merging).

### porque
Con uniones y tipos utilitarios solo `type` llega. La ventaja real de `interface` es el declaration merging (bibliotecas que amplían tipos globales) y errores con nombre legible. En la práctica: `interface` para objetos públicos que otros extenderán, `type` para el resto — la consistencia del equipo importa más que la elección.

## ¿Qué son las discriminated unions y qué problema matan?
Uniones donde un campo literal (`type: "success" | "error"`) separa las variantes. El checker narrow automáticamente por ese campo.

### porque
Sin discriminante, unión de objetos = intersección de opcionales: `data` puede no existir en la variante error, pero TS no sabe cuál es cuál. Con `kind: "ok"`, el `if (r.kind === "ok")` estrecha a la variante exacta y el resto queda descartado. Es el patrón #1 para modelar resultados (`Result`, estados de UI, respuestas API) sin `null` sueltos ni asserts.

## ¿Qué hace `satisfies`?
Verifica que un valor cumpla un tipo SIN ensancharlo ni ensuciarlo: `const config = {...} satisfies Config` — error si viola, pero el tipo inferido se conserva.

### porque
La alternativa `: Config` ensancha las propiedades literales (el `"prod"` se vuelve `string`), perdiendo el narrow posterior. `as const` por su parte congela pero no valida. `satisfies` da las dos: valida contra el contrato y conserva los literales para quien lo consume.

## ¿Cómo funciona el narrowing?
TS estrecha el tipo por control flow: checks de `typeof`, igualdad con literales, `in`, `instanceof`, early returns y type guards.

### porque
Cada rama del código descarta variantes imposibles: después de `if (x === null) return`, `x` ya no es nullable. Sin narrowing, toda unión exigiría casts. Los user-defined guards (`function esFoo(x): x is Foo`) son la extensión natural: vos enseñás el check, TS hace el estrechamiento en todos los callsites.

## ¿Para qué sirve `never`?
El tipo de lo imposible: el valor que no puede existir. Aparece en funciones que tiran/loopean siempre, y en el fondo agotado de una unión.

### porque
Dos usos de oro: (1) return type de invariantes — si una función `assertNever(x: never)` compila sin quejas, cubriste TODAS las variantes; agregar una variante a la unión rompe el switch en compile. (2) Detección de ramas imposibles. Es el único tipo que asigna a todo y al que nada se le asigna.

## ¿Qué ganan los genéricos vs usar `any`?
`T` preserva la relación entrada↔salida: `identity<T>(x: T): T` devuelve lo mismo que entró, y el checker lo sabe.

### porque
Con `any`, la entrada y la salida quedan desconectadas: pasás un `User` y recibís "cualquier cosa" — el error aparece lejos del origen. El genérico es una variable de tipo que el checker RESUELVE por vos en cada llamada: misma reutilización, cero pérdida de información. Regla: `any` cuando no te importa, `unknown` cuando no sabés, `T` cuando querés que el que llama decida.

## ¿Qué hace `as const`?
Congela un literal: propiedades `readonly` y valores con el tipo literal exacto (`"GET"` en vez de `string`).

### porque
Sin él, un array de strings es `string[]` — no sabés cuántos ni cuáles. Con `as const`, `["a","b"]` es `readonly ["a","b"]`: sirve como tupla, y los valores se vuelven tipos (`typeof metodos[number]` da la unión exacta). Es el puente valor→tipo: constantes de config convertidas en tipos sin duplicarlas.

## ¿Qué resuelven los utility types (Partial, Pick, Omit)?
Derivar tipos de otros sin redeclarar: `UpdateUserDTO = Partial<Pick<User, "nombre" | "email">>`.

### porque
Duplicar shapes diverge: cambiás `User` y el DTO queda viejo, silenciosamente. Derivar mantiene una sola fuente de verdad — el cambio se propaga y el compile marca los callsites afectados. `Partial` modela updates, `Pick`/`Omit` DTOs y vistas, `Record` diccionarios: el 90% de los "tipos nuevos" son transformaciones de los que ya tenés.

## ¿Qué es la erasure de tipos y cuál es su límite?
TS borra todo tipo al compilar a JS: los tipos existen solo en compile-time. No podés chequear un tipo en runtime.

### porque
Por eso `if (x instanceof MiInterface)` es imposible — en runtime no hay interface. Las validaciones de frontera (JSON de una API) necesitan guards/zod/esquemas que generen VALOR + tipo. Es la división de trabajo: tipos para compile, esquemas para runtime, y el `satisfies`/`typeof` para que ambos cuenten la misma historia.

## ¿Qué garantiza `strict: true` y por qué no negarse?
Prende toda la familia de checks estrictos: `strictNullChecks`, `noImplicitAny`, `functionBoundChecks`, etc.

### porque
Sin `strictNullChecks`, `null` es asignable a todo: medio lenguaje de tipos se vuelve decoración. El costo (arreglar los nullables) se paga una vez; el beneficio (el `Object is possibly undefined` en compile en vez del crash del usuario) se cobra todos los días. Ningún proyecto serio arranca sin él.

## ¿keyof e indexed access — para qué sirven?
`keyof T` es la unión de las keys de T; `T["k"]` el tipo de esa key. Juntos hacen tipos que siguen la forma de otro.

### porque
`function get<T, K extends keyof T>(o: T, k: K): T[K]` — la firma garantiza key válida Y devuelve el tipo exacto de esa key. Cambiás el objeto y todo se rearma: es tipado dependiente de la forma, no del nombre. Base de APIs tipadas sin duplicación.

## ¿Qué es una conditional type y cuándo se justifica?
Un tipo que bifurca por otra condición: `T extends string ? ... : ...`. El checker resuelve la rama por sustitución.

### porque
Permite APIs que adaptan su tipo al uso (`Awaited<T>` que desenvuelve promesas anidadas). Cuándo NO: cuando una función sobrecargada o un genérico simple llegan — las conditionals anidadas se vuelven criptogramas que nadie en el equipo logra depurar. Regla práctica: una conditional, un nivel, con nombre que explique la intención.
