"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import type { Country } from "@/services/countries.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ConfirmDeleteCountryModalProps = {
  country: Country;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Modale de confirmation de suppression d'un pays (soft delete côté
 * backend — `Country` est `paranoid`). `onConfirm` doit résoudre en cas
 * de succès (le parent ferme la modale) ou rejeter en cas d'échec API
 * (affiché ici, modale conservée ouverte).
 */
export default function ConfirmDeleteCountryModal({ country, onClose, onConfirm }: ConfirmDeleteCountryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleId = "confirm-delete-country-modal-title";

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
      title="Supprimer le pays"
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
        Supprimer {country.name} ? Il ne sera plus disponible dans les listes et sélections.
      </p>
    </ModalShell>
  );
}
