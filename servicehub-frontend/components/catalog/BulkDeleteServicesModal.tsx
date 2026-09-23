"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import { deleteCatalogService, type CatalogService } from "@/services/catalog.service";
import { getApiErrorMessage } from "@/lib/apiError";

type RowResult = {
  id: number;
  name: string;
  status: "success" | "error";
  message: string;
};

type BulkDeleteServicesModalProps = {
  services: CatalogService[];
  onClose: () => void;
  onDone: (deletedCount: number) => void;
};

/**
 * Modale de suppression en masse de services sélectionnés dans
 * ServicesTable (Bootstrap Modal). Comme les référentiels du module
 * settings, `Service` est `paranoid` (soft delete) : la suppression
 * réussit toujours, même pour un service encore référencé par des
 * instances. Chaque service est supprimé en appelant
 * `deleteCatalogService` (DELETE /catalog/services/:id, déjà réservé
 * ADMIN) en parallèle via `Promise.allSettled` — même principe que
 * BulkServiceImportModal — pour qu'un échec inattendu sur l'un
 * n'empêche pas la suppression des autres. `onDone` est appelé une fois
 * le rapport affiché et fermé par l'utilisateur, avec le nombre de
 * services effectivement supprimés (le parent recharge la liste si > 0).
 */
export default function BulkDeleteServicesModal({ services, onClose, onDone }: BulkDeleteServicesModalProps) {
  const titleId = "bulk-delete-services-modal-title";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);

    const settled = await Promise.allSettled(services.map((service) => deleteCatalogService(service.id)));

    const rowResults: RowResult[] = settled.map((outcome, index) => {
      const service = services[index];

      if (outcome.status === "fulfilled") {
        return { id: service.id, name: service.name, status: "success", message: "Supprimé." };
      }

      return {
        id: service.id,
        name: service.name,
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
      title="Supprimer les services sélectionnés"
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
              Supprimer {services.length} service{services.length > 1 ? "s" : ""}
            </button>
          </>
        )
      }
    >
      {results ? (
        <>
          <p className="mb-3">
            {results.filter((result) => result.status === "success").length} service(s) supprimé(s),{" "}
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
            Supprimer les {services.length} service{services.length > 1 ? "s" : ""} suivant
            {services.length > 1 ? "s" : ""} ? Ils ne seront plus disponibles dans les listes et sélections,
            même s&apos;ils sont encore utilisés par des instances.
          </p>
          <ul className="mb-0" style={{ maxHeight: "12rem", overflowY: "auto" }}>
            {services.map((service) => (
              <li key={service.id}>{service.name}</li>
            ))}
          </ul>
        </>
      )}
    </ModalShell>
  );
}
