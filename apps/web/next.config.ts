import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los paquetes del workspace viajan como fuente TS: Next los compila.
  transpilePackages: ["@mnemo/domain", "@mnemo/db"],
  // El cliente Prisma (y su engine nativo) no se bundlea: se resuelve en runtime.
  serverExternalPackages: ["@prisma/client"],
  // Imagen de deploy autocontenida (Fly.io): .next/standalone + static.
  output: "standalone",
};

export default nextConfig;
