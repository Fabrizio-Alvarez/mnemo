import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

/**
 * Cliente Prisma sin engine binario de Rust (engineType = "client").
 * Siempre usa un driver adapter — no hay fallback a engine nativo:
 *
 * - **Cloudflare Workers** (producción): `PrismaNeonHTTP` — habla fetch
 *   contra la BD Neon. `DATABASE_URL` llega como secret de wrangler.
 *   Limitación: no soporta transacciones interactivas (las del código
 *   usan `$transaction([])` batch, que sí funciona).
 * - **Node** (dev local, seed, scripts): `PrismaPg` — driver TCP nativo
 *   contra Postgres local (docker) o remoto. Soporta transacciones.
 *
 * La detección de Workers combina dos señales:
 *   1. `navigator.userAgent === "Cloudflare-Workers"` (oficial de workerd)
 *   2. `DATABASE_URL` no contiene "localhost" (fallback si OpenNext
 *      transpila `navigator` de forma que la primera falle)
 */
function esWorkersRuntime(): boolean {
  if (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers") {
    return true;
  }
  const url = process.env.DATABASE_URL;
  return url !== undefined && !url.includes("localhost");
}

function crearCliente(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === "") {
    throw new Error("DATABASE_URL no está definido");
  }

  if (esWorkersRuntime()) {
    return new PrismaClient({
      adapter: new PrismaNeonHTTP(url, { arrayMode: false, fullResults: false }),
    });
  }

  // Node: driver TCP nativo (Postgres local o remoto).
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
