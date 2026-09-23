"use client";

import { useState } from "react";
import type { ManagedUser } from "./mockUsers";
import ModalShell from "./ModalShell";
import { getApiErrorMessage } from "@/lib/apiError";

export type ConfirmActionType = "deactivate" | "reactivate" | "resetAccess";

const ACTION_CONFIG: Record<
  ConfirmActionType,
  { title: string; body: (user: ManagedUser) => string; confirmLabel: string; confirmVariant: string }
> = {
  deactivate: {
    title: "Désactiver l'utilisateur",
    body: (user) =>
      `Désactiver ${user.firstName} ${user.lastName} ? Cette personne ne pourra plus se connecter tant que le compte n'est pas réactivé.`,
    confirmLabel: "Désactiver",
    confirmVariant: "danger",
  },
  reactivate: {
    title: "Réactiver l'utilisateur",
    body: (user) => `Réactiver ${user.firstName} ${user.lastName} ? Cette personne pourra à nouveau se connecter.`,
    confirmLabel: "Réactiver",
    confirmVariant: "primary",
  },
  resetAccess: {
    title: "Réinitialiser l'accès",
    body: (user) =>
      `Réinitialiser l'accès de ${user.firstName} ${user.lastName} ? Toutes ses sessions actives seront révoquées et un nouveau code de connexion sera nécessaire.`,
    confirmLabel: "Réinitialiser",
    confirmVariant: "warning",
  },
};

type ConfirmActionModalProps = {
  action: ConfirmActionType;
  user: ManagedUser;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Modale de confirmation générique (Bootstrap Modal), réutilisée pour
 * les trois actions ADMIN qui n'ont pas besoin de formulaire :
 * désactiver, réactiver, réinitialiser l'accès — évite de dupliquer
 * trois fois la même coquille de modale. `onConfirm` doit résoudre en
 * cas de succès (le parent ferme la modale) ou rejeter en cas d'échec
 * API (affiché ici, modale conservée ouverte).
 */
export default function ConfirmActionModal({ action, user, onClose, onConfirm }: ConfirmActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const config = ACTION_CONFIG[action];
  const titleId = "confirm-action-modal-title";

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      await onConfirm();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      titleId={titleId}
      title={config.title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className={`btn btn-${config.confirmVariant}`}
            disabled={isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {config.confirmLabel}
          </button>
        </>
      }
    >
      {formError && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      <p className="mb-0">{config.body(user)}</p>
    </ModalShell>
  );
}
