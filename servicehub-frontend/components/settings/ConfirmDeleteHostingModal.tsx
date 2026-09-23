"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import type { Hosting } from "@/services/hostings.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ConfirmDeleteHostingModalProps = {
  hosting: Hosting;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Modale de confirmation de suppression d'un hébergement (soft delete
 * côté backend — `Hosting` est `paranoid`). `onConfirm` doit résoudre en
 * cas de succès (le parent ferme la modale) ou rejeter en cas d'échec
 * API (affiché ici, modale conservée ouverte).
 */
export default function ConfirmDeleteHostingModal({ hosting, onClose, onConfirm }: ConfirmDeleteHostingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleId = "confirm-delete-hosting-modal-title";

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
      title="Supprimer l'hébergement"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn btn-danger" disabled={isSubmitting} onClick={handleConfirm}>
            {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            Supprimer
          </button>
        </>
      }
    >
      {formError && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      <p className="mb-0">
        Supprimer {hosting.name} ? Il ne sera plus disponible dans les listes et sélections.
      </p>
    </ModalShell>
  );
}
