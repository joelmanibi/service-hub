import type { NextConfig } from "next";

// Relais vers le backend (ex. http://127.0.0.1:5002), si le frontal HTTPS
// envoie le trafic directement à cette application (sans passer par
// Nginx) :
//  - /uploads/* : logos et schémas (liens relatifs quand
//    NEXT_PUBLIC_API_URL l'est) ;
//  - /api/v1/*  : API d'intégration appelée par les applications externes
//    avec l'URL de base documentée (domaine du site + /api/v1).
// Les appels d'API du site lui-même sont faits côté serveur
// (API_SERVER_URL). Lu au build.
const backendProxyTarget = process.env.BACKEND_PROXY_TARGET?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendProxyTarget) return [];

    return [
      { source: "/uploads/:path*", destination: `${backendProxyTarget}/uploads/:path*` },
      { source: "/api/v1/:path*", destination: `${backendProxyTarget}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
