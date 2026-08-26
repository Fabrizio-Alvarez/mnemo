import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los paquetes del workspace viajan como fuente TS: Next los compila.
  transpilePackages: ["@mnemo/domain", "@mnemo/db"],
  // Requerido por OpenNext para Prisma en Workers: asegura que el cliente
  // generado y @prisma/client entren al build del runtime workerd
  // (OpenNext los patchea durante el bundle).
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;
