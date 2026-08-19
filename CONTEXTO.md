# 💡 CONTEXTO.md — Mnemo — tarjetas de estudio (flashcards personales, estilo Quizlet)

**Para retomar este proyecto en otra sesión.** Idea capturada y diseño cerrado el 2026-08-18; **v0 implementada el 2026-08-19** (ver "Estado"). Este archivo es la fuente de verdad del diseño.

---

## Qué es

**Mnemo** — app personal para estudiar con **tarjetas pregunta/respuesta** (tipo Quizlet/Anki), sobre temas que me interesen. Requisito central: **extensible** — si se me ocurre otra forma interesante de aprender (quiz de opción múltiple, cloze/completar, etc.), entra al mismo sistema sin reescribir.

## Decisión de diseño clave (ya meditada)

**Contenido y estado viven separados:**

| Qué | Dónde | Por qué |
|---|---|---|
| **Contenido** (mazos, tarjetas) | **Archivos Markdown** — fuente de verdad | Editable a mano, versionable con git, portable (VS Code/Obsidian), sobrevive a reescrituras de la app, fácil de armar pegando desde NotebookLM |
| **Estado** (progreso, scheduling SRS, stats) | **PostgreSQL (Prisma)** — derivada | Muta constantemente, no es contenido autoral, se puede reconstruir con un re-seed |

Regla: la app **lee** los `.md`, nunca los reescribe. La BD indexa con un id estable por tarjeta (hash de deck+pregunta) y guarda el estado de repaso. El seed es idempotente: upsert por hash y baja las tarjetas que desaparecieron del `.md` (editar una pregunta = nueva tarjeta con estado nuevo, la vieja se va).

Descartado: tarjetas solo en BD → lock-in con la app, imposible editar masivamente o curar afuera.

## Formato de mazos (propuesto)

1 archivo `.md` = 1 mazo. Cada `## encabezado` = 1 tarjeta (título = pregunta, cuerpo = respuesta). Frontmatter para metadatos.

```markdown
---
deck: Laravel — Eloquent
tags: [laravel, orm]
fuente: NotebookLM (Guía Laravel-Vue)
---

## ¿Qué es el problema N+1 y cómo lo resuelve Eloquent?
Consultar 1 vez la lista + N veces por cada relación.
Se resuelve con eager loading: `with('relacion')`.

## ¿Diferencia entre hasMany y belongsToMany?
hasMany: FK en la tabla del otro modelo.
belongsToMany: tabla pivote muchos-a-muchos.
```

Extensión futura sin romper el formato: tarjetas **cloze** con `==texto a completar==`, y **quiz** derivado automáticamente del mismo contenido (una tarjeta Q/R se vuelve pregunta de opción múltiple usando respuestas de tarjetas hermanas como distractores).

## Flujo de trabajo pensado

