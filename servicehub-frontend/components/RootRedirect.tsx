"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasActiveSession } from "@/lib/session";

/**
 * Aiguillage de la page racine (/) : redirige vers /dashboard si une
 * session active existe côté client (jeton d'accès présent et non
 * expiré, lib/session.ts), sinon vers /login. Client Component requis :
 * la vérification lit localStorage, inaccessible côté serveur.
 */
export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(hasActiveSession() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Chargement...</span>
      </div>
    </div>
  );
}
