# 💡 CONTEXTO.md — Fabrizio Alvarez — Portafolio

**Para retomar este proyecto en otra sesión.** Este archivo es la fuente de verdad del diseño. Copialo a la raíz del repo nuevo como `CONTEXTO.md`.

---

## Qué es

**Landing personal** en el apex de mi dominio: **https://falvarez.dev**. Una sola página (o pocas) que presenta quién soy, mi stack y mis proyectos — desde la que se llega a cada proyecto vivo en su subdominio.

No es un blog (todavía). Es la puerta de entrada: un reclutador entra, entiende en 30 segundos qué hago, y clickea al proyecto que le interesa.

## Decisión de infraestructura (YA TOMADA — heredada del proyecto Mnemo)

| Qué | Decisión |
|---|---|
| Dominio | `falvarez.dev` — comprado en **Cloudflare Registrar** (única parte paga, ~US$10/año) |
| Landing | **Apex `falvarez.dev`** → **Cloudflare Pages** (gratis) |
| Proyectos | Cada proyecto cuelga de su **propio subdominio** (gratis en CF): `mnemo.falvarez.dev` (Workers, ya live), próximos `api.`, `app.`, lo que sea |
| Cuenta | Misma cuenta de Cloudflare que Mnemo (el dominio ya está como zona activa ahí) |

**Por qué esta forma**: un solo dominio para todo el portafolio — el apex vende, cada subdominio demuestra. Nada de `vercel.app` ni `pages.dev` en la cara: URL propia = seiedad. Y en CF, Pages (estático) y Workers (apps) son gratis ambos.

### Cómo se conecta (cuando el repo exista)
1. Cloudflare dashboard → Workers & Pages → **Create → Pages → Connect to Git** → elegir este repo.
2. Build command y output según el stack elegido (ver abajo).
3. Pages → Custom domains → **Add → `falvarez.dev`** (y `www` redirigido al apex). CF crea el DNS solo.

## Stack — 🔼 A DECIDIR al arrancar

Criterio: el landing es **contenido estático** (texto, links, quizás dark mode). No necesita SSR, ni BD, ni server. La decisión pesa más por señal de portafolio que por necesidad técnica.

| Opción | A favor | En contra |
|---|---|---|
| **Astro** (recomendado) | Hecho para esto: contenido + islands, output estático puro, cero JS por defecto, TIENE salida laboral y suma al portafolio como stack nuevo | Un framework más en la curva (chico: se parece a lo que ya conozco) |
| **Next.js** (export estático) | Ya lo domino de Mnemo — más rápido de shipped | Cero señal nueva; Next estático para una landing es matar moscas |
| **HTML + Tailwind** | Cero dependencias, máximo control | Nada que contar en una entrevista sobre el cómo |

Inclinación actual: **Astro** — mismo argumento que Mnemo (stack nuevo que suma, no el que ya tengo). Móvil-first + dark mode con la paleta de Mnemo (violeta `#7c3aed`) para coherencia de marca.

## Estructura del contenido (data-driven)

Cada proyecto = un archivo de data, el landing lo renderiza. **Sumar un proyecto = sumar un archivo**, sin tocar el layout.

```ts
// src/data/proyectos/*.ts (o .json)
{
  slug: "mnemo",
  titulo: "Mnemo",
  tagline: "Flashcards con repetición espaciada — contenido en Markdown, estado en Postgres",
  stack: ["TypeScript", "Next.js 15", "Prisma", "PostgreSQL", "Cloudflare Workers", "Neon"],
  estado: "live",
  url: "https://mnemo.falvarez.dev",
  repo: "https://github.com/Fabrizio-Alvarez/mnemo",
  destacados: [ ... ],       // 3-4 bullets de lo que se cuenta en entrevista
  anio: 2026,
  orden: 1,                  // a mano, no por fecha
}
```

## Proyectos (estado actual del catálogo)

### 1. Mnemo — ✅ live, listo para exhibir

- **URL**: https://mnemo.falvarez.dev · **Repo**: https://github.com/Fabrizio-Alvarez/mnemo
- **Qué es**: app personal de estudio con tarjetas (estilo Anki). Contenido en archivos Markdown versionados con git; estado SRS (algoritmo SM-2 de Anki) en Postgres. 8 mazos, 256 tarjetas.
- **Stack**: Next.js 15 (App Router, RSC, Server Actions) · TypeScript strict · Prisma · PostgreSQL (Neon) · Cloudflare Workers (OpenNext) · Tailwind 4 · pnpm monorepo · Vitest (67 tests del dominio puro)
- **Para destacar en el landing** (lo que se defiende en entrevista):
  - Arquitectura hexagonal en monorepo: `@mnemo/domain` (parser de Markdown + SM-2, TS puro, 67 tests sin BD) viaja intacto a cualquier runtime
  - Contenido ≠ estado como decisión central: los `.md` son la fuente de verdad, la BD es derivada e idempotente (seed re-corrible)
  - Full-serverless en el free tier: Workers + Neon, dominio propio, CI/CD en cada push (GitHub Actions)
  - Modo quiz didáctico: distractores autorales plausibles + explicación del "por qué" conceptual — extensibilidad de modos hecha carne
- **TODO para el landing**: screenshots (dashboard, sesión de estudio, quiz con 💡), quizás un GIF corto de la sesión

### 2. Supermercado DDD (Laravel + Vue) — 🔼 completar datos

- **Qué es**: e-commerce backend con Domain-Driven Design — aggregates, value objects, eventos de dominio (es la fuente del mazo "Arquitectura DDD" en Mnemo)
- **Stack**: Laravel · PHP · Vue · MySQL/Postgres (completar)
- **TODO**: ¿está deployado? Si sí → subdominio (`api.falvarez.dev` o demo). Si no → igual va en el landing como proyecto de código con repo/link. Completar repo, destacados, screenshots.

### Plantilla para los próximos

Cada proyecto nuevo necesita: tagline de una línea, stack (chips), estado (live/código/wip), 3 destacados defendibles, URL y repo. Si está vivo → subdominio propio en CF (Workers para apps, Pages para estáticos).

## Decisiones tomadas

- ✅ Un solo dominio (`falvarez.dev`), apex = landing, proyectos = subdominios
- ✅ Cloudflare Pages para el landing (gratis, mismo account)
- ✅ Data-driven: proyecto = archivo, no hardcode en el layout
- ✅ Idioma del contenido: 🔼 A DECIDIR (es vs en vs es+en toggle). Si el objetivo es mercado local → es; si apunta afuera → en (o bilingüe simple)
- 🔼 Stack del landing (inclinación: Astro)
- 🔼 Secciones de la página (propuesta): Hero (quién soy + stack actual) · Proyectos (grid de cards) · Contacto (GitHub + email + CV link). Nada más en v0

## Cómo correr (cuando exista)

```bash
pnpm install && pnpm dev   # o npm/astro dev según stack
# deploy: push a main → CF Pages rebuilda solo (connect-to-git)
```

## ⚠️ Gotchas / notas

- El DNS del apex hoy no apunta a nada (Mnemo vive en el subdominio con su propio CNAME proxy). Asignar el custom domain en Pages lo crea solo — no tocar el registro de `mnemo` existente.
- La cuenta CF ya tiene el Worker `mnemo`; Pages y Workers conviven sin conflicto (son productos distintos, mismo dominio).
- Mantener este archivo actualizado cuando cambie algo de infraestructura — es lo que hace retomable el proyecto.
