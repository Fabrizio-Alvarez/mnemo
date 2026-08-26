import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los paquetes del workspace viajan como fuente TS: Next los compila.
  transpilePackages: ["@mnemo/domain", "@mnemo/db"],
};

export default nextConfig;
