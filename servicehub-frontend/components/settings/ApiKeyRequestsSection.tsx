"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import {
  approveApiKeyRequest,
  rejectApiKeyRequest,
  type ApiKeyRequest,
  type ApiKeyRequestStatus,
} from "@/services/apiKeys.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ApiKeyRequestsSectionProps = {
  requests: ApiKeyRequest[];
  onChanged: (message: string) => Promise<void>;
};

const STATUS_BADGE: Record<ApiKeyRequestStatus, { label: string; className: string }> = {
  pending: { label: "En attente", className: "text-bg-info" },
  approved: { label: "Approuvée", className: "text-bg-success" },
  rejected: { label: "Refusée", className: "text-bg-danger" },
  cancelled: { label: "Annulée", className: "text-bg-secondary" },
};

const VALIDITY_OPTIONS = [
  { value: "requested", label: "Validité demandée" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
  { value: "180", label: "6 mois" },
  { value: "365", label: "1 an" },
  { value: "never", label: "Sans expiration" },
];

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

function formatValidity(days: number | null): string {
  if (days === null) return "Sans expiration";
  if (days === 365) return "1 an";
  if (days === 180) return "6 mois";
  return `${days} jours`;
}

type DecisionModalProps = {
  request: ApiKeyRequest;
  decision: "approve" | "reject";
  onClose: () => void;
  onDone: (message: string) => Promise<void>;
};

function DecisionModal({ request, decision, onClose, onDone }: DecisionModalProps) {
  const [validity, setValidity] = useState("requested");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const approving = decision === "approve";

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (approving) {
        const expiresAt =
          validity === "requested"
            ? undefined
            : validity === "never"
              ? null
              : new Date(Date.now() + Number(validity) * 24 * 60 * 60 * 1000).toISOString();
        await approveApiKeyRequest(request.id, expiresAt);
        await onDone(
          `Demande « ${request.applicationName} » approuvée : la clé est disponible pour ${request.requester?.name ?? "le demandeur"}, prévenu par email.`
        );
      } else {
        await rejectApiKeyRequest(request.id, reason.trim());
        await onDone(`Demande « ${request.applicationName} » refusée. Le demandeur est prévenu par email.`);
      }
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "L'opération a échoué."));
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      titleId="api-key-request-decision-title"
      title={approving ? "Approuver la demande de clé" : "Refuser la demande de clé"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </button>
          <button
            type="button"
            className={`btn ${approving ? "btn-success" : "btn-danger"}`}
            onClick={submit}
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {approving ? "Approuver et générer la clé" : "Refuser"}
          </button>
        </>
      }
    >
      <dl className="row small mb-3">
        <dt className="col-4 text-body-secondary fw-normal">Application</dt>
        <dd className="col-8 fw-semibold">{request.applicationName}</dd>
        <dt className="col-4 text-body-secondary fw-normal">Demandeur</dt>
        <dd className="col-8">
          {request.requester ? `${request.requester.name} (${request.requester.email})` : "—"}
        </dd>
        <dt className="col-4 text-body-secondary fw-normal">Validité demandée</dt>
        <dd className="col-8">{formatValidity(request.validityDays)}</dd>
        <dt className="col-4 text-body-secondary fw-normal">Usage prévu</dt>
        <dd className="col-8" style={{ whiteSpace: "pre-wrap" }}>
          {request.usageDescription}
        </dd>
      </dl>

      {approving ? (
        <>
          <label htmlFor="approve-validity" className="form-label">
            Validité accordée
          </label>
          <select
            id="approve-validity"
            className="form-select"
            value={validity}
            onChange={(event) => setValidity(event.target.value)}
          >
            {VALIDITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.value === "requested" ? ` (${formatValidity(request.validityDays)})` : ""}
              </option>
            ))}
          </select>
          <div className="form-text">
            La clé est attribuée au demandeur : lui seul (et les administrateurs) pourra l&apos;afficher, depuis la page
            « Mes clés d&apos;API » du catalogue.
          </div>
        </>
      ) : (
        <>
          <label htmlFor="reject-reason" className="form-label">
            Motif du refus <span className="text-body-secondary">(transmis au demandeur)</span>
          </label>
          <textarea
            id="reject-reason"
            className="form-control"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </>
      )}

      {error && (
        <div className="alert alert-danger mt-3 mb-0" role="alert">
          {error}
        </div>
      )}
    </ModalShell>
  );
}

