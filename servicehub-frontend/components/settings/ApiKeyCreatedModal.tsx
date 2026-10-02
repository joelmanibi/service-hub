"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import type { CreatedApiKey } from "@/services/apiKeys.service";

type ApiKeyCreatedModalProps = {
  created: CreatedApiKey;
  onClose: () => void;
};

/**
 * Affichage unique de la clé d'API qui vient d'être générée : le backend
 * n'en garde qu'une empreinte, elle ne pourra plus jamais être relue. La
 * fermeture n'est possible qu'après avoir confirmé l'avoir copiée.
 */
export default function ApiKeyCreatedModal({ created, onClose }: ApiKeyCreatedModalProps) {
  const titleId = "api-key-created-modal-title";
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(created.key);
      setCopied(true);
      setConfirmed(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const close = () => {
    if (confirmed) onClose();
  };

  return (
    <ModalShell
      titleId={titleId}
      title="Clé d'API générée"
      onClose={close}
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose} disabled={!confirmed}>
          J&apos;ai copié la clé
        </button>
      }
    >
      <div className="alert alert-warning d-flex gap-2" role="alert">
        <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
        <div>
          <strong>Copiez cette clé maintenant</strong> et transmettez-la uniquement à l&apos;application concernée. Elle
          reste ré-affichable plus tard par les administrateurs (bouton <i className="bi bi-eye" aria-hidden="true" />{" "}
          de la liste), chaque affichage étant journalisé.
        </div>
      </div>

      <p className="mb-2">
        Clé pour <strong>{created.apiKey.name}</strong>
        {created.apiKey.expiresAt && (
          <span className="text-body-secondary">
            {" "}
            — valable jusqu&apos;au {new Date(created.apiKey.expiresAt).toLocaleDateString("fr-FR")}
          </span>
        )}
      </p>

      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control font-monospace"
          value={created.key}
          readOnly
          aria-label="Clé d'API"
          onFocus={(event) => event.target.select()}
        />
        <button type="button" className={`btn ${copied ? "btn-success" : "btn-outline-primary"}`} onClick={handleCopy}>
          <i className={`bi ${copied ? "bi-check2" : "bi-clipboard"} me-1`} aria-hidden="true" />
          {copied ? "Copiée" : "Copier"}
        </button>
      </div>

      <p className="small text-body-secondary mb-2">L&apos;application l&apos;envoie dans l&apos;un de ces en-têtes :</p>
      <pre className="small bg-body-tertiary border rounded p-2 mb-3">
        <code>{`X-API-Key: ${created.apiKey.keyPrefix}…\nAuthorization: Bearer ${created.apiKey.keyPrefix}…`}</code>
      </pre>

      <div className="form-check">
        <input
          id="api-key-copied-confirm"
          className="form-check-input"
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <label className="form-check-label" htmlFor="api-key-copied-confirm">
          J&apos;ai copié et conservé la clé en lieu sûr.
        </label>
      </div>
    </ModalShell>
  );
}
