import type { Metadata } from "next";
import Link from "next/link";
import Header from "../_components/Header";
import LockedContent from "../_components/LockedContent";
import RequestKeyForm from "./_components/RequestKeyForm";
import RevealKey from "./_components/RevealKey";
import CancelRequestButton from "./_components/CancelRequestButton";
import { getSession } from "@/lib/session";
import {
  ApiRequestError,
  getMyApiKeyRequests,
  getMyApiKeys,
  type ApiKeyRequestStatus,
  type ApiKeyStatus,
  type MyApiKey,
  type MyApiKeyRequest,
} from "@/lib/apiKeysApi";

export const metadata: Metadata = {
  title: "Mes clés d'API — ServiceHub",
};

const KEY_STATUS: Record<ApiKeyStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "text-bg-success" },
  revoked: { label: "Révoquée", className: "text-bg-secondary" },
  expired: { label: "Expirée", className: "text-bg-warning" },
};

const REQUEST_STATUS: Record<ApiKeyRequestStatus, { label: string; className: string }> = {
  pending: { label: "En attente", className: "text-bg-info" },
  approved: { label: "Approuvée", className: "text-bg-success" },
  rejected: { label: "Refusée", className: "text-bg-danger" },
  cancelled: { label: "Annulée", className: "text-bg-secondary" },
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

function formatValidity(days: number | null): string {
  if (days === null) return "Sans expiration";
  if (days === 365) return "1 an";
  if (days === 180) return "6 mois";
  return `${days} jours`;
}

function KeyCard({ apiKey }: { apiKey: MyApiKey }) {
  const status = KEY_STATUS[apiKey.status];

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
          <div>
            <div className="fw-semibold">{apiKey.name}</div>
            <code className="small">{apiKey.keyPrefix}…</code>
          </div>
          <span className={`badge rounded-pill ${status.className}`}>{status.label}</span>
        </div>

        <dl className="row small mb-3">
          <dt className="col-6 col-sm-4 text-body-secondary fw-normal">Créée le</dt>
          <dd className="col-6 col-sm-8 mb-1">{dateFormatter.format(new Date(apiKey.createdAt))}</dd>
          <dt className="col-6 col-sm-4 text-body-secondary fw-normal">Expire le</dt>
          <dd className="col-6 col-sm-8 mb-1">
            {apiKey.expiresAt ? dateFormatter.format(new Date(apiKey.expiresAt)) : "Jamais"}
          </dd>
          <dt className="col-6 col-sm-4 text-body-secondary fw-normal">Dernière utilisation</dt>
          <dd className="col-6 col-sm-8 mb-0">
            {apiKey.lastUsedAt ? dateTimeFormatter.format(new Date(apiKey.lastUsedAt)) : "Jamais utilisée"}
          </dd>
        </dl>

        {apiKey.status === "active" ? (
          apiKey.revealable ? (
            <RevealKey apiKeyId={apiKey.id} />
          ) : (
            <p className="small text-body-secondary mb-0">
              Cette clé ne peut pas être ré-affichée. Contactez un administrateur si vous l&apos;avez perdue.
            </p>
          )
        ) : (
          <p className="small text-body-secondary mb-0">
            Cette clé n&apos;est plus utilisable. Faites une nouvelle demande si vous en avez encore besoin.
          </p>
        )}
      </div>
    </div>
  );
}

function RequestsTable({ requests }: { requests: MyApiKeyRequest[] }) {
  if (requests.length === 0) {
    return <p className="text-body-secondary small mb-0">Vous n&apos;avez encore fait aucune demande.</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th scope="col">Application</th>
            <th scope="col">Demandée le</th>
            <th scope="col">Validité</th>
            <th scope="col">Statut</th>
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const status = REQUEST_STATUS[request.status];
            return (
              <tr key={request.id}>
                <td>
                  <div className="fw-semibold">{request.applicationName}</div>
                  <div className="small text-body-secondary text-truncate" style={{ maxWidth: "22rem" }}>
                    {request.usageDescription}
                  </div>
                </td>
                <td className="small">{dateFormatter.format(new Date(request.createdAt))}</td>
                <td className="small">{formatValidity(request.validityDays)}</td>
                <td>
                  <span className={`badge rounded-pill ${status.className}`}>{status.label}</span>
                  {request.status === "rejected" && request.rejectionReason && (
                    <div className="small text-body-secondary mt-1">Motif : {request.rejectionReason}</div>
                  )}
                </td>
                <td className="text-end">
                  {request.status === "pending" && <CancelRequestButton requestId={request.id} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Page « Mes clés d'API » (site public, utilisateur connecté) : clés
 * attribuées à l'utilisateur (affichables par lui seul — et par les
 * ADMIN), formulaire de demande de clé et suivi des demandes.
 */
export default async function MyApiKeysPage() {
  const session = await getSession();

  let keys: MyApiKey[] = [];
  let requests: MyApiKeyRequest[] = [];
  let loadError: string | null = null;
  let sessionExpired = false;

  if (session) {
    try {
      [keys, requests] = await Promise.all([getMyApiKeys(session.accessToken), getMyApiKeyRequests(session.accessToken)]);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) sessionExpired = true;
      else loadError = error instanceof Error ? error.message : "Le service est momentanément indisponible.";
    }
  }

  const isAuthenticated = Boolean(session) && !sessionExpired;

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-fill bg-body-tertiary py-4 px-3 px-lg-5">
        <div className="mx-auto" style={{ maxWidth: "960px" }}>
          <nav aria-label="Fil d'Ariane" className="mb-3 small">
            <Link href="/documentation" className="text-decoration-none">
              <i className="bi bi-arrow-left me-1" aria-hidden="true" />
              Documentation de l&apos;API
            </Link>
          </nav>

          <h1 className="fw-semibold mb-1" style={{ fontSize: "2rem" }}>
            Mes clés d&apos;API
          </h1>
          <p className="text-body-secondary mb-4">
            Demandez une clé pour permettre à une application d&apos;interroger l&apos;API d&apos;intégration ServiceHub.
            Une clé n&apos;est visible que par vous et par les administrateurs.
          </p>

          {!isAuthenticated ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <LockedContent
                  description="Connectez-vous avec votre compte ServiceHub pour demander une clé d'API et afficher vos clés."
                  sessionExpired={sessionExpired}
                />
              </div>
            </div>
          ) : (
            <>
              {loadError && (
                <div className="alert alert-danger" role="alert">
                  {loadError}
                </div>
              )}

              <section className="mb-5">
                <h2 className="h5 fw-semibold mb-3">
                  Mes clés <span className="badge rounded-pill bg-body-secondary text-body">{keys.length}</span>
                </h2>
                {keys.length === 0 ? (
                  <p className="text-body-secondary small">
                    Aucune clé pour le moment. Une fois votre demande approuvée, la clé apparaîtra ici.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {keys.map((apiKey) => (
                      <KeyCard key={apiKey.id} apiKey={apiKey} />
                    ))}
                  </div>
                )}
              </section>

              <section className="card border-0 shadow-sm mb-5">
                <div className="card-body p-4">
                  <h2 className="h5 fw-semibold mb-1">Nouvelle demande de clé</h2>
                  <p className="small text-body-secondary mb-3">
                    Une clé par application. Un administrateur examine la demande ; vous êtes prévenu par email.
                  </p>
                  <RequestKeyForm />
                </div>
              </section>

              <section className="card border-0 shadow-sm mb-5">
                <div className="card-body p-4">
                  <h2 className="h5 fw-semibold mb-3">Mes demandes</h2>
                  <RequestsTable requests={requests} />
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
