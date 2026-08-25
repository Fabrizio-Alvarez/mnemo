# 💡 CONTEXTO.md — Mnemo — tarjetas de estudio (flashcards personales, estilo Quizlet)

**Para retomar este proyecto en otra sesión.** Idea capturada y diseño cerrado el 2026-08-18; **v0 implementada el 2026-08-19**; **v1 implementada el 2026-08-24** (ver "Estado"). Este archivo es la fuente de verdad del diseño.

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
- `quiz` (v1 ✅): opción múltiple derivada — distractores = respuestas hermanas del mismo mazo (`armarQuiz` en el dominio). Modo práctica: no escribe en la BD.
- `cloze` (futuro): completar el `==hueco==`.

## Roadmap

- ✅ **v0**: app Next (SSR) — parser de `decks/*.md` en seed → tarjetas en Postgres (Prisma), sesión de repaso, SM-2, estado en la BD.
- ✅ **v1**: stats (racha actual y mejor, últimos 30 días, actividad por mazo, desde `review_logs`) · re-encolado y deshacer en sesión · "repasar igual" (todo el mazo) · modo quiz.
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
├─ CONTEXTO.md / DESARROLLO.md   # diseño + guía de lectura del código
├─ pnpm-workspace.yaml        # apps/*, packages/* + onlyBuiltDependencies
├─ docker-compose.yml         # Postgres 16 local (mnemo:mnemo@localhost:5432/mnemo)
├─ .github/workflows/       # ci.yml (tests+tsc+build+bundle Workers) y deploy.yml (wrangler-action)
├─ deploy/Dockerfile        # [archivado] alternativa Fly — requiere output: standalone
├─ scripts/seed-decks.ts      # decks/*.md → upsert en Postgres (usa @mnemo/domain + @mnemo/db)
├─ decks/                     # FUENTE DE VERDAD del contenido (3 mazos: laravel/vue/arquitectura)
├─ packages/
│  ├─ domain/                 # @mnemo/domain — TS puro: parser .md + sha256 puro + cardId + slugify
│  │  └─ src/{parse,frontmatter,id,sha256,sm2,quiz,stats,deck}.ts   # SM-2 + quiz + rachas. Vitest (41 tests).
│  └─ db/                     # @mnemo/db — schema.prisma (driverAdapters) + cliente dual (Node/Workers)
└─ apps/
   └─ web/                    # Next.js 15.5 App Router + TS strict + Tailwind 4
      ├─ wrangler.jsonc       # config de Cloudflare Workers (nodejs_compat, assets)
      ├─ open-next.config.ts  # adapter OpenNext
      └─ src/app/             # / , /decks/[slug], /study/[slug] (?all=1), /stats, /quiz/[slug] + actions.ts
```

Schema Prisma (implementado, tablas `decks`/`cards`/`review_logs`):
- `Deck`: `slug` (id), `title`, `source?`, `tags[]`
- `Card`: `id` = hash(deckSlug + pregunta), `question`, `answer` + estado SRS: `ease` (init 2.5), `intervalDays`, `dueAt`, `reps`, `lapses`
- `ReviewLog`: append-only — `cardId`, `grade` (0–3), `reviewedAt`, `intervalDays`, `ease` + estado PREVIO (`prevEase`, `prevIntervalDays`, `prevReps`, `prevLapses`, `prevDueAt`) que habilita deshacer

Fijado también: UI de estudio = flip de tarjeta + 4 botones (**Otra vez / Difícil / Bien / Fácil** → grades 0–3 para SM-2) · Postgres local via docker-compose · Tailwind · `pnpm seed` desde la raíz.

## Cómo correr

```bash
pnpm setup        # install + docker compose up + migrate + seed (todo)
pnpm dev          # Next en :3000
pnpm test         # Vitest del dominio (41 tests, sin DB)
pnpm seed         # re-sincroniza decks/*.md → BD (idempotente; baja tarjetas que desaparecieron)
pnpm db:studio    # Prisma Studio para inspeccionar
```

## Deploy — Cloudflare Workers + Neon (decisión 2026-08-25, reemplaza Fly)

Stack elegido: **Workers free** (100k req/día) + **Neon free** (Postgres 0.5 GB) + **dominio en Cloudflare Registrar** (~US$10/año, única parte paga). Fly quedó descartado (trial vencido, requiere tarjeta); `deploy/Dockerfile` queda en el repo como alternativa archivada (requiere re-habilitar `output: "standalone"` en `next.config.ts`).

Piezas ya implementadas y verificadas en CI:
- `apps/web/wrangler.jsonc` (nodejs_compat + assets) + `open-next.config.ts` (`defineCloudflareConfig`).
- `packages/db`: `previewFeatures = ["driverAdapters"]` + **cliente dual** — engine clásico en Node; en Workers, `PrismaNeonHttp` (adapter v7: connection string + `{ arrayMode: false, fullResults: false }`) hablando fetch contra Neon.
- Workflows: `ci.yml` arma el bundle de Workers en cada push (verde) y `deploy.yml` deploya con `wrangler-action` (secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`).

