import apiClient from "@/lib/axios";

/**
 * Service Modèles de service cloud (référentiel `CloudServiceModel`,
 * module settings côté backend — GET/POST/PUT sous
 * /settings/cloud-service-models, ADMIN/VALIDATOR ; DELETE réservé
 * ADMIN). Référentiel générique (name/code/description), soft delete
 * (`paranoid: true` côté modèle). Classification IaaS/PaaS/SaaS/FaaS/CaaS
 * d'un Service (module catalog).
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CloudServiceModel {
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

export interface CloudServiceModelPayload {
  name: string;
  code: string;
  description?: string;
}

export interface ListCloudServiceModelsParams {
  page?: number;
  limit?: number;
  search?: string;
}

// GET /settings/cloud-service-models
export async function listCloudServiceModels(
  params: ListCloudServiceModelsParams = {}
): Promise<PaginatedResult<CloudServiceModel>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<CloudServiceModel>>>(
    "/settings/cloud-service-models",
    { params }
  );
  return data.data;
}

// POST /settings/cloud-service-models
export async function createCloudServiceModel(payload: CloudServiceModelPayload): Promise<CloudServiceModel> {
  const { data } = await apiClient.post<ApiEnvelope<CloudServiceModel>>("/settings/cloud-service-models", payload);
  return data.data;
}

// PUT /settings/cloud-service-models/:id
export async function updateCloudServiceModel(
  id: number,
  payload: CloudServiceModelPayload
): Promise<CloudServiceModel> {
  const { data } = await apiClient.put<ApiEnvelope<CloudServiceModel>>(
    `/settings/cloud-service-models/${id}`,
    payload
  );
  return data.data;
}

// DELETE /settings/cloud-service-models/:id
export async function deleteCloudServiceModel(id: number): Promise<void> {
  await apiClient.delete(`/settings/cloud-service-models/${id}`);
}
