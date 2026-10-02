import apiClient from "@/lib/axios";

/**
 * Service Clés d'API (module apikey côté backend — /api-keys, ADMIN
 * uniquement). Clés utilisées par les applications tierces pour appeler
 * l'API d'intégration (/integration/...). La clé en clair n'est renvoyée
 * qu'une seule fois, à la création (`CreatedApiKey.key`) : le backend n'en
 * conserve qu'une empreinte, elle n'est plus jamais relisible ensuite.
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type ApiKeyStatus = "active" | "revoked" | "expired";

export interface UserRef {
  id: number;
  name: string;
  email: string;
}

export interface ApiKey {
  id: number;
  name: string;
  description: string | null;
  keyPrefix: string;
  status: ApiKeyStatus;
  // Clé ré-affichable (copie chiffrée disponible) — false pour les clés
  // créées avant cette fonctionnalité.
  revealable: boolean;
  createdAt: string;
  createdBy: UserRef | null;
  // Utilisateur à qui la clé est attribuée (demandeur) : seul lui et les
  // ADMIN peuvent l'afficher.
  owner: UserRef | null;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
}

export interface CreateApiKeyPayload {
  name: string;
  description?: string;
  expiresAt?: string | null;
}

export interface CreatedApiKey {
  apiKey: ApiKey;
  key: string;
}

// GET /api-keys
export async function listApiKeys(): Promise<ApiKey[]> {
  const { data } = await apiClient.get<ApiEnvelope<ApiKey[]>>("/api-keys");
  return data.data;
}

// POST /api-keys
export async function createApiKey(payload: CreateApiKeyPayload): Promise<CreatedApiKey> {
  const { data } = await apiClient.post<ApiEnvelope<CreatedApiKey>>("/api-keys", payload);
  return data.data;
}

// POST /api-keys/:id/revoke
export async function revokeApiKey(id: number): Promise<ApiKey> {
  const { data } = await apiClient.post<ApiEnvelope<ApiKey>>(`/api-keys/${id}/revoke`);
  return data.data;
}

// DELETE /api-keys/:id
export async function deleteApiKey(id: number): Promise<void> {
  await apiClient.delete(`/api-keys/${id}`);
}

// GET /api-keys/:id/reveal — clé en clair (ADMIN ou propriétaire).
export async function revealApiKey(id: number): Promise<string> {
  const { data } = await apiClient.get<ApiEnvelope<{ key: string }>>(`/api-keys/${id}/reveal`);
  return data.data.key;
}

// --- Demandes de clé (faites depuis le site public) -------------------------

export type ApiKeyRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface ApiKeyRequest {
  id: number;
  applicationName: string;
  usageDescription: string;
  validityDays: number | null;
  status: ApiKeyRequestStatus;
  createdAt: string;
  requester: UserRef | null;
  reviewedBy: UserRef | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  apiKey: ApiKey | null;
}

// GET /api-key-requests
export async function listApiKeyRequests(status?: ApiKeyRequestStatus): Promise<ApiKeyRequest[]> {
  const { data } = await apiClient.get<ApiEnvelope<ApiKeyRequest[]>>("/api-key-requests", {
    params: status ? { status } : undefined,
  });
  return data.data;
}

// POST /api-key-requests/:id/approve — `expiresAt` absent : validité
// demandée ; null : sans expiration.
export async function approveApiKeyRequest(id: number, expiresAt?: string | null): Promise<ApiKeyRequest> {
  const { data } = await apiClient.post<ApiEnvelope<ApiKeyRequest>>(
    `/api-key-requests/${id}/approve`,
    expiresAt === undefined ? {} : { expiresAt }
  );
  return data.data;
}

// POST /api-key-requests/:id/reject
export async function rejectApiKeyRequest(id: number, reason?: string): Promise<ApiKeyRequest> {
  const { data } = await apiClient.post<ApiEnvelope<ApiKeyRequest>>(`/api-key-requests/${id}/reject`, {
    reason: reason || undefined,
  });
  return data.data;
}
