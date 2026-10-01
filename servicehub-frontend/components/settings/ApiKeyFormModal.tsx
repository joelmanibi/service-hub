"use client";

import { useState, type FormEvent } from "react";
import ModalShell from "@/components/users/ModalShell";
import type { CreateApiKeyPayload } from "@/services/apiKeys.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ApiKeyFormModalProps = {
  onClose: () => void;
  onSubmit: (payload: CreateApiKeyPayload) => Promise<void>;
};

const EXPIRATION_OPTIONS = [
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
  { value: "365", label: "1 an" },
  { value: "never", label: "Jamais" },
] as const;

/**
 * Création d'une clé d'API : nom de l'application consommatrice (sert à
 * l'identifier dans la liste et dans les logs), description facultative et
 * durée de validité. La clé elle-même est générée par le backend.
 */
export default function ApiKeyFormModal({ onClose, onSubmit }: ApiKeyFormModalProps) {
  const titleId = "api-key-form-modal-title";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expiration, setExpiration] = useState<(typeof EXPIRATION_OPTIONS)[number]["value"]>("365");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!name.trim()) {
      setError("Le nom de l'application est requis.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const expiresAt =
        expiration === "never" ? null : new Date(Date.now() + Number(expiration) * 24 * 60 * 60 * 1000).toISOString();
      await onSubmit({ name: name.trim(), description: description.trim() || undefined, expiresAt });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Impossible de créer la clé d'API."));
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      titleId={titleId}
      title="Nouvelle clé d'API"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </button>
          <button type="button" className="btn btn-primary" onClick={() => handleSubmit()} disabled={isSubmitting}>
            {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            Générer la clé
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="api-key-name" className="form-label">
            Application <span className="text-danger">*</span>
          </label>
          <input
            id="api-key-name"
            type="text"
            className={`form-control${error && !name.trim() ? " is-invalid" : ""}`}
            placeholder="Ex. Supervision, CMDB…"
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
          <div className="form-text">Nom de l&apos;application qui utilisera la clé.</div>
        </div>

        <div className="mb-3">
          <label htmlFor="api-key-description" className="form-label">
            Description <span className="text-body-secondary">(optionnel)</span>
          </label>
          <textarea
            id="api-key-description"
            className="form-control"
            rows={2}
            maxLength={255}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="mb-1">
          <label htmlFor="api-key-expiration" className="form-label">
            Validité
          </label>
          <select
            id="api-key-expiration"
            className="form-select"
            value={expiration}
            onChange={(event) => setExpiration(event.target.value as typeof expiration)}
          >
            {EXPIRATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="alert alert-danger mt-3 mb-0" role="alert">
            {error}
          </div>
        )}
      </form>
    </ModalShell>
  );
}
