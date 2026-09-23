import apiClient from "@/lib/axios";

/**
 * Service Niveaux de support (référentiel `SupportLevel`, module settings
 * côté backend — GET/POST/PUT sous /settings/support-levels,
 * ADMIN/VALIDATOR ; DELETE réservé ADMIN). Référentiel générique
 * (name/code/description), soft delete (`paranoid: true` côté modèle).
 * Une Instance peut assigner plusieurs niveaux de support, chacun avec un
 * responsable/téléphone propres à l'assignation — cf. instances.service.ts
 * (InstanceSupportLevel).
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SupportLevel {
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

export interface SupportLevelPayload {
  name: string;
  code: string;
  description?: string;
}

export interface ListSupportLevelsParams {
  page?: number;
  limit?: number;
  search?: string;
}

// GET /settings/support-levels
export async function listSupportLevels(
  params: ListSupportLevelsParams = {}
): Promise<PaginatedResult<SupportLevel>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<SupportLevel>>>("/settings/support-levels", {
    params,
  });
  return data.data;
}

// POST /settings/support-levels
export async function createSupportLevel(payload: SupportLevelPayload): Promise<SupportLevel> {
  const { data } = await apiClient.post<ApiEnvelope<SupportLevel>>("/settings/support-levels", payload);
  return data.data;
}

// PUT /settings/support-levels/:id
export async function updateSupportLevel(id: number, payload: SupportLevelPayload): Promise<SupportLevel> {
  const { data } = await apiClient.put<ApiEnvelope<SupportLevel>>(`/settings/support-levels/${id}`, payload);
  return data.data;
}

// DELETE /settings/support-levels/:id
export async function deleteSupportLevel(id: number): Promise<void> {
  await apiClient.delete(`/settings/support-levels/${id}`);
}
