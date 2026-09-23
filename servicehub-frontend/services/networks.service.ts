import apiClient from "@/lib/axios";

/**
 * Service Réseaux (référentiel `Network`, module settings côté backend —
 * GET/POST/PUT sous /settings/networks, ADMIN/VALIDATOR ; DELETE réservé
 * ADMIN). Référentiel générique (name/code/description), soft delete
 * (`paranoid: true` côté modèle). Une Instance peut avoir plusieurs
 * dépendances réseau (relation many-to-many, cf. instances.service.ts —
 * `networkIds`/`networkNames`).
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Network {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NetworkPayload {
  name: string;
  code: string;
  description?: string;
}

export interface ListNetworksParams {
  page?: number;
  limit?: number;
  search?: string;
}

// GET /settings/networks
export async function listNetworks(params: ListNetworksParams = {}): Promise<PaginatedResult<Network>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<Network>>>("/settings/networks", { params });
  return data.data;
}

// POST /settings/networks
export async function createNetwork(payload: NetworkPayload): Promise<Network> {
  const { data } = await apiClient.post<ApiEnvelope<Network>>("/settings/networks", payload);
  return data.data;
}

// PUT /settings/networks/:id
export async function updateNetwork(id: number, payload: NetworkPayload): Promise<Network> {
  const { data } = await apiClient.put<ApiEnvelope<Network>>(`/settings/networks/${id}`, payload);
  return data.data;
}

// DELETE /settings/networks/:id
export async function deleteNetwork(id: number): Promise<void> {
  await apiClient.delete(`/settings/networks/${id}`);
}
