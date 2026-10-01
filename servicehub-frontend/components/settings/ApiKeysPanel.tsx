"use client";

import { useEffect, useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import ApiKeyFormModal from "./ApiKeyFormModal";
import ApiKeyCreatedModal from "./ApiKeyCreatedModal";
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKey,
  type ApiKeyStatus,
  type CreateApiKeyPayload,
  type CreatedApiKey,
} from "@/services/apiKeys.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ModalState =
  | { type: "create" }
  | { type: "created"; created: CreatedApiKey }
  | { type: "revoke"; apiKey: ApiKey }
  | { type: "delete"; apiKey: ApiKey };

const STATUS_BADGE: Record<ApiKeyStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "text-bg-success" },
  revoked: { label: "Révoquée", className: "text-bg-secondary" },
  expired: { label: "Expirée", className: "text-bg-warning" },
};

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

function formatDateTime(value: string | null): string {
  return value ? dateTimeFormatter.format(new Date(value)) : "—";
}

type ConfirmModalProps = {
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant: "danger" | "warning";
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

function ConfirmModal({ title, body, confirmLabel, confirmVariant, onClose, onConfirm }: ConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (confirmError) {
      setError(getApiErrorMessage(confirmError, "L'opération a échoué."));
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      titleId="api-key-confirm-modal-title"
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </button>
          <button
            type="button"
            className={`btn btn-${confirmVariant}`}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="mb-0">{body}</p>
      {error && (
        <div className="alert alert-danger mt-3 mb-0" role="alert">
          {error}
        </div>
      )}
    </ModalShell>
  );
}

/**
 * Panneau "Clés d'API" de l'onglet Paramètres (ADMIN uniquement) : clés
 * utilisées par les applications tierces pour appeler l'API d'intégration
 * (/api/v1/integration/...). Génération (la clé n'est affichée qu'une
 * fois), suivi de la dernière utilisation, révocation (effet immédiat) et
 * suppression.
 */
export default function ApiKeysPanel() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setApiKeys(await listApiKeys());
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger les clés d'API."));
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial (état "chargement" déjà vrai par défaut) : les
  // mises à jour d'état n'interviennent qu'à la résolution de la requête.
  useEffect(() => {
    let cancelled = false;
    listApiKeys()
      .then((items) => {
        if (!cancelled) setApiKeys(items);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getApiErrorMessage(error, "Impossible de charger les clés d'API."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  };

  const closeModal = () => setModal(null);

  const handleCreate = async (payload: CreateApiKeyPayload) => {
    const created = await createApiKey(payload);
    setModal({ type: "created", created });
    await loadData();
  };

  const handleRevoke = async (apiKey: ApiKey) => {
    await revokeApiKey(apiKey.id);
    closeModal();
    showNotice(`Clé « ${apiKey.name} » révoquée : elle est refusée dès maintenant.`);
    await loadData();
  };

  const handleDelete = async (apiKey: ApiKey) => {
    await deleteApiKey(apiKey.id);
    closeModal();
    showNotice(`Clé « ${apiKey.name} » supprimée.`);
    await loadData();
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <p className="text-body-secondary mb-0">
          Clés permettant aux applications externes d&apos;interroger l&apos;API d&apos;intégration (
          <code>/api/v1/integration</code>).
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
          <i className="bi bi-key me-2" aria-hidden="true" />
          Nouvelle clé
        </button>
      </div>

      {notice && (
        <div className="alert alert-success alert-dismissible" role="status">
          {notice}
          <button type="button" className="btn-close" aria-label="Fermer" onClick={() => setNotice(null)} />
        </div>
      )}

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
          <span>{loadError}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={loadData}>
            Réessayer
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : apiKeys.length === 0 && !loadError ? (
        <div className="text-center border rounded-3 py-5 px-3">
          <i className="bi bi-key fs-2 text-body-secondary" aria-hidden="true" />
          <p className="fw-semibold mt-2 mb-1">Aucune clé d&apos;API</p>
          <p className="text-body-secondary small mb-3">
            Générez une clé pour chaque application externe qui doit accéder aux instances.
          </p>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setModal({ type: "create" })}>
            Générer une clé
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th scope="col">Application</th>
                <th scope="col">Clé</th>
                <th scope="col">Statut</th>
                <th scope="col">Créée</th>
                <th scope="col">Expiration</th>
                <th scope="col">Dernière utilisation</th>
                <th scope="col" className="text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((apiKey) => {
                const badge = STATUS_BADGE[apiKey.status];
                return (
                  <tr key={apiKey.id} className={apiKey.status === "active" ? undefined : "text-body-secondary"}>
                    <td>
                      <div className="fw-semibold">{apiKey.name}</div>
                      {apiKey.description && <div className="small text-body-secondary">{apiKey.description}</div>}
                    </td>
                    <td>
                      <code className="small">{apiKey.keyPrefix}…</code>
                    </td>
                    <td>
                      <span className={`badge rounded-pill ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td className="small">
                      {dateFormatter.format(new Date(apiKey.createdAt))}
                      {apiKey.createdBy && <div className="text-body-secondary">par {apiKey.createdBy.name}</div>}
                    </td>
                    <td className="small">
                      {apiKey.expiresAt ? dateFormatter.format(new Date(apiKey.expiresAt)) : "Jamais"}
                    </td>
                    <td className="small">
                      {apiKey.lastUsedAt ? (
                        <>
                          {formatDateTime(apiKey.lastUsedAt)}
                          {apiKey.lastUsedIp && <div className="text-body-secondary">{apiKey.lastUsedIp}</div>}
                        </>
                      ) : (
                        <span className="text-body-secondary">Jamais utilisée</span>
                      )}
                    </td>
                    <td className="text-end text-nowrap">
                      {apiKey.status === "active" && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning me-2"
                          onClick={() => setModal({ type: "revoke", apiKey })}
                        >
                          <i className="bi bi-slash-circle me-1" aria-hidden="true" />
                          Révoquer
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        aria-label={`Supprimer la clé ${apiKey.name}`}
                        onClick={() => setModal({ type: "delete", apiKey })}
                      >
                        <i className="bi bi-trash" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === "create" && <ApiKeyFormModal onClose={closeModal} onSubmit={handleCreate} />}

      {modal?.type === "created" && <ApiKeyCreatedModal created={modal.created} onClose={closeModal} />}

      {modal?.type === "revoke" && (
        <ConfirmModal
          title="Révoquer la clé d'API"
          body={`Révoquer la clé « ${modal.apiKey.name} » (${modal.apiKey.keyPrefix}…) ? L'application qui l'utilise perdra l'accès immédiatement. Cette action est définitive.`}
          confirmLabel="Révoquer"
          confirmVariant="warning"
          onClose={closeModal}
          onConfirm={() => handleRevoke(modal.apiKey)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmModal
          title="Supprimer la clé d'API"
          body={`Supprimer définitivement la clé « ${modal.apiKey.name} » (${modal.apiKey.keyPrefix}…) et son historique d'utilisation ?${modal.apiKey.status === "active" ? " Elle est encore active : l'application perdra l'accès immédiatement." : ""}`}
          confirmLabel="Supprimer"
          confirmVariant="danger"
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.apiKey)}
        />
      )}
    </div>
  );
}
