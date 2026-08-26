import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los paquetes del workspace viajan como fuente TS: Next los compila.
  transpilePackages: ["@mnemo/domain", "@mnemo/db"],
  // Deploy activo: Cloudflare Workers (opennextjs build arma el bundle).
  // Si se retoma deploy/Dockerfile (Fly), re-habilitar `output: "standalone"`.
  // Nota: en Workers no hay resolución de módulos en runtime — TODO va
  // bundleado, incluido @prisma/client con su driver adapter (Neon HTTP).
  // Por eso NO usamos serverExternalPackages (que en Node deja @prisma/client
  // fuera del bundle para que se resuelva en runtime con su engine nativo).
};

export default nextConfig;
