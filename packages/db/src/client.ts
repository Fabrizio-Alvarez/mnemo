import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma dual, la única puerta a la BD del monorepo:
 *
 * - **Node** (dev local, seed, scripts): `PrismaClient` directo con su engine
 *   nativo contra `DATABASE_URL` (Postgres local o remoto por TCP).
 * - **Cloudflare Workers** (producción): sin runtime de Node, el engine no
 *   existe — se instancia con el **adapter Neon HTTP** (`PrismaNeonHttp`),
 *   que habla fetch contra la BD Neon. `DATABASE_URL` llega como secret de
 *   wrangler y apunta al endpoint HTTP de Neon.
 *
 * La detección es la oficial de workerd: `navigator.userAgent === "Cloudflare-Workers"`
 * (también es así en `wrangler dev`, que corre el mismo runtime).
 */
const esWorkers =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

function crearCliente(): PrismaClient {
  if (!esWorkers) return new PrismaClient();

  const url = process.env.DATABASE_URL;
  if (url === undefined || url === "") {
    throw new Error("DATABASE_URL no está definido (en Workers llega como secret de wrangler)");
  }
  // adapter v7: recibe la connection string + opciones del driver HTTP.
  return new PrismaClient({
    adapter: new PrismaNeonHttp(url, { arrayMode: false, fullResults: false }),
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
