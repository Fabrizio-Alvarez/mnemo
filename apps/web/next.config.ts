import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los paquetes del workspace viajan como fuente TS: Next los compila.
  transpilePackages: ["@mnemo/domain", "@mnemo/db"],
  // pg y @prisma/adapter-pg son módulos nativos de Node (TCP) que no
  // existen en el runtime de Workers. Se externalizan para que next build
  // no los bundlee — en Workers la rama que los usa nunca se ejecuta
  // (esWorkersRuntime() → PrismaNeonHTTP, no PrismaPg).
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
};

export default nextConfig;