Pasos que faltan (interactivos, con cuenta propia):
1. **Neon**: cuenta → connection string en `.env.neon` (gitignored) → `corepack pnpm db:remoto` (migraciones + seed en un comando; validado local: seed idempotente 0 nuevas / 0 eliminadas).
2. **Secrets del repo**: `gh secret set CLOUDFLARE_API_TOKEN` (token plantilla "Edit Cloudflare Workers") y `gh secret set CLOUDFLARE_ACCOUNT_ID`; luego crear la **variable** de repo `DEPLOY=true` (`gh variable set DEPLOY --body true`) — `deploy.yml` está dormido hasta que esa variable exista, para no marcar ✗ en cada push. El próximo push deploya → https://mnemo.<cuenta>.workers.dev
3. **Secret del Worker**: dashboard CF → Worker `mnemo` → Settings → Variables → secret `DATABASE_URL` = URL de Neon.
4. **Dominio** (decisión 2026-08-25): un solo dominio para todo el portafolio personal — apex para el sitio portfolio (Cloudflare Pages) y **subdominio `mnemo.`** para este Worker. Cada proyecto futuro cuelga de su propio subdominio (gratis en CF: Workers y Pages). Comprar en Cloudflare Registrar → Workers → mnemo → Settings → Domains & Routes → Add custom domain (`mnemo.tudominio`).

### Por qué el build no es local
OpenNext crea symlinks del store de pnpm al armar `.next/standalone` → `EPERM` en Windows sin admin (y sobre OneDrive, peor). El bundle se arma y deploya **solo desde CI (Linux)**. Local queda `next dev` normal.

## ⚠️ Gotchas aprendidos en la implementación

- **Windows sin admin:** `corepack enable` no puede escribir shims en Program Files. Shims manuales en `%LOCALAPPDATA%\pnpm\bin\` (pnpm + pnpm.cmd → `corepack pnpm`). Los scripts raíz usan `corepack pnpm --filter …` por eso (portable a cualquier Node con corepack).
- **pnpm 11:** `onlyBuiltDependencies` vive en `pnpm-workspace.yaml`; los builds bloqueados se aprueban con `pnpm approve-builds <pkg>`. Con `CI=true` pnpm usa frozen-lockfile → `--no-frozen-lockfile` cuando cambia un package.json.
- **Prisma + Next monorepo:** output DEFAULT del generator (al virtual store de pnpm) + `serverExternalPackages: ["@prisma/client"]` + `@prisma/client` como dependencia directa de apps/web. El output custom rompe el externalizado (el engine nativo no se bundlea).
- **Paquetes workspace en TS fuente:** `transpilePackages: ["@mnemo/domain", "@mnemo/db"]` y `allowImportingTsExtensions: true` (el dominio importa con extensión `.ts`).
- **NO llamar `revalidatePath` en la action `calificar`:** el refresh de router que dispara re-renderiza `/study/[slug]` con la lista de vencidas encogida → salta tarjetas y borra el resumen de sesión. `SesionEstudio` además congela el prop `cards` en un `useState` (snapshot). Como todas las rutas son `force-dynamic`, cada navegación trae datos frescos igual.
- **SHA-256 propio en el dominio:** síncrono y sin `node:crypto` ni WebCrypto, para que `cardId` corra idéntico en Node, browser y un futuro Capacitor. Verificado contra vectores NIST en tests.
- **SM-2 con 4 botones:** grades 0–3 mapean a calidad q 2–5 (umbral q≥3). Fallo: reps=0, intervalo=1d, lapses++, ease intacto (SM-2 clásico). El ease baja solo con aprobaciones débiles (Difícil), piso 1.3.
- **OpenNext (Cloudflare) no build-ea en Windows:** arma `.next/standalone` con symlinks del store de pnpm → `EPERM` sin admin. Solución: bundle y deploy viven en CI Linux (`ci.yml` valida, `deploy.yml` deploya). `next build` SÍ funciona local (webpack).
- **@prisma/adapter-neon v7 cambió la API:** `PrismaNeonHttp` (camelCase) recibe `(connectionString, { arrayMode, fullResults })` — NO el cliente `neon()` de versiones anteriores.

## Preguntas abiertas (decidir al arrancar)

- [x] Stack final dentro de TS → **Next.js + Capacitor** (ver sección Stack).
- [x] ¿Monorepo? → **Sí, pnpm workspaces con packages/db desde el inicio** (ver sección Estructura).
- [x] ¿Sync entre dispositivos o solo local? → **v0 solo local** (ver sección "Sync").
- [ ] ¿Multi-idioma por tarjeta? (ej. inglés: tarjeta con `P::/R::` bilingüe)

## Estado

- ✅ **v0 completa y verificada end-to-end** (2026-08-19): dominio (parser + hash + SM-2, 28 tests Vitest sin DB) · Prisma + migración init · seed idempotente (verificado doble corrida: 0 nuevas, 0 eliminadas) · app Next (dashboard / mazo / estudio) · sesión completa probada en browser (15/15 tarjetas sin saltos, resumen con conteos exactos) · persistencia verificada en Postgres (36 review_logs, ease/interval/reps/lapses correctos por grade).
- ✅ **v1 completa y verificada end-to-end** (2026-08-24): re-encolado de "Otra vez" (máx 1 por tarjeta, resumen = última calificación por tarjeta) · **deshacer** (Z) con estado previo en `review_logs` (migración con backfill; undo verificado en BD: fila borrada + card restaurado exacto) · "repasar igual" (`?all=1` con banner) · `/stats` (racha, mejor racha, 30 días, por mazo — números auditados contra la BD) · `/quiz/[slug]` (quiz completo en browser, **cero escrituras a la BD**) · dominio 41/41 tests.
- 🔼 **Repo público + CI**: https://github.com/Fabrizio-Alvarez/mnemo — GitHub Actions (vitest + tsc domain/web + build) en cada push.
- 🚀 **Migración a Cloudflare Workers + Neon completa en código y CI** (2026-08-25): cliente Prisma dual (Node/Workers), wrangler.jsonc + open-next.config.ts, CI arma el bundle de Workers en Linux (verde). Faltan solo los pasos interactivos de cuenta (Neon, secrets del repo, secret `DATABASE_URL` del Worker, dominio) — ver sección Deploy.
