"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import type { SupportLevel } from "@/services/supportLevels.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ConfirmDeleteSupportLevelModalProps = {
  supportLevel: SupportLevel;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Modale de confirmation de suppression d'un niveau de support (soft
 * delete côté backend — `SupportLevel` est `paranoid`). `onConfirm` doit
 * résoudre en cas de succès (le parent ferme la modale) ou rejeter en
 * cas d'échec API (affiché ici, modale conservée ouverte). Un niveau de
 * support encore assigné à une instance (instance_support_levels,
 * `onDelete: RESTRICT`) fera échouer la suppression côté base — l'erreur
 * remonte telle quelle via `getApiErrorMessage`.
 */
export default function ConfirmDeleteSupportLevelModal({
  supportLevel,
  onClose,
  onConfirm,
}: ConfirmDeleteSupportLevelModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleId = "confirm-delete-support-level-modal-title";

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
      title="Supprimer le niveau de support"
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
        Supprimer {supportLevel.name} ? Il ne sera plus disponible dans les listes et sélections.
      </p>
    </ModalShell>
  );
}
