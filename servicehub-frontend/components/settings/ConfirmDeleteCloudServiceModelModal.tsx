"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import type { CloudServiceModel } from "@/services/cloudServiceModels.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ConfirmDeleteCloudServiceModelModalProps = {
  cloudServiceModel: CloudServiceModel;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Modale de confirmation de suppression d'un modèle de service cloud
 * (soft delete côté backend — `CloudServiceModel` est `paranoid`). Les
 * services qui le référencent sont détachés (`cloud_service_model_id`
 * mis à `NULL`, cf. migration 20260915090010), jamais supprimés.
 * `onConfirm` doit résoudre en cas de succès (le parent ferme la modale)
 * ou rejeter en cas d'échec API (affiché ici, modale conservée ouverte).
 */
export default function ConfirmDeleteCloudServiceModelModal({
  cloudServiceModel,
  onClose,
  onConfirm,
}: ConfirmDeleteCloudServiceModelModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleId = "confirm-delete-cloud-service-model-modal-title";

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
      title="Supprimer le modèle de service cloud"
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
        Supprimer {cloudServiceModel.name} ? Les services qui l&apos;utilisent ne seront plus classifiés, mais ne
        seront pas supprimés.
      </p>
    </ModalShell>
  );
}
