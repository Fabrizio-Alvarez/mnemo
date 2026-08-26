/**
 * Puesta a punto de la BD remota (Neon) en un solo paso:
 * `prisma migrate deploy` (si hay migraciones pendientes) + seed de decks/*.md,
 * ambos contra la `DATABASE_URL` de `.env.neon`.
 *
 * Node v24 carga `.env` automáticamente, que pisaría la URL de Neon.
 * Por eso este script lee `.env.neon` directamente con fs y pasa
 * DATABASE_URL explícitamente en el entorno de los procesos hijos
 * (envOverride): las variables del proceso tienen prioridad sobre `.env`.
 *
 * Neon suspende conexiones inactivas → el advisory lock de `migrate deploy`
 * puede colgarse si las migraciones ya están aplicadas. Por eso primero
 * verificamos con `migrate status` y solo corremos `deploy` si hay cambios.
 *
 * Uso: `corepack pnpm db:remoto` desde la raíz del repo.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function leerNeonUrl(): string | undefined {
  try {
    const contenido = readFileSync(".env.neon", "utf-8");
    for (const linea of contenido.split(/\r?\n/)) {
      const match = /^DATABASE_URL\s*=\s*"?(.+?)"?\s*$/.exec(linea.trim());
      if (match) return match[1];
    }
  } catch {
    // .env.neon no existe
  }
  return undefined;
}

const neonUrl = leerNeonUrl();
if (neonUrl === undefined || neonUrl.includes("localhost")) {
  console.error("✗ No encontré DATABASE_URL de Neon en .env.neon");
  console.error("  Creá .env.neon con: DATABASE_URL=\"postgresql://...neon.tech/...\"");
  process.exit(1);
}

const envOverride = { ...process.env, DATABASE_URL: neonUrl };

function run(cmd: string): string {
  console.log(`\n$ ${cmd}`);
  return execSync(cmd, { stdio: "pipe", env: envOverride, encoding: "utf-8" });
}

function runInherit(cmd: string): void {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: envOverride });
}

console.log("→ BD remota: migraciones + seed (Neon)");

// 1. Verificar estado de migraciones (no usa advisory lock).
const status = run("corepack pnpm --filter @mnemo/db exec prisma migrate status");
const yaAplicadas = status.includes("up to date") || status.includes("Database schema is up to date");

if (!yaAplicadas) {
  runInherit("corepack pnpm --filter @mnemo/db exec prisma migrate deploy");
} else {
  console.log("✓ Migraciones ya aplicadas — saltando deploy");
}

// 2. Seed idempotente.
runInherit("corepack pnpm exec tsx scripts/seed-decks.ts");
