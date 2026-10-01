"use client";

import { useSession } from "./SessionProvider";
import styles from "./InstanceDetailView.module.scss";

type LockedContentProps = {
  description: string;
  sessionExpired?: boolean;
  compact?: boolean;
};

/**
 * Remplace une information sensible de la fiche d'instance (client,
 * composants/inventaire, contacts de support) tant que le visiteur n'est
 * pas connecté : explication + bouton ouvrant la fenêtre de connexion.
 * Aucune donnée sensible n'est présente dans la page dans cet état — le
 * serveur ne la récupère qu'avec une session valide.
 */
export default function LockedContent({ description, sessionExpired = false, compact = false }: LockedContentProps) {
  const { openLogin } = useSession();

  if (compact) {
    return (
      <button
        type="button"
        className="btn btn-link btn-sm p-0 fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
        onClick={openLogin}
      >
        <i className="bi bi-lock" aria-hidden="true" />
        Se connecter pour voir
      </button>
    );
  }

  return (
    <div className={`text-center ${styles.locked}`}>
      <span className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${styles.lockedIcon}`}>
        <i className="bi bi-lock" aria-hidden="true" />
      </span>
      <p className="small fw-semibold mb-1">
        {sessionExpired ? "Votre session a expiré" : "Informations réservées aux utilisateurs connectés"}
      </p>
      <p className="small text-body-secondary mb-3">{description}</p>
      <button type="button" className="btn btn-sm btn-primary d-inline-flex align-items-center gap-2" onClick={openLogin}>
        <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
        Se connecter
      </button>
    </div>
  );
}
