# @mnemo/web

Frontend Next.js 15 (App Router) de Mnemo. Parte del monorepo `mnemo/` — ver el `CONTEXTO.md` de la raíz.

```bash
# desde la raíz del monorepo
pnpm setup   # install + postgres + migrate + seed
pnpm dev     # http://localhost:3000
```

Rutas: `/` (dashboard con vencidas por mazo) · `/decks/[slug]` (detalle del mazo) · `/study/[slug]` (sesión de repaso SM-2).
