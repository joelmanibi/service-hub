"use client";

import { useState, useTransition } from "react";
import { revealApiKeyAction } from "../../_actions/apiKeys";

/**
 * Affichage à la demande d'une clé d'API appartenant à l'utilisateur
 * connecté (le backend refuse toute autre personne qu'un ADMIN ou le
 * propriétaire). La clé n'est gardée qu'en mémoire du composant.
 */
export default function RevealKey({ apiKeyId }: { apiKeyId: number }) {
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reveal = () => {
    setError(null);
    startTransition(async () => {
      const result = await revealApiKeyAction(apiKeyId);
      if (result.ok) setKey(result.data);
      else setError(result.error);
    });
  };

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

  if (!key) {
    return (
      <div>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={reveal} disabled={isPending}>
          {isPending ? (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          ) : (
            <i className="bi bi-eye me-2" aria-hidden="true" />
          )}
          Afficher la clé
        </button>
        {error && <div className="small text-danger mt-2">{error}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="input-group input-group-sm">
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
        <button type="button" className="btn btn-outline-secondary" onClick={() => setKey(null)} aria-label="Masquer la clé">
          <i className="bi bi-eye-slash" aria-hidden="true" />
        </button>
      </div>
      <div className="form-text">Ne partagez jamais cette clé : elle donne accès aux données des instances.</div>
    </div>
  );
}
