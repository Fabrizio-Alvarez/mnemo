import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma dual, patrón recomendado por OpenNext para Workers:
 * cliente por-request (React `cache`) — NO global, porque los pools de
 * conexión no se pueden reusar entre requests en Workers.
 *
 * - **Cloudflare Workers** (producción): `PrismaNeonHTTP` — habla fetch
 *   contra la BD Neon. `DATABASE_URL` llega como secret de wrangler.
 *   ⚠️ NO soporta transacciones ("Transactions are not supported in HTTP
 *   mode") — las server actions usan operaciones secuenciales con orden
 *   auto-reparable (ver apps/web/src/app/actions.ts).
 * - **Node** (dev local, seed, scripts): `PrismaPg` — driver TCP nativo
 *   contra Postgres local (docker) o remoto. Soporta transacciones.
 *   Se carga con dynamic import porque `pg` es un módulo nativo de Node
 *   que no se puede bundleear para Workers (excepción: platform-specific).
 *
 * `@prisma/client` va en serverExternalPackages (next.config.ts):
 * OpenNext patchea el cliente generado durante el bundle de Workers.
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

function crearCliente(): Promise<PrismaClient> {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === "") {
    throw new Error("DATABASE_URL no está definido");
  }

  if (esWorkersRuntime()) {
    return Promise.resolve(
      new PrismaClient({
        adapter: new PrismaNeonHTTP(url, { arrayMode: false, fullResults: false }),
      }),
    );
  }

  // Dynamic import: pg es nativo de Node, no existe en Workers.
  return import("@prisma/adapter-pg").then(
    ({ PrismaPg }) => new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }),
  );
}

// Cache por-request (React): dentro del mismo request devuelve la misma
// instancia; entre requests, una nueva. En scripts Node (sin request scope
// de React) el cache de React es transparente — cada llamada al script crea
// su cliente.
let cached: Promise<PrismaClient> | null = null;

export function getPrisma(): Promise<PrismaClient> {
  if (cached === null) {
    cached = crearCliente();
    // En dev (hot-reload) no retener el cliente entre restarts del módulo.
    if (process.env.NODE_ENV !== "production") {
      cached.catch(() => {
        cached = null;
      });
    }
  }
  return cached;
}
