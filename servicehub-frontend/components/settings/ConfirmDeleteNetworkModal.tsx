"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import type { Network } from "@/services/networks.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ConfirmDeleteNetworkModalProps = {
  network: Network;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Modale de confirmation de suppression d'un réseau (soft delete côté
 * backend — `Network` est `paranoid`). Les instances qui le référencent
 * (table pivot `instance_networks`) sont détachées automatiquement
 * (`onDelete: CASCADE` sur la ligne de jonction, cf. migration
 * 20260917090010), jamais supprimées elles-mêmes. `onConfirm` doit
 * résoudre en cas de succès (le parent ferme la modale) ou rejeter en cas
 * d'échec API (affiché ici, modale conservée ouverte).
 */
export default function ConfirmDeleteNetworkModal({ network, onClose, onConfirm }: ConfirmDeleteNetworkModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleId = "confirm-delete-network-modal-title";

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
      title="Supprimer le réseau"
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
        Supprimer {network.name} ? Les instances qui en dépendent ne seront plus rattachées à ce réseau, mais ne
        seront pas supprimées.
      </p>
    </ModalShell>
  );
}
