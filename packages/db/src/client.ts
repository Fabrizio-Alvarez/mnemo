import { PrismaNeonHTTP } from "@prisma/adapter-neon";
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
 * `PrismaPg` se carga con dynamic import porque `pg` es un módulo nativo
 * de Node que no se puede bundleear para Workers (OpenNext/Turbopack
 * no soporta serverExternalPackages para paquetes del store de pnpm).
 * Excepción a ts-no-dynamic-import: platform-specific module.
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

// Singleton async: los consumers usan `await getPrisma()`.
let prismaPromise: Promise<PrismaClient> | null = null;

export function getPrisma(): Promise<PrismaClient> {
  if (prismaPromise !== null) return prismaPromise;

  const url = process.env.DATABASE_URL;
  if (url === undefined || url === "") {
    throw new Error("DATABASE_URL no está definido");
  }

  if (esWorkersRuntime()) {
    prismaPromise = Promise.resolve(
      new PrismaClient({
        adapter: new PrismaNeonHTTP(url, { arrayMode: false, fullResults: false }),
      }),
    );
  } else {
    // Dynamic import: pg es nativo de Node, no existe en Workers.
    prismaPromise = import("@prisma/adapter-pg").then(({ PrismaPg }) =>
      new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }),
    );
  }

  // Cache en globalThis para dev (evita abrir pool por hot-reload).
  prismaPromise.then((client) => {
    if (process.env.NODE_ENV !== "production") {
      (globalThis as unknown as { prisma?: PrismaClient }).prisma = client;
    }
  });

  return prismaPromise;
}
