"use client";

import { useEffect, useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import { revealApiKey, type ApiKey } from "@/services/apiKeys.service";
import { getApiErrorMessage } from "@/lib/apiError";

type RevealApiKeyModalProps = {
  apiKey: ApiKey;
  onClose: () => void;
};

/**
 * Ré-affichage d'une clé d'API par un ADMIN (l'affichage est journalisé
 * côté backend). La clé n'est conservée qu'en mémoire, le temps de la
 * fenêtre.
 */
export default function RevealApiKeyModal({ apiKey, onClose }: RevealApiKeyModalProps) {
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    revealApiKey(apiKey.id)
      .then((value) => {
        if (!cancelled) setKey(value);
      })
      .catch((revealError) => {
        if (!cancelled) setError(getApiErrorMessage(revealError, "Impossible d'afficher la clé."));
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey.id]);

  const copy = async () => {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <ModalShell
      titleId="reveal-api-key-modal-title"
      title={`Clé d'API — ${apiKey.name}`}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Fermer
        </button>
      }
    >
      {apiKey.owner && (
        <p className="small text-body-secondary">
          Attribuée à <strong>{apiKey.owner.name}</strong> ({apiKey.owner.email}).
        </p>
      )}

      {error ? (
        <div className="alert alert-danger mb-0" role="alert">
          {error}
        </div>
      ) : !key ? (
        <div className="d-flex align-items-center gap-2 text-body-secondary">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Déchiffrement…
        </div>
      ) : (
        <>
          <div className="input-group mb-2">
            <input
              type="text"
              className="form-control font-monospace"
              value={key}
              readOnly
              aria-label="Clé d'API"
              onFocus={(event) => event.target.select()}
            />
            <button type="button" className={`btn ${copied ? "btn-success" : "btn-outline-primary"}`} onClick={copy}>
              <i className={`bi ${copied ? "bi-check2" : "bi-clipboard"} me-1`} aria-hidden="true" />
              {copied ? "Copiée" : "Copier"}
            </button>
          </div>
          <p className="small text-body-secondary mb-0">
            <i className="bi bi-shield-lock me-1" aria-hidden="true" />
            Cet affichage est journalisé. Ne transmettez la clé qu&apos;à son propriétaire.
          </p>
        </>
      )}
    </ModalShell>
  );
}
