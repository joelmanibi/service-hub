import { API_SERVER_URL } from "./publicApi";

/**
 * Accès côté serveur Next (Server Components / Server Actions) aux demandes
 * de clés d'API et aux clés de l'utilisateur connecté (backend
 * /api-key-requests et /api-keys/mine), avec son jeton de session. Jamais
 * appelé depuis le navigateur : le jeton reste dans le cookie httpOnly.
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type ApiKeyStatus = "active" | "revoked" | "expired";
export type ApiKeyRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

type UserRef = { id: number; name: string; email: string } | null;

export type MyApiKey = {
  id: number;
  name: string;
  description: string | null;
  keyPrefix: string;
  status: ApiKeyStatus;
  revealable: boolean;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

export type MyApiKeyRequest = {
  id: number;
  applicationName: string;
  usageDescription: string;
  validityDays: number | null;
  status: ApiKeyRequestStatus;
  createdAt: string;
  reviewedBy: UserRef;
  reviewedAt: string | null;
  rejectionReason: string | null;
  apiKey: MyApiKey | null;
};

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function callBackend<T>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_SERVER_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  let body: Partial<ApiEnvelope<T>> = {};
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // réponse sans corps JSON
  }

  if (!response.ok) {
    throw new ApiRequestError(response.status, body.message || "Le service est momentanément indisponible.");
  }
  return body.data as T;
}

export function getMyApiKeyRequests(accessToken: string): Promise<MyApiKeyRequest[]> {
  return callBackend<MyApiKeyRequest[]>("/api-key-requests/mine", accessToken);
}

export function getMyApiKeys(accessToken: string): Promise<MyApiKey[]> {
  return callBackend<MyApiKey[]>("/api-keys/mine", accessToken);
}
