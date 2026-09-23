import type { ReactNode } from "react";
import Image from "next/image";
import styles from "./layout.module.scss";

/**
 * Layout partagé par toutes les pages d'authentification (Login, Forgot
 * Password, Reset Password). Deux colonnes : panneau de marque Orange à
 * gauche (masqué sur mobile), formulaire centré à droite (largeur max
 * 420px).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-fluid p-0">
      <div className="row g-0 min-vh-100">
        {/* Colonne gauche : marque — masquée en dessous du breakpoint lg */}
        <div
          className={`col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white ${styles.brandPanel}`}
        >
          <div>
            <h1 className="h2 fw-bold mb-3">ServiceHub</h1>
            <p className="fs-5 mb-0">GOS IT Service Catalog</p>
          </div>

          {/* Illustration discrète (placeholder) */}
          <i
            className={`bi bi-diagram-3 ${styles.illustration}`}
            aria-hidden="true"
          />
        </div>

        {/* Colonne droite : formulaire d'authentification */}
        <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-white p-4">
          <div className={`w-100 ${styles.authCard}`}>
            <div className="mb-4">
              <Image src="/orange-logo.svg" alt="Orange" width={56} height={56} priority />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
