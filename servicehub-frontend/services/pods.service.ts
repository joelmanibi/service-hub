import apiClient from "@/lib/axios";

/**
 * Service Pods (référentiel `Pod`, module settings côté backend —
 * GET/POST/PUT sous /settings/pods, ADMIN/VALIDATOR ; DELETE réservé
 * ADMIN). Référentiel générique (name/code/description), soft delete
 * (`paranoid: true` côté modèle). Chaque Instance appartient obligatoirement
 * à un Pod (instances.pod_id).
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pod {
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

export interface PodPayload {
  name: string;
  code: string;
  description?: string;
}

export interface ListPodsParams {
  page?: number;
  limit?: number;
  search?: string;
}

// GET /settings/pods
export async function listPods(params: ListPodsParams = {}): Promise<PaginatedResult<Pod>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<Pod>>>("/settings/pods", {
    params,
  });
  return data.data;
}

// POST /settings/pods
export async function createPod(payload: PodPayload): Promise<Pod> {
  const { data } = await apiClient.post<ApiEnvelope<Pod>>("/settings/pods", payload);
  return data.data;
}

// PUT /settings/pods/:id
export async function updatePod(id: number, payload: PodPayload): Promise<Pod> {
  const { data } = await apiClient.put<ApiEnvelope<Pod>>(`/settings/pods/${id}`, payload);
  return data.data;
}

// DELETE /settings/pods/:id
export async function deletePod(id: number): Promise<void> {
  await apiClient.delete(`/settings/pods/${id}`);
}
