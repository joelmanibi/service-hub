"use client";

import { useEffect, useState } from "react";
import {
  getEscalationGlobal,
  listPodEscalations,
  type EscalationGlobal,
  type PodEscalation,
} from "@/services/escalation.service";
import { getStoredUser } from "@/lib/session";
import { getApiErrorMessage } from "@/lib/apiError";
import { ManagerialMatrix, TechnicalMatrix } from "./EscalationMatrixView";
import ManagerialFormModal from "./ManagerialFormModal";
import TechnicalFormModal from "./TechnicalFormModal";

type ModalState = { type: "managerial" } | { type: "normal" } | { type: "pod"; podEscalation: PodEscalation };

function summarize(contact: PodEscalation["qualityAnalyst"]): string {
  if (!contact) return "—";
  return [contact.name, contact.email].filter(Boolean).join(" · ") || "—";
}

/**
 * Onglet Paramètres → Matrice d'escalade : escalade managériale (commune),
 * escalade technique (ligne « Normal Process » commune + une ligne par POD).
 * Chaque instance affiche la matrice managériale et, côté technique, la
 * ligne commune et celle de son POD. Modification ADMIN/VALIDATOR.
 */
export default function EscalationPanel() {
  const [global, setGlobal] = useState<EscalationGlobal | null>(null);
  const [pods, setPods] = useState<PodEscalation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanEdit(["ADMIN", "VALIDATOR"].includes(getStoredUser()?.role ?? ""));
  }, []);

  const reload = async () => {
    try {
      const [globalData, podData] = await Promise.all([getEscalationGlobal(), listPodEscalations()]);
      setGlobal(globalData);
      setPods(podData);
      setLoadError(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la matrice d'escalade."));
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([getEscalationGlobal(), listPodEscalations()])
      .then(([globalData, podData]) => {
        if (!cancelled) {
          setGlobal(globalData);
          setPods(podData);
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getApiErrorMessage(error, "Impossible de charger la matrice d'escalade."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saved = async (message: string) => {
    setModal(null);
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
    await reload();
  };

  if (loadError) {
    return (
      <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
        <span>{loadError}</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={reload}>
          Réessayer
        </button>
      </div>
    );
  }

  if (!global) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  const configuredPods = pods.filter((pod) => pod.configured);

  return (
    <div>
      <p className="text-body-secondary">
        Matrice affichée sur chaque instance : l&apos;escalade <strong>managériale</strong> est commune à tous les
        services ; l&apos;escalade <strong>technique</strong> comprend la ligne « Normal Process » commune et la ligne du{" "}
        <strong>POD de l&apos;instance</strong>.
      </p>

      {notice && (
        <div className="alert alert-success alert-dismissible" role="status">
          {notice}
          <button type="button" className="btn-close" aria-label="Fermer" onClick={() => setNotice(null)} />
        </div>
      )}

      <section className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h2 className="h5 fw-semibold mb-0">Escalade managériale</h2>
          {canEdit && (
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setModal({ type: "managerial" })}>
              <i className="bi bi-pencil me-1" aria-hidden="true" />
              Modifier
            </button>
          )}
        </div>
        <ManagerialMatrix managerial={global.managerial} />
      </section>

      <section className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h2 className="h5 fw-semibold mb-0">Escalade technique</h2>
          {canEdit && (
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setModal({ type: "normal" })}>
              <i className="bi bi-pencil me-1" aria-hidden="true" />
              Modifier le Normal Process
            </button>
          )}
        </div>
        <TechnicalMatrix normalProcess={global.technicalNormal} pods={configuredPods} process={global.technicalProcess} />

        <h3 className="h6 fw-semibold mt-4">Escalade technique par POD</h3>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th scope="col">POD</th>
                <th scope="col">Pays / partenaires</th>
                <th scope="col">Quality Analyst</th>
                <th scope="col">Head of Cluster</th>
                {canEdit && <th scope="col" className="text-end" />}
              </tr>
            </thead>
            <tbody>
              {pods.map((podEscalation) => (
                <tr key={podEscalation.pod.id}>
                  <td>
                    <span className="fw-semibold">{podEscalation.pod.name}</span>
                    {!podEscalation.configured && (
                      <span className="badge rounded-pill text-bg-warning ms-2">À configurer</span>
                    )}
                  </td>
                  <td className="small" style={{ whiteSpace: "pre-line" }}>
                    {podEscalation.countries || "—"}
                  </td>
                  <td className="small">{summarize(podEscalation.qualityAnalyst)}</td>
                  <td className="small">{summarize(podEscalation.headOfCluster)}</td>
                  {canEdit && (
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setModal({ type: "pod", podEscalation })}
                      >
                        <i className="bi bi-pencil me-1" aria-hidden="true" />
                        {podEscalation.configured ? "Modifier" : "Configurer"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal?.type === "managerial" && (
        <ManagerialFormModal
          initial={global.managerial}
          onClose={() => setModal(null)}
          onSaved={() => saved("Escalade managériale mise à jour.")}
        />
      )}
      {modal?.type === "normal" && (
        <TechnicalFormModal
          kind="normal"
          initial={global.technicalNormal}
          onClose={() => setModal(null)}
          onSaved={() => saved("Escalade technique (Normal Process) mise à jour.")}
        />
      )}
      {modal?.type === "pod" && (
        <TechnicalFormModal
          kind="pod"
          initial={modal.podEscalation}
          onClose={() => setModal(null)}
          onSaved={() => saved(`Escalade technique du POD ${modal.podEscalation.pod.name} mise à jour.`)}
        />
      )}
    </div>
  );
}
