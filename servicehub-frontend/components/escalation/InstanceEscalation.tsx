"use client";

import { useEffect, useState } from "react";
import { getEscalationMatrixForPod, type EscalationMatrix } from "@/services/escalation.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { ManagerialMatrix, TechnicalMatrix } from "./EscalationMatrixView";

/**
 * Matrice d'escalade d'une instance (fiche d'instance de l'administration) :
 * escalade managériale commune + escalade technique (ligne commune et ligne
 * du POD de l'instance).
 */
export default function InstanceEscalation({ podId }: { podId: number }) {
  const [matrix, setMatrix] = useState<EscalationMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEscalationMatrixForPod(podId)
      .then((data) => {
        if (!cancelled) setMatrix(data);
      })
      .catch((loadError) => {
        if (!cancelled) setError(getApiErrorMessage(loadError, "Impossible de charger la matrice d'escalade."));
      });
    return () => {
      cancelled = true;
    };
  }, [podId]);

  if (error) return <p className="small text-danger mb-0">{error}</p>;
  if (!matrix) {
    return (
      <div className="d-flex align-items-center gap-2 small text-body-secondary">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        Chargement de la matrice…
      </div>
    );
  }

  return (
    <>
      <ManagerialMatrix managerial={matrix.managerial} />
      <TechnicalMatrix
        normalProcess={matrix.technical.normalProcess}
        podEscalation={matrix.technical.podEscalation}
        pod={matrix.technical.pod}
        process={matrix.technical.process}
      />
    </>
  );
}
