"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import type { ManagedInstance } from "@/services/instances.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ConfirmDeleteInstanceModalProps = {
  instance: ManagedInstance;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Modale de confirmation de suppression d'une instance (soft delete côté
 * backend — `Instance` est `paranoid`, `.destroy()` renseigne
 * `deletedAt` sans supprimer la ligne). `onConfirm` doit résoudre en cas
 * de succès (le parent ferme la modale) ou rejeter en cas d'échec API
 * (affiché ici, modale conservée ouverte).
 */
export default function ConfirmDeleteInstanceModal({ instance, onClose, onConfirm }: ConfirmDeleteInstanceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleId = "confirm-delete-instance-modal-title";

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
      title="Supprimer l'instance"
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
        Supprimer {instance.name} ? Cette instance ne sera plus disponible dans les listes et sélections.
      </p>
    </ModalShell>
  );
}
