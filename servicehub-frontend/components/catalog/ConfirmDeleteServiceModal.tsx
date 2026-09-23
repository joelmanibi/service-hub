"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import type { CatalogService } from "@/services/catalog.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ConfirmDeleteServiceModalProps = {
  service: CatalogService;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Modale de confirmation de suppression d'un service du catalogue.
 * Comme les référentiels du module settings, `Service` est `paranoid`
 * (soft delete) : la suppression réussit toujours, même si le service
 * est encore référencé par des instances (leur `serviceId` reste valide,
 * mais le service supprimé n'apparaît plus dans les listes/sélections).
 */
export default function ConfirmDeleteServiceModal({ service, onClose, onConfirm }: ConfirmDeleteServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleId = "confirm-delete-service-modal-title";

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
      title="Supprimer le service"
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
        Supprimer {service.name} ? Il ne sera plus disponible dans les listes et sélections, même s&apos;il est
        encore utilisé par des instances.
      </p>
    </ModalShell>
  );
}
