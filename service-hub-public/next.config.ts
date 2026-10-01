import type { NextConfig } from "next";

// Relais vers le backend (ex. http://127.0.0.1:5002) : les liens vers les
// fichiers téléversés (/uploads/..., logos et schémas) sont relatifs quand
// NEXT_PUBLIC_API_URL l'est. Si le frontal HTTPS envoie le trafic
// directement à cette application (sans passer par Nginx), Next relaie
// lui-même /uploads/* vers le backend. Les appels d'API de ce site sont
// faits côté serveur (API_SERVER_URL) et n'ont pas besoin de relais. Lu au
// build.
const backendProxyTarget = process.env.BACKEND_PROXY_TARGET?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendProxyTarget) return [];

    return [{ source: "/uploads/:path*", destination: `${backendProxyTarget}/uploads/:path*` }];
  },
};

export default nextConfig;
