import type { NextConfig } from "next";

// Relais vers le backend (ex. http://127.0.0.1:5002) : quand
// NEXT_PUBLIC_API_URL est relative (/api/v1), les appels du navigateur
// arrivent sur le domaine de l'admin. Si le frontal HTTPS envoie le trafic
// directement à cette application (sans passer par Nginx), Next relaie
// lui-même /api/v1/* et /uploads/* vers le backend. Lu au build.
const backendProxyTarget = process.env.BACKEND_PROXY_TARGET?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendProxyTarget) return [];

    return [
      { source: "/api/v1/:path*", destination: `${backendProxyTarget}/api/v1/:path*` },
      { source: "/uploads/:path*", destination: `${backendProxyTarget}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