1. **Curar** el tema en [NotebookLM](https://notebook.google) con las fuentes (PDFs, apuntes, docs).
2. **Generar** preguntas/respuestas ahí y exportar/pegar → archivo `.md` por tema en `decks/`.
3. **Estudiar**: la app carga los mazos, sesiones de repaso con **repetición espaciada** (algoritmo SM-2, el de Anki: la tarjeta vuelve cuando estás por olvidarla).

Primeros mazos candidatos: el material de `Ejercicio-Arquitectura/ESTUDIO.md` y `Guia-Estudio-Laravel-Vue.pdf` ya están para convertir.

## Extensibilidad ("modos de estudio")

El sistema de archivos de mazos es el contrato; los modos son módulos que lo consumen:
- `flashcards` (v0): Q/R clásica con autoevaluación (la recordé bien/mal).
- `quiz` (futuro): opción múltiple derivada.
- `cloze` (futuro): completar el `==hueco==`.

## Roadmap

- **v0**: app Next (SSR) — parser de `decks/*.md` en seed → tarjetas en Postgres (Prisma), sesión de repaso, SM-2, estado en la BD.
- **v1**: web local con stats (mazos, vencidas por hoy, racha).
- **v2**: importador asistido (pegar texto de NotebookLM → generar borrador de mazo `.md`).

## Stack — ✅ DECIDIDO (2026-08-18): Next.js + TS + Prisma/PostgreSQL, móvil vía Capacitor

Criterio: **salida laboral + sumar al portafolio** (ya tengo Laravel+Vue como stack principal). Inclinación: **TypeScript**. Candidatos:

1. **Expo (React Native) + TS** — el proyecto pide móvil: una app de estudio se usa en el celu, en cualquier lado, offline. RN es de los nichos TS mejor pagos y el dogfooding hace el proyecto defendible en entrevistas.
2. **Next.js (React) + TS + Prisma/PostgreSQL** — el stack TS más pedido en el mercado (React >> Vue en demanda). Bien si quiero priorizar web/full-stack.
3. **NestJS + TS** (backend, combinable con 1 o 2) — patronaje enterprise (DI, módulos), muy demandado para puestos backend TS.

**Decisión final: Next.js (React) + TypeScript + Prisma + PostgreSQL.** Móvil después vía Capacitor (mismo código, shell nativo). La lógica de dominio (parser de mazos + SM-2) queda en un paquete TS puro testeado con Vitest, importado por la app Next — si algún día hace falta UI nativa real, ese paquete viaja intacto.

**¿Y móvil si elijo Next?** Sí, dos rutas — ninguna da UI nativa real:

- **PWA**: instalable en el home screen, offline con service workers (Workbox), push en iOS 16.4+. Sin tiendas; en iOS la experiencia sigue siendo limitada.
- **Capacitor**: envuelve la web en un shell nativo → apps reales en App Store/Play Store y APIs nativas (SQLite local). La UI sigue siendo un webview — para una app de tarjetas (texto, botones, flip) alcanza; para UI pesada no.

Lo que se comparte en cualquier ruta es el **paquete de dominio** (parser de mazos + SM-2, TS puro); la UI es lo único que no viaja. Se decidió por uso principal en notebook/escritorio + valor portafolio del stack full-stack TS. Nota: Expo también tiene salida web (Expo Router), pero es más débil que Next como web app.

## Decisiones tomadas

- ✅ **Repositorio propio** (nuevo, aparte de `Proyectos/`): este proyecto es pieza de portafolio, no un script más.
- ✅ **Stack nuevo** para ampliar portafolio, con TypeScript como base.
- ✅ Contenido en Markdown como fuente de verdad; estado (SRS) en BD.
- ✅ Los `.md` de mazos viven en el repo (versionables junto al código); el importador de NotebookLM (v2) los genera.
- ✅ **Stack final: Next.js + TS + Prisma + PostgreSQL** (móvil futuro vía Capacitor). Dominio (parser + SM-2) como paquete TS puro con Vitest.
- ✅ **Nombre: Mnemo** (repo `mnemo`, paquetes `@mnemo/*`).
- ✅ **Monorepo pnpm** con `packages/db` (Prisma) desde el inicio.

## Sync: cómo funciona realmente (aclarado)

El problema de sync **no depende del stack de UI** — depende de **dónde vive el estado SRS**:

| Estado en… | Multi-device | Offline | Sync necesaria |
|---|---|---|---|
| Servidor (Next + Postgres, online-only) | ✅ consistente gratis (todos golpean la misma API) | ❌ | Ninguna |
| SQLite local, 1 dispositivo (Expo típico) | — (1 solo contexto) | ✅ | Ninguna |
| SQLite local, 2+ dispositivos (web + celu) | requiere sync | ✅ | **Sí, en cualquier stack** |

O sea: Expo "no tiene el problema" solo porque el caso típico es un único celu — en cuanto suma web o tablet, aparece lo mismo. Y Next al revés: su forma natural (server + BD) resuelve multi-device gratis, pero rompe offline, y offline es lo que fuerza estado local.

La buena noticia: el estado a sincronizar es **chiquito** — 1 registro por tarjeta (ease, intervalo, due). Solución barata cuando haga falta: **log append-only de repasos** y estado derivado (lo que hace Anki: SQLite local + sync opcional). Los mazos `.md` ya se sincronizan gratis vía git.

**Decisión v0 (actualizada al stack Next): una sola instancia — servidor Next + Postgres, online → cero código de sync.** Si aparecen más dispositivos, todos golpean la misma BD y salen consistentes gratis. Offline/local-first se evalúa recién cuando el uso real lo pida.

## Estructura del repo (como está implementada)

```
mnemo/
├─ CONTEXTO.md
├─ pnpm-workspace.yaml        # apps/*, packages/* + onlyBuiltDependencies
├─ docker-compose.yml         # Postgres 16 local (mnemo:mnemo@localhost:5432/mnemo)
├─ scripts/seed-decks.ts      # decks/*.md → upsert en Postgres (usa @mnemo/domain + @mnemo/db)
├─ decks/                     # FUENTE DE VERDAD del contenido (3 mazos: laravel/vue/arquitectura)
├─ packages/
│  ├─ domain/                 # @mnemo/domain — TS puro: parser .md + sha256 puro + cardId + slugify + SM-2. Vitest (28 tests).
│  │  └─ src/{parse,frontmatter,id,sha256,sm2,deck}.ts
│  └─ db/                     # @mnemo/db — schema.prisma (Deck/Card/ReviewLog) + cliente Prisma singleton
└─ apps/
   └─ web/                    # Next.js 15.5 App Router + TS strict + Tailwind 4
      └─ src/app/             # / (dashboard), /decks/[slug], /study/[slug] + actions.ts (server action calificar)
         └─ components/SesionEstudio.tsx  # cliente: flip + 4 botones + teclado (espacio, 1-4)
```

Schema Prisma (implementado, tablas `decks`/`cards`/`review_logs`):
- `Deck`: `slug` (id), `title`, `source?`, `tags[]`
- `Card`: `id` = hash(deckSlug + pregunta), `question`, `answer` + estado SRS: `ease` (init 2.5), `intervalDays`, `dueAt`, `reps`, `lapses`
- `ReviewLog`: append-only — `cardId`, `grade` (0–3), `reviewedAt`, `intervalDays`, `ease`

Fijado también: UI de estudio = flip de tarjeta + 4 botones (**Otra vez / Difícil / Bien / Fácil** → grades 0–3 para SM-2) · Postgres local via docker-compose · Tailwind · `pnpm seed` desde la raíz.

## Cómo correr

```bash
pnpm setup        # install + docker compose up + migrate + seed (todo)
pnpm dev          # Next en :3000
pnpm test         # Vitest del dominio (28 tests, sin DB)
pnpm seed         # re-sincroniza decks/*.md → BD (idempotente; baja tarjetas que desaparecieron)
pnpm db:studio    # Prisma Studio para inspeccionar
```

## ⚠️ Gotchas aprendidos en la implementación

- **Windows sin admin:** `corepack enable` no puede escribir shims en Program Files. Shims manuales en `%LOCALAPPDATA%\pnpm\bin\` (pnpm + pnpm.cmd → `corepack pnpm`). Los scripts raíz usan `corepack pnpm --filter …` por eso (portable a cualquier Node con corepack).
- **pnpm 11:** `onlyBuiltDependencies` vive en `pnpm-workspace.yaml`; los builds bloqueados se aprueban con `pnpm approve-builds <pkg>`. Con `CI=true` pnpm usa frozen-lockfile → `--no-frozen-lockfile` cuando cambia un package.json.
- **Prisma + Next monorepo:** output DEFAULT del generator (al virtual store de pnpm) + `serverExternalPackages: ["@prisma/client"]` + `@prisma/client` como dependencia directa de apps/web. El output custom rompe el externalizado (el engine nativo no se bundlea).
- **Paquetes workspace en TS fuente:** `transpilePackages: ["@mnemo/domain", "@mnemo/db"]` y `allowImportingTsExtensions: true` (el dominio importa con extensión `.ts`).
- **NO llamar `revalidatePath` en la action `calificar`:** el refresh de router que dispara re-renderiza `/study/[slug]` con la lista de vencidas encogida → salta tarjetas y borra el resumen de sesión. `SesionEstudio` además congela el prop `cards` en un `useState` (snapshot). Como todas las rutas son `force-dynamic`, cada navegación trae datos frescos igual.
- **SHA-256 propio en el dominio:** síncrono y sin `node:crypto` ni WebCrypto, para que `cardId` corra idéntico en Node, browser y un futuro Capacitor. Verificado contra vectores NIST en tests.
- **SM-2 con 4 botones:** grades 0–3 mapean a calidad q 2–5 (umbral q≥3). Fallo: reps=0, intervalo=1d, lapses++, ease intacto (SM-2 clásico). El ease baja solo con aprobaciones débiles (Difícil), piso 1.3.

## Preguntas abiertas (decidir al arrancar)

- [x] Stack final dentro de TS → **Next.js + Capacitor** (ver sección Stack).
- [x] ¿Monorepo? → **Sí, pnpm workspaces con packages/db desde el inicio** (ver sección Estructura).
- [x] ¿Sync entre dispositivos o solo local? → **v0 solo local** (ver sección "Sync").
- [ ] ¿Multi-idioma por tarjeta? (ej. inglés: tarjeta con `P::/R::` bilingüe)

## Estado

- ✅ **v0 completa y verificada end-to-end** (2026-08-19): dominio (parser + hash + SM-2, 28 tests Vitest sin DB) · Prisma + migración init · seed idempotente (verificado doble corrida: 0 nuevas, 0 eliminadas) · app Next (dashboard / mazo / estudio) · sesión completa probada en browser (15/15 tarjetas sin saltos, resumen con conteos exactos) · persistencia verificada en Postgres (36 review_logs, ease/interval/reps/lapses correctos por grade).
- Mazos iniciales: `laravel-entrevista` (15), `vue-entrevista` (15), `arquitectura-entrevista` (10) — material real de la guía de estudio del proyecto Supermercado.
- 🔜 v1: stats (racha, heatmap, histórico desde `review_logs`) · v2: importador NotebookLM → borrador de mazo. Futuro: multi-idioma, Capacitor.
