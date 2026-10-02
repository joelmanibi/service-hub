"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createApiKeyRequestAction } from "../../_actions/apiKeys";

const VALIDITY_OPTIONS = [
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
  { value: "180", label: "6 mois" },
  { value: "365", label: "1 an" },
  { value: "never", label: "Sans expiration" },
];

/**
 * Formulaire de demande de clé d'API (utilisateur connecté). La demande est
 * envoyée aux administrateurs, qui l'approuvent ou la refusent.
 */
export default function RequestKeyForm() {
  const [applicationName, setApplicationName] = useState("");
  const [usageDescription, setUsageDescription] = useState("");
  const [validity, setValidity] = useState("365");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await createApiKeyRequestAction({
        applicationName,
        usageDescription,
        validityDays: validity === "never" ? null : Number(validity),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        `Demande envoyée pour « ${applicationName.trim()} ». Vous recevrez un email dès qu'un administrateur l'aura traitée.`
      );
      setApplicationName("");
      setUsageDescription("");
      setValidity("365");
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="row g-3">
        <div className="col-12 col-md-7">
          <label htmlFor="request-app-name" className="form-label small fw-semibold">
            Application <span className="text-danger">*</span>
          </label>
          <input
            id="request-app-name"
            type="text"
            className="form-control"
            placeholder="Ex. Supervision Centreon, CMDB, Outil de reporting…"
            maxLength={100}
            value={applicationName}
            onChange={(event) => setApplicationName(event.target.value)}
            disabled={isPending}
            required
          />
        </div>
        <div className="col-12 col-md-5">
          <label htmlFor="request-validity" className="form-label small fw-semibold">
            Validité souhaitée
          </label>
          <select
            id="request-validity"
            className="form-select"
            value={validity}
            onChange={(event) => setValidity(event.target.value)}
            disabled={isPending}
          >
            {VALIDITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12">
          <label htmlFor="request-usage" className="form-label small fw-semibold">
            Usage prévu <span className="text-danger">*</span>
          </label>
          <textarea
            id="request-usage"
            className="form-control"
            rows={4}
            maxLength={2000}
            placeholder="Quelles données allez-vous utiliser, pour quel besoin, à quelle fréquence d'appel ? Quelle équipe est responsable de l'application ?"
            value={usageDescription}
            onChange={(event) => setUsageDescription(event.target.value)}
            disabled={isPending}
            required
          />
          <div className="form-text">Ces informations aident l&apos;administrateur à valider votre demande.</div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger small py-2 mt-3 mb-0" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success small py-2 mt-3 mb-0" role="status">
          <i className="bi bi-check-circle me-2" aria-hidden="true" />
          {success}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary mt-3"
        disabled={isPending || !applicationName.trim() || !usageDescription.trim()}
      >
        {isPending ? (
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
        ) : (
          <i className="bi bi-send me-2" aria-hidden="true" />
        )}
        Envoyer la demande
      </button>
    </form>
  );
}
