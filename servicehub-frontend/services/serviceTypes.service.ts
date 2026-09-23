import apiClient from "@/lib/axios";

/**
 * Service Types de service (référentiel `ServiceType`, module settings
 * côté backend — GET/POST/PUT sous /settings/service-types,
 * ADMIN/VALIDATOR ; DELETE réservé ADMIN). Référentiel générique
 * (name/code/description), soft delete (`paranoid: true` côté modèle).
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ServiceType {
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

export interface ServiceTypePayload {
  name: string;
  code: string;
  description?: string;
}

export interface ListServiceTypesParams {
  page?: number;
  limit?: number;
  search?: string;
}

// GET /settings/service-types
export async function listServiceTypes(params: ListServiceTypesParams = {}): Promise<PaginatedResult<ServiceType>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<ServiceType>>>("/settings/service-types", {
    params,
  });
  return data.data;
}

// POST /settings/service-types
export async function createServiceType(payload: ServiceTypePayload): Promise<ServiceType> {
  const { data } = await apiClient.post<ApiEnvelope<ServiceType>>("/settings/service-types", payload);
  return data.data;
}

// PUT /settings/service-types/:id
export async function updateServiceType(id: number, payload: ServiceTypePayload): Promise<ServiceType> {
  const { data } = await apiClient.put<ApiEnvelope<ServiceType>>(`/settings/service-types/${id}`, payload);
  return data.data;
}

// DELETE /settings/service-types/:id
export async function deleteServiceType(id: number): Promise<void> {
  await apiClient.delete(`/settings/service-types/${id}`);
}
