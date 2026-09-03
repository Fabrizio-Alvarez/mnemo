---
deck: TypeScript — Entrevista
tags: [typescript, tipos, frontend]
fuente: Generado con prompts/generar-mazo.md
---

## ¿Qué es el structural typing?
TS compara por FORMA, no por nombre: si un objeto tiene las propiedades que el tipo pide, asigna. Dos tipos con distinto nombre e igual estructura son intercambiables.

### porque
Lenguajes nominales (Java, C#) exigen declarar la relación; TS la infiere del shape. Por eso un objeto literal puede pasar por una interface que nunca importó — y por qué un typo en una propiedad opcional compatible no se detecta (duck typing con compile-time).

### distractores
- Compara por nombre de tipo: dos tipos con distinto nombre jamás son intercambiables.
- Exige que el objeto declare `implements` para poder asignarse a una interface.
- Verifica identidad de referencia en runtime: solo asigna si es la misma instancia.

## ¿unknown vs any?
`any` apaga el checker por completo. `unknown` es "cualquier cosa, pero verificá antes de usar": no se puede usar sin narrow primero.

### porque
`any` es una mentira de tipos: contagia (cualquier operación con any es any) y esconde errores hasta runtime. `unknown` te obliga a un type guard o check (`typeof`, `in`, instanceof) antes de tocar el valor — el error aparece en compile, donde es barato. Regla: `unknown` en fronteras (parsear JSON, respuestas externas), nunca `any`.

### distractores
- `unknown` es un alias cosmético de `any`: acepta cualquier operación, solo suena más seguro.
- `any` apaga el chequeo solo de esa variable: el resto de la expresión se sigue verificando.
- La diferencia vive en runtime: `unknown` valida el tipo real cuando el código ejecuta.

## ¿type vs interface?
`type` define cualquier forma (uniones, intersecciones, primitivas, condicionales). `interface` solo objetos, pero es extendible por declaración (`extends` y merging).

### porque
Con uniones y tipos utilitarios solo `type` llega. La ventaja real de `interface` es el declaration merging (bibliotecas que amplían tipos globales) y errores con nombre legible. En la práctica: `interface` para objetos públicos que otros extenderán, `type` para el resto — la consistencia del equipo importa más que la elección.

### distractores
- `type` también admite declaration merging; `interface` no acepta `extends`.
- `interface` modela uniones y primitivas igual que `type`: difieren solo en estilo.
- `type` es un simple renombre: no admite uniones, intersecciones ni conditional types.

## ¿Qué son las discriminated unions y qué problema matan?
Uniones donde un campo literal (`type: "success" | "error"`) separa las variantes. El checker narrow automáticamente por ese campo.

### porque
Sin discriminante, unión de objetos = intersección de opcionales: `data` puede no existir en la variante error, pero TS no sabe cuál es cuál. Con `kind: "ok"`, el `if (r.kind === "ok")` estrecha a la variante exacta y el resto queda descartado. Es el patrón #1 para modelar resultados (`Result`, estados de UI, respuestas API) sin `null` sueltos ni asserts.

### distractores
- Uniones donde cada variante declara TODAS las propiedades de las demás, para leer cualquier campo seguro.
- Uniones que TS estrecha por el nombre del tipo declarado, sin campo discriminante.
- Uniones de objetos que heredan de una interface base común: la base hace de discriminante.

## ¿Qué hace `satisfies`?
Verifica que un valor cumpla un tipo SIN ensancharlo ni ensuciarlo: `const config = {...} satisfies Config` — error si viola, pero el tipo inferido se conserva.

### porque
La alternativa `: Config` ensancha las propiedades literales (el `"prod"` se vuelve `string`), perdiendo el narrow posterior. `as const` por su parte congela pero no valida. `satisfies` da las dos: valida contra el contrato y conserva los literales para quien lo consume.

### distractores
- Castea el valor al tipo declarado, ensanchando los literales igual que `: Config`.
- Congela el valor: lo deja `readonly` como un `as const` que además valida.
- Valida en runtime: tira una excepción si el valor viola el tipo al ejecutar.

## ¿Cómo funciona el narrowing?
TS estrecha el tipo por control flow: checks de `typeof`, igualdad con literales, `in`, `instanceof`, early returns y type guards.

### porque
Cada rama del código descarta variantes imposibles: después de `if (x === null) return`, `x` ya no es nullable. Sin narrowing, toda unión exigiría casts. Los user-defined guards (`function esFoo(x): x is Foo`) son la extensión natural: vos enseñás el check, TS hace el estrechamiento en todos los callsites.

### distractores
- Castear el valor con `as` al tipo esperado para que compile.
- Re-declarar el tipo de la variable más amplio para cubrir todos los casos.
- Solo los type guards (`x is T`) estrechan; `typeof`, `in` e `instanceof` por sí solos no.

## ¿Para qué sirve `never`?
El tipo de lo imposible: el valor que no puede existir. Aparece en funciones que tiran/loopean siempre, y en el fondo agotado de una unión.

### porque
Dos usos de oro: (1) return type de invariantes — si una función `assertNever(x: never)` compila sin quejas, cubriste TODAS las variantes; agregar una variante a la unión rompe el switch en compile. (2) Detección de ramas imposibles. Es el único tipo que asigna a todo y al que nada se le asigna.

### distractores
- El return type de las funciones que devuelven `undefined` (el "no devuelve nada").
- El tipo de las variables declaradas sin valor asignado (`undefined` implícito).
- Un marcador que TS inserta en el JS emitido para las ramas imposibles.

## ¿Qué ganan los genéricos vs usar `any`?
`T` preserva la relación entrada↔salida: `identity<T>(x: T): T` devuelve lo mismo que entró, y el checker lo sabe.

### porque
Con `any`, la entrada y la salida quedan desconectadas: pasás un `User` y recibís "cualquier cosa" — el error aparece lejos del origen. El genérico es una variable de tipo que el checker RESUELVE por vos en cada llamada: misma reutilización, cero pérdida de información. Regla: `any` cuando no te importa, `unknown` cuando no sabés, `T` cuando querés que el que llama decida.

### distractores
- `T` es azúcar sintáctico de `any`: en compile ambos borran la información igual.
- El compiler genera una copia especializada por cada tipo usado, como los templates de C++.
- Reifican el tipo: dentro de la función podés hacer `x instanceof T`.

## ¿Qué hace `as const`?
Congela un literal: propiedades `readonly` y valores con el tipo literal exacto (`"GET"` en vez de `string`).

### porque
Sin él, un array de strings es `string[]` — no sabés cuántos ni cuáles. Con `as const`, `["a","b"]` es `readonly ["a","b"]`: sirve como tupla, y los valores se vuelven tipos (`typeof metodos[number]` da la unión exacta). Es el puente valor→tipo: constantes de config convertidas en tipos sin duplicarlas.

### distractores
- Aplica `Object.freeze` en runtime: el objeto no se puede mutar al ejecutar.
- Deja las propiedades `readonly` pero ensancha los literales (`"GET"` pasa a `string`).
- Solo aplica a arrays y objetos: sobre un string o número suelto no tiene efecto.

## ¿Qué resuelven los utility types (Partial, Pick, Omit)?
Derivar tipos de otros sin redeclarar: `UpdateUserDTO = Partial<Pick<User, "nombre" | "email">>`.

### porque
Duplicar shapes diverge: cambiás `User` y el DTO queda viejo, silenciosamente. Derivar mantiene una sola fuente de verdad — el cambio se propaga y el compile marca los callsites afectados. `Partial` modela updates, `Pick`/`Omit` DTOs y vistas, `Record` diccionarios: el 90% de los "tipos nuevos" son transformaciones de los que ya tenés.

### distractores
- `Pick` excluye las keys que le pasás; `Omit` selecciona las que le pasás.
- `Partial` marca todas las propiedades como `readonly` en vez de opcionales.
- Crean un tipo desconectado: cambiar `User` no toca el DTO derivado.

## ¿Qué es la erasure de tipos y cuál es su límite?
TS borra todo tipo al compilar a JS: los tipos existen solo en compile-time. No podés chequear un tipo en runtime.

### porque
Por eso `if (x instanceof MiInterface)` es imposible — en runtime no hay interface. Las validaciones de frontera (JSON de una API) necesitan guards/zod/esquemas que generen VALOR + tipo. Es la división de trabajo: tipos para compile, esquemas para runtime, y el `satisfies`/`typeof` para que ambos cuenten la misma historia.

### distractores
- El JS emitido incluye asserts que validan los tipos al ejecutar.
- Las interfaces se borran, pero `type` y enums viajan como metadata al bundle.
- `typeof` sobre una interface te deja chequear el tipo en runtime.

## ¿Qué garantiza `strict: true` y por qué no negarse?
Prende toda la familia de checks estrictos: `strictNullChecks`, `noImplicitAny`, `functionBoundChecks`, etc.

### porque
Sin `strictNullChecks`, `null` es asignable a todo: medio lenguaje de tipos se vuelve decoración. El costo (arreglar los nullables) se paga una vez; el beneficio (el `Object is possibly undefined` en compile en vez del crash del usuario) se cobra todos los días. Ningún proyecto serio arranca sin él.

### distractores
- Solo prende `strictNullChecks`; `noImplicitAny` y el resto se activan uno por uno.
- Es lo mismo que `alwaysStrict`: apenas emite `'use strict'` al inicio del archivo.
- Solo afecta código sin anotar: con tipos explícitos estos checks no aplican.

## ¿keyof e indexed access — para qué sirven?
`keyof T` es la unión de las keys de T; `T["k"]` el tipo de esa key. Juntos hacen tipos que siguen la forma de otro.

### porque
`function get<T, K extends keyof T>(o: T, k: K): T[K]` — la firma garantiza key válida Y devuelve el tipo exacto de esa key. Cambiás el objeto y todo se rearma: es tipado dependiente de la forma, no del nombre. Base de APIs tipadas sin duplicación.

### distractores
- Devuelve un array con los nombres de las keys, iterable en runtime.
- `T["k"]` lee el valor de la propiedad `k` del objeto en runtime.
- Solo funciona sobre interfaces: con `type` hay que listar las keys a mano.

## ¿Qué es una conditional type y cuándo se justifica?
Un tipo que bifurca por otra condición: `T extends string ? ... : ...`. El checker resuelve la rama por sustitución.

### porque
Permite APIs que adaptan su tipo al uso (`Awaited<T>` que desenvuelve promesas anidadas). Cuándo NO: cuando una función sobrecargada o un genérico simple llegan — las conditionals anidadas se vuelven criptogramas que nadie en el equipo logra depurar. Regla práctica: una conditional, un nivel, con nombre que explique la intención.

### distractores
- Se evalúa en runtime: elige la rama según el valor real del dato.
- El ternario de valores con tipado extra: `cond ? a : b` aplicado a los datos.
- Devuelve ambas ramas a la vez: el caller recibe la intersección de las dos.

## ¿Qué garantía real da `readonly` y dónde termina?
Solo compile-time: bloquea reasignación/mutación en código tipado, pero no congela nada en runtime ni protege de alias mutables.

### porque
Error clásico: confundir `readonly` con inmutabilidad. Otro código con la misma referencia sin el flag puede mutar el array igual; y `Object.freeze` da justo lo contrario (runtime, sin chequeo en compile). Criterio: `readonly` es documentación de la interfaz ("esto no se toca"); la inmutabilidad real se resuelve en la frontera con copias o estructuras inmutables.

### distractores
- Congela el valor: mutarlo tira error cuando el código ejecuta.
- Protege los alias: ninguna referencia al mismo objeto puede mutarlo.
- Copia el valor al asignarlo: la vista readonly y el original divergen.

## ¿Qué problema resuelven `?.` y `??` que `&&` y `||` no?
`?.` recorre una ruta profunda cortando en nullish sin crash; `??` aplica el default SOLO con null/undefined, no con cualquier falsy.

### porque
El bug clásico es `valor || default` pisando un `0`, `""` o `false` legítimo: `||` no distingue "ausente" de "falso/cero/vacío", `??` sí. Y `obj && obj.a && obj.a.b` además estrecha mal el tipo. Criterio: si el cero o la cadena vacía son valores válidos, `??` es obligatorio.

### distractores
- `??` aplica el default ante cualquier falsy (`0`, `""`, `false`), igual que `||`.
- `?.` corta la ruta también con `0`, `""` y `false`, no solo con nullish.
- `||` y `??` son equivalentes: cambia la legibilidad, no la semántica.

## ¿Cuándo una tuple y no un array?
Cuando la posición es contrato: longitud fija y un tipo por índice (`[string, number]`), vs el array de cantidad abierta y un solo tipo.

### porque
`useState` devuelve `[estado, setter]`: cada posición significa algo distinto — un array común no puede expresar eso. Error clásico: modelar pares o triples como `any[]` y perder todo el chequeo. Bonus: con `as const` la tuple pasa a `readonly` y sus valores sirven como unión (`typeof tupla[number]`).

### distractores
- Un array que mezcla tipos con longitud libre: se puede pushear y crecer.
- `string | number[]` equivale a `[string, number]`: unión y tuple son lo mismo.
- Fija la longitud en runtime: un push de más tira error al ejecutar.

## ¿Enum o unión de literales — cuándo cada uno?
Unión de literales para valores que viven solo en tipos; enum únicamente si necesitás el objeto en runtime (iterar constantes, agruparlas).

### porque
El enum regular EMITE JavaScript — de las pocas construcciones que rompen la erasure — y trae sorpresas: reverse mapping en los numéricos, que además aceptan números fuera del rango declarado. Un `as const` + `typeof` da lo mismo con cero runtime y mejor narrowing. El parche histórico (`const enum`) es el que peor lleva `isolatedModules` y los bundlers.

### distractores
- El enum no emite JavaScript: se borra igual que una unión de literales.
- La unión de literales genera un objeto iterable en runtime con los valores.
- `const enum` es la opción que mejor lleva `isolatedModules` y los bundlers.

## ¿Namespaces o modules — por qué ganaron los modules?
Modules (`import`/`export`) para todo código moderno; los namespaces son el agrupamiento de la era pre-ESModules.

### porque
El module es estático: tree-shaking del bundler, scope por archivo, tipos que siguen a los valores. El namespace es un objeto runtime — se carga completo, no se sacude y reintroduce colisiones globales. Sobrevive solo en lo ambient (`.d.ts` legados, `declare global`); para código nuevo, nunca.

### distractores
- El namespace tree-shakea: el bundler elimina lo no usado; el module se carga completo.
- El module vive solo en compile; el namespace es el único que comparte código en runtime.
- Los namespaces aislan por archivo; los modules colisionan en el scope global.

## ¿Qué son los `.d.ts` y los paquetes `@types/...`?
Declaraciones sin implementación: describen la superficie pública de código JS para que el checker lo entienda. `@types/*` (DefinitelyTyped) las provee para libs que no traen tipos propios.

### porque
Por la erasure, una lib JS sin declaración es territorio `any`: el `.d.ts` es el contrato que cierra ese hueco. Detalle que se pregunta: TS los descubre vía `typeRoots`/campo `types` del tsconfig, y si la lib declara sus propios tipos en el package.json, instalar `@types` sobra o directamente choca con los reales.

### distractores
- Contienen la implementación minimizada de la lib, que el checker ejecuta para validar.
- Instalar `@types/foo` reemplaza al paquete: sobra instalar `foo`.
- TS solo los carga si los importás explícito en cada archivo que los usa.

## ¿target, lib y module en tsconfig — qué decide cada uno?
`target` = sintaxis del JS emitido; `lib` = qué APIs se asume que existen en runtime; `module` = formato de módulos del output.

### porque
Error clásico: `target: es5` con `lib` moderna — la sintaxis se transpila pero `Array.prototype.at` no existe en ese runtime, y TS no avisa porque le juraste que sí. Son perillas independientes: alineá `lib` con el runtime real (navegadores soportados, versión de Node), no con el target.

### distractores
- `target` define qué APIs existen en runtime; `lib` transpila la sintaxis del output.
- `lib` es el alias moderno de `target`: la misma perilla con otro nombre.
- `module` decide qué APIs del entorno (DOM, Node) hay disponibles, no el formato del output.

## ¿`import type` vs `import` — cuándo hace falta?
`import type { User }` trae solo el tipo: TS lo borra entero del output. El import común puede dejar código del módulo ejecutando en el bundle final.

### porque
Dos motivos: los builds con `verbatimModuleSyntax`/`isolatedModules` lo exigen (el transformador file-by-file no puede adivinar si el nombre es valor o tipo), y evitar efectos: importar una clase solo para tipar termina ejecutando su módulo. Regla: si el nombre solo aparece en posiciones de tipo, `import type`.

### distractores
- El import común también se borra si el nombre solo aparece en posiciones de tipo: `import type` es puro estilo.
- Carga el módulo lazy: lo ejecuta la primera vez que el tipo se usa.
- Solo sirve para interfaces; clases y `type` piden import común.

## ¿Function overloads o parámetros con unión — cuándo cada uno?
Overloads cuando el retorno depende de la combinación de argumentos (`(x: string) → number`, `(x: number) → string`); unión cuando el cuerpo maneja todas las variantes igual.

### porque
`f(x: string | number): string | number` miente: habilita `string → number` aunque esa combinación no exista en runtime. Los overloads enumeran las flechas válidas. Error clásico: escalar a diez firmas para lo que resuelve un genérico — el overloading es la última herramienta, no la primera.

### distractores
- `(x: string | number): string | number` expresa lo mismo: toda combinación de esa firma es válida.
- TS despacha en runtime: la función elige la rama según el tipo real del argumento.
- Los overloads son la primera opción; la unión de parámetros solo sirve para primitivos.

## ¿void vs undefined como return type?
`void` = "ignorá el retorno"; `undefined` = "devuelve undefined, y ese valor puede importarle a alguien".

### porque
Con `() => void` podés pasar un callback que devuelva cualquier cosa (por eso `forEach` acepta funciones que retornan valores); con `() => undefined` el retorno debe ser exactamente undefined y rompés todos los callsites. Error clásico: tipar callbacks como `() => undefined` "por precisión" y dispararse en el pie.

### distractores
- Son sinónimos: `() => void` y `() => undefined` aceptan los mismos callbacks.
- `void` prohíbe todo `return` dentro de la función.
- `undefined` es la versión flexible: un callback `() => undefined` acepta cualquier retorno y lo descarta.

## ¿`object` o `Record<string, unknown>` para "un objeto cualquiera"?
`Record<string, unknown>`: deja leer cada propiedad previo narrow. `object` solo excluye primitivas — después no podés acceder a nada sin cast.

### porque
`object` es casi inerte: asignable pero inútil para usar. `Record<string, unknown>` es el "objeto cualquiera honesto", el mismo espíritu que unknown vs any: obliga a verificar antes de tocar. Error clásico: caer en `Record<string, any>` para que no moleste — reintroduce el contagio de any en toda la frontera.

### distractores
- `object` permite leer cualquier propiedad como `unknown` previo narrow.
- `Record<string, unknown>` exige declarar las keys antes de accederlas.
- `object` acepta también `null` y `undefined`: es el supertipo de todos los valores.

## ¿Para qué sirve el default de un genérico (`T = X`)?
Cubre el caso común sin parámetro: `Resp<T = Datos>` se escribe `Resp` a secas, y quien necesita otro tipo lo pasa explícito.

### porque
Sin default, todo uso sin inferencia posible es error de compilación; con default, el 90% de los callsites escribe menos. Es la misma economía que los parámetros por defecto en funciones: achicás la firma del caso frecuente sin cerrar la puerta al raro. El anti-patrón gemelo: dos tipos casi iguales (`Resp` y `RespDatos`) en vez de un default.

### distractores
- Congela el parámetro: `Resp` deja de aceptar cualquier otro tipo que `Datos`.
- Fallback de runtime: si el argumento no es del tipo, se usa `Datos` al ejecutar.
- Es solo documentación: el checker igual exige pasar `T` en cada uso.

## ¿Qué son los mapped types y qué hacen los modifiers `?` y `-?`?
Un tipo que transforma propiedad por propiedad: `{ [K in keyof T]: ... }`. Los modifiers agregan (`?`, `readonly`) o quitan (`-?`, `-readonly`) rasgos de a uno.

### porque
`Partial` es ese mapped con `?` y `Required` es el mismo con `-?`: los utility types son mapped types de fábrica. Lo que sorprende en entrevistas es el `-`: no solo se suma opcionalidad, también se saca. Criterio: cuando un utility no llega, el mapped type es el nivel justo — más abajo duplicás shapes, más arriba escribís criptogramas.

### distractores
- `-?` vuelve la propiedad opcional: el `-` es notación alternativa del `+`.
- Los modifiers solo agregan rasgos: quitar `readonly` exige redeclarar el shape.
- Transforman los valores del objeto en runtime, como `Array.prototype.map`.

## ¿Qué resuelven los template literal types?
Arman tipos string por composición: `` `hola ${Nombre}` `` expande la unión de nombres en la unión de saludos exactos.

### porque
Es tipado de FORMATO en compile: rutas (`/${string}/articulos`), eventos (`on${Capitalize<K>}`), claves derivadas de unions. Error clásico: usarlos como validación arbitraria — no son regex; brillan en combinatoria finita de literales, no en parsing (eso es territorio de esquemas en runtime).

### distractores
- Validan el formato del valor en runtime: un regex con tipado.
- Generan y concatenan todos los strings posibles: el resultado es un `string` común.
- Equivalen al template literal de JS: misma operación, solo que anotada.

## ¿Qué papel cumple `infer` en una conditional type?
Nombra y captura un tipo dentro del match: `T extends Promise<infer U> ? U : never` destila la U de la promesa.

### porque
Es el pattern matching de tipos: en vez de escribir el tipo esperado, lo declarás variable y lo reusás en la rama true — así están hechos `ReturnType` (infer R en la firma) y `Awaited` (infer U recursivo). Sin infer, una conditional solo clasifica; con infer, extrae. Límite: solo existe dentro del `extends` de una conditional.

### distractores
- Declara un parámetro de tipo que el llamador debe pasar explícito.
- Infiere inspeccionando el valor en runtime para resolver la `U`.
- Se puede declarar en cualquier anotación, no solo dentro del `extends` de una conditional.

## ¿Qué es un branded type y cuándo se justifica?
Un primitivo con marca fantasma: `type UserId = string & { __brand: "UserId" }` — estructuralmente string, pero ya no intercambiable con cualquier otro string.

### porque
TS es structural: `UserId` y `OrderId` como strings simples son fungibles, y confundirlos es un bug invisible para el checker. La marca vive solo en tipos, nunca se asigna en runtime. Criterio: brandear donde cruzar cables duela de verdad (IDs, dinero, unidades); brandear todo convierte la ventaja en burocracia.

### distractores
- La marca existe en runtime: el objeto emitido lleva el campo `__brand` real.
- Vuelve TS nominal de raíz: ningún string se asigna a `UserId` ni con cast.
- Declara los únicos valores válidos: un string fuera de la lista no compila.

## ¿Qué cambia un const type parameter (`<T extends const>`)?
La inferencia del argumento se vuelve literal y readonly sin que cada callsite escriba `as const`.

### porque
Antes, `crearPar("a", "b")` infería `string[]` y perdía la aridad — la disciplina del `as const` vivía en quien llama y se olvidaba siempre. Con `T extends const`, la API declara la intención una vez y la hereda todo el mundo: la responsabilidad pasa del callsite al diseñador de la API.

### distractores
- Exige que cada llamada escriba `as const`: sin él, el argumento no compila.
- Aplica `readonly` al retorno de la función, no a los argumentos que recibe.
- Infiere el literal exacto pero deja el valor mutuable: omite el `readonly`.

## ¿Qué significan las variance annotations `in` y `out`?
`in` marca contravarianza (T se consume), `out` covarianza (T se produce): `interface Fuente<out T> { leer(): T }`.

### porque
TS infiere la varianza solo; anotarla la vuelve contrato verificado: si un cambio futuro agrega un método que consume T, `out` rompe en compile en vez de degradar en silencio. Es documentación ejecutable — valiosa en librerías genéricas públicas, ruido en app code sin contrato estable que proteger.

### distractores
- `out` marca contravarianza (T se consume) e `in` covarianza (T se produce).
- Son documentación sola: el checker no las verifica.
- Sin anotar, TS asume invarianza total: `in`/`out` relajan el chequeo por defecto.

## ¿Qué es una assertion function (`asserts x is T`)?
Una función que, si no tira, estrecha el argumento hacia adelante: `assertEsUser(x)` y de ahí en más `x` es `User`.

### porque
Combina validación runtime con narrowing compile, ideal para invariantes de frontera: parseás una vez, confiás después. Contra la guard (`x is T`) la diferencia es de control: la guard devuelve boolean para un if, la assertion corta el flujo si falla. Error clásico: cuerpo que no throwea — TS confía igual; la assertion es una promesa, no un chequeo.

### distractores
- Devuelve `true`/`false` para un `if`: como una type guard común.
- El cuerpo se genera solo: TS crea el chequeo runtime que tira si no coincide.
- Castea el argumento al tipo declarado aunque el valor no lo cumpla.

## ¿Por qué useUnknownInCatchVariables — qué rompía el any del catch?
Con el flag, `catch (e)` da `unknown`: hay que narrow antes de `e.message`. Antes, el `any` dejaba tocar cualquier propiedad de cualquier throw.

### porque
`catch` atrapa todo lo que se tire en JS: `Error`, strings, objetos literales — tiparlo any hacía compilar `e.statusCode` sobre un string. Con unknown el manejo es honesto: `instanceof`, guard o parseo explícito. Ya viene dentro de `strict` moderno; desactivarlo es reintroducir any por la puerta del manejo de errores.

### distractores
- Tipa `e` como `Error` siempre: el flag elimina la necesidad de guards.
- Cambia el tipo a `never`: el catch no deja leer ninguna propiedad.
- Solo afecta catch de promesas: los síncronos siguen capturando `any`.
