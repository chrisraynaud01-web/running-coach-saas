import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Les photos jointes aux séances passent par une Server Action — la limite par
      // défaut (1 Mo) est trop basse pour une photo prise avec un téléphone/tablette.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
