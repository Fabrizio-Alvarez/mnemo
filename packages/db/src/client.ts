import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma dual, la única puerta a la BD del monorepo:
 *
 * - **Node** (dev local, seed, scripts): `PrismaClient` directo con su engine
 *   nativo contra `DATABASE_URL` (Postgres local o remoto por TCP).
 * - **Cloudflare Workers** (producción): sin runtime de Node, el engine no
 *   existe — se instancia con el **adapter Neon HTTP** (`PrismaNeonHTTP`),
 *   que habla fetch contra la BD Neon. `DATABASE_URL` llega como secret de
 *   wrangler y apunta al endpoint HTTP de Neon.
 *
 * La detección de Workers combina dos señales:
 *   1. `navigator.userAgent === "Cloudflare-Workers"` (oficial de workerd)
 *   2. Ausencia de `process.env.DATABASE_URL` con formato localhost
 * OpenNext puede transpilar `navigator` de forma que la primera falle,
 * por eso la segunda es el fallback.
 */
function esWorkersRuntime(): boolean {
  if (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers") {
    return true;
  }
  // Fallback: en Workers no hay .env local con localhost.
  // Si DATABASE_URL apunta a Neon (no localhost), estamos en remoto/Workers.
  const url = process.env.DATABASE_URL;
  return url !== undefined && !url.includes("localhost");
}

function crearCliente(): PrismaClient {
  if (!esWorkersRuntime()) return new PrismaClient();

  const url = process.env.DATABASE_URL;
  if (url === undefined || url === "") {
    throw new Error("DATABASE_URL no está definido (en Workers llega como secret de wrangler)");
  }
  // adapter v6: recibe la connection string + opciones del driver HTTP.
  return new PrismaClient({
    adapter: new PrismaNeonHTTP(url, { arrayMode: false, fullResults: false }),
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
