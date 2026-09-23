"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import { deleteInstance, type ManagedInstance } from "@/services/instances.service";
import { getApiErrorMessage } from "@/lib/apiError";

type RowResult = {
  id: number;
  name: string;
  status: "success" | "error";
  message: string;
};

type BulkDeleteInstancesModalProps = {
  instances: ManagedInstance[];
  onClose: () => void;
  onDone: (deletedCount: number) => void;
};

/**
 * Modale de suppression en masse d'instances sélectionnées dans
 * InstancesTable/InstancesGrid (Bootstrap Modal) — même principe que
 * BulkDeleteServicesModal (module catalog). `Instance` est `paranoid` :
 * la suppression est douce (`deletedAt`), sans conflit de clé étrangère
 * possible. Chaque instance est supprimée en appelant `deleteInstance`
 * (DELETE /instances/:id, déjà réservé ADMIN) en parallèle via
 * `Promise.allSettled`, pour que l'échec de l'une n'empêche pas la
 * suppression des autres. `onDone` est appelé une fois le rapport
 * affiché et fermé par l'utilisateur, avec le nombre d'instances
 * effectivement supprimées (le parent recharge la liste si > 0).
 */
export default function BulkDeleteInstancesModal({ instances, onClose, onDone }: BulkDeleteInstancesModalProps) {
  const titleId = "bulk-delete-instances-modal-title";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);

    const settled = await Promise.allSettled(instances.map((instance) => deleteInstance(instance.id)));

    const rowResults: RowResult[] = settled.map((outcome, index) => {
      const instance = instances[index];

      if (outcome.status === "fulfilled") {
        return { id: instance.id, name: instance.name, status: "success", message: "Supprimée." };
      }

      return {
        id: instance.id,
        name: instance.name,
        status: "error",
        message: getApiErrorMessage(outcome.reason),
      };
    });

    setResults(rowResults);
    setIsSubmitting(false);
  };

  const handleFinish = () => {
    onDone(results?.filter((result) => result.status === "success").length ?? 0);
  };

  return (
    <ModalShell
      titleId={titleId}
      title="Supprimer les instances sélectionnées"
      onClose={onClose}
      scrollable
      footer={
        results ? (
          <button type="button" className="btn btn-primary" onClick={handleFinish}>
            Terminé
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="button" className="btn btn-danger" disabled={isSubmitting} onClick={handleConfirm}>
              {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              Supprimer {instances.length} instance{instances.length > 1 ? "s" : ""}
            </button>
          </>
        )
      }
    >
      {results ? (
        <>
          <p className="mb-3">
            {results.filter((result) => result.status === "success").length} instance(s) supprimée(s),{" "}
            {results.filter((result) => result.status === "error").length} échec(s).
          </p>
          <ul className="list-unstyled mb-0">
            {results.map((result) => (
              <li key={result.id} className="d-flex align-items-center gap-2 mb-1">
                {result.status === "success" ? (
                  <i className="bi bi-check-circle text-success" aria-hidden="true" />
                ) : (
                  <i className="bi bi-x-circle text-danger" aria-hidden="true" />
                )}
                <span className="fw-semibold">{result.name}</span>
                {result.status === "error" && <span className="text-danger small">— {result.message}</span>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p>
            Supprimer les {instances.length} instance{instances.length > 1 ? "s" : ""} suivante
            {instances.length > 1 ? "s" : ""} ? Elles ne seront plus disponibles dans les listes et sélections.
          </p>
          <ul className="mb-0" style={{ maxHeight: "12rem", overflowY: "auto" }}>
            {instances.map((instance) => (
              <li key={instance.id}>{instance.name}</li>
            ))}
          </ul>
        </>
      )}
    </ModalShell>
  );
}
