import apiClient from "@/lib/axios";

/**
 * Service Types de client (référentiel `TypeClient`, module settings
 * côté backend — GET/POST/PUT sous /settings/type-clients,
 * ADMIN/VALIDATOR ; DELETE réservé ADMIN). Référentiel générique
 * (name/code/description), soft delete (`paranoid: true` côté modèle).
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface TypeClient {
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

export interface TypeClientPayload {
  name: string;
  code: string;
  description?: string;
}

export interface ListTypeClientsParams {
  page?: number;
  limit?: number;
  search?: string;
}

// GET /settings/type-clients
export async function listTypeClients(params: ListTypeClientsParams = {}): Promise<PaginatedResult<TypeClient>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<TypeClient>>>("/settings/type-clients", {
    params,
  });
  return data.data;
}

// POST /settings/type-clients
export async function createTypeClient(payload: TypeClientPayload): Promise<TypeClient> {
  const { data } = await apiClient.post<ApiEnvelope<TypeClient>>("/settings/type-clients", payload);
  return data.data;
}

// PUT /settings/type-clients/:id
export async function updateTypeClient(id: number, payload: TypeClientPayload): Promise<TypeClient> {
  const { data } = await apiClient.put<ApiEnvelope<TypeClient>>(`/settings/type-clients/${id}`, payload);
  return data.data;
}

// DELETE /settings/type-clients/:id
export async function deleteTypeClient(id: number): Promise<void> {
  await apiClient.delete(`/settings/type-clients/${id}`);
}
