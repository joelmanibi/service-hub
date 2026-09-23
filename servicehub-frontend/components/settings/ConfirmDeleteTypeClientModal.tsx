"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import type { TypeClient } from "@/services/typeClients.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ConfirmDeleteTypeClientModalProps = {
  typeClient: TypeClient;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Modale de confirmation de suppression d'un type de client (soft delete
 * côté backend — `TypeClient` est `paranoid`). `onConfirm` doit résoudre
 * en cas de succès (le parent ferme la modale) ou rejeter en cas d'échec
 * API (affiché ici, modale conservée ouverte).
 */
export default function ConfirmDeleteTypeClientModal({
  typeClient,
  onClose,
  onConfirm,
}: ConfirmDeleteTypeClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleId = "confirm-delete-type-client-modal-title";

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
      title="Supprimer le type de client"
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
        Supprimer {typeClient.name} ? Il ne sera plus disponible dans les listes et sélections.
      </p>
    </ModalShell>
  );
}
