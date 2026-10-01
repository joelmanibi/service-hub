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

export interface ApiKey {
  id: number;
  name: string;
  description: string | null;
  keyPrefix: string;
  status: ApiKeyStatus;
  createdAt: string;
  createdBy: { id: number; name: string } | null;
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