/**
 * Demandes de clés d'API faites depuis le site public : demandes en attente
 * en tête (approuver / refuser), historique des demandes traitées repliable.
 */
export default function ApiKeyRequestsSection({ requests, onChanged }: ApiKeyRequestsSectionProps) {
  const [decision, setDecision] = useState<{ request: ApiKeyRequest; type: "approve" | "reject" } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const pending = requests.filter((request) => request.status === "pending");
  const history = requests.filter((request) => request.status !== "pending");

  return (
    <section className="mb-5">
      <div className="d-flex align-items-center gap-2 mb-3">
        <h2 className="h5 fw-semibold mb-0">Demandes de clé</h2>
        {pending.length > 0 && <span className="badge rounded-pill text-bg-primary">{pending.length} en attente</span>}
      </div>

      {pending.length === 0 ? (
        <p className="text-body-secondary small">Aucune demande en attente.</p>
      ) : (
        <div className="d-flex flex-column gap-2 mb-3">
          {pending.map((request) => (
            <div key={request.id} className="card border-0 shadow-sm">
              <div className="card-body d-flex flex-column flex-md-row gap-3 align-items-md-center">
                <div className="flex-fill" style={{ minWidth: 0 }}>
                  <div className="fw-semibold">{request.applicationName}</div>
                  <div className="small text-body-secondary">
                    {request.requester ? `${request.requester.name} · ${request.requester.email}` : "—"} ·{" "}
                    {dateFormatter.format(new Date(request.createdAt))} · {formatValidity(request.validityDays)}
                  </div>
                  <div className="small mt-1 text-truncate" title={request.usageDescription}>
                    {request.usageDescription}
                  </div>
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={() => setDecision({ request, type: "approve" })}
                  >
                    <i className="bi bi-check2 me-1" aria-hidden="true" />
                    Approuver
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setDecision({ request, type: "reject" })}
                  >
                    <i className="bi bi-x-lg me-1" aria-hidden="true" />
                    Refuser
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <>
          <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setShowHistory((value) => !value)}>
            <i className={`bi ${showHistory ? "bi-chevron-up" : "bi-chevron-down"} me-1`} aria-hidden="true" />
            {showHistory ? "Masquer" : "Afficher"} l&apos;historique ({history.length})
          </button>
          {showHistory && (
            <div className="table-responsive mt-2">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th scope="col">Application</th>
                    <th scope="col">Demandeur</th>
                    <th scope="col">Demandée le</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Traitée par</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((request) => {
                    const badge = STATUS_BADGE[request.status];
                    return (
                      <tr key={request.id}>
                        <td className="fw-semibold">{request.applicationName}</td>
                        <td className="small">{request.requester?.name ?? "—"}</td>
                        <td className="small">{dateFormatter.format(new Date(request.createdAt))}</td>
                        <td>
                          <span className={`badge rounded-pill ${badge.className}`}>{badge.label}</span>
                          {request.rejectionReason && (
                            <div className="small text-body-secondary">{request.rejectionReason}</div>
                          )}
                        </td>
                        <td className="small">
                          {request.reviewedBy?.name ?? "—"}
                          {request.reviewedAt && (
                            <div className="text-body-secondary">{dateFormatter.format(new Date(request.reviewedAt))}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {decision && (
        <DecisionModal
          request={decision.request}
          decision={decision.type}
          onClose={() => setDecision(null)}
          onDone={async (message) => {
            setDecision(null);
            await onChanged(message);
          }}
        />
      )}
    </section>
  );
}
