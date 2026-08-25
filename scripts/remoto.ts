/**
 * Puesta a punto de la BD remota (Neon) en un solo paso:
 * `prisma migrate deploy` + seed de decks/*.md, ambos contra la
 * `DATABASE_URL` de `.env.neon` (la carga el `--env-file` de tsx; los
 * procesos hijos la heredan — el CLI de Prisma v7 no acepta --env-file).
 *
 * Uso: `corepack pnpm db:remoto` desde la raíz del repo.
 */
import { execSync } from "node:child_process";

const pasos = [
  "corepack pnpm --filter @mnemo/db exec prisma migrate deploy",
  "corepack pnpm exec tsx scripts/seed-decks.ts",
];

console.log("→ BD remota: migraciones + seed (env de .env.neon)");
for (const paso of pasos) {
  console.log(`\n$ ${paso}`);
  execSync(paso, { stdio: "inherit" });
}
