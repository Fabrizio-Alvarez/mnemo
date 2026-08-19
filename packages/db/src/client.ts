import { PrismaClient } from "@prisma/client";

/**
 * Singleton del cliente Prisma para el runtime de Node (apps/web + scripts).
 * `@mnemo/db` es la única puerta a la BD: el resto del monorepo importa desde acá.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
