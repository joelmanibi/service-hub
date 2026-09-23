import apiClient, { API_ORIGIN } from "@/lib/axios";

/**
 * Service Catalogue (entité `Service`, module catalog côté backend —
 * GET/POST/PUT sous /catalog/services, ADMIN/VALIDATOR ; DELETE réservé
 * ADMIN). Comme les référentiels du module settings, `Service` est
 * `paranoid` (suppression douce) : la suppression réussit toujours,
 * même si le service est encore référencé par des instances (leur
 * `serviceId` reste valide, mais le service supprimé n'apparaît plus
 * dans les listes/sélections). `code` est généré automatiquement par le
 * backend, jamais fourni par le formulaire. Création/modification
 * envoient un `FormData` (`multipart/form-data`) — le logo (`logo`,
 * optionnel) est un fichier, les autres champs restent des
 * chaînes/nombres classiques.
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CatalogServiceCloudServiceModel {
  id: number;
  name: string;
  code: string;
}

export interface CatalogService {
  id: number;
  code: string;
  name: string;
  serviceTypeId: number;
  description: string | null;
  logoUrl: string | null;
  cloudServiceModels: CatalogServiceCloudServiceModel[];
}

// `logoUrl` est un chemin relatif (/uploads/...) renvoyé par le backend ;
// cette fonction le résout en URL absolue utilisable dans un <img src>.
export function getServiceLogoUrl(logoUrl: string | null): string | null {
  return logoUrl ? `${API_ORIGIN}${logoUrl}` : null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListCatalogServicesParams {
  page?: number;
  limit?: number;
  search?: string;
  // Filtres relationnels : un Service n'a pas lui-même de Client/
  // Plateforme/Hébergement, mais "a" un Client/une Plateforme/un
  // Hébergement dès qu'au moins une de ses Instances y est rattachée —
  // résolus côté backend (cf. modules/catalog/service.js#resolveRelationalServiceIds).
  clientId?: number;
  platformId?: number;
  hostingId?: number;
}

export interface CatalogServicePayload {
  name: string;
  serviceTypeId: number;
  description?: string;
  cloudServiceModelIds?: number[];
  logo?: File;
}

function toFormData(payload: CatalogServicePayload): FormData {
  const formData = new FormData();
  formData.set("name", payload.name);
  formData.set("serviceTypeId", String(payload.serviceTypeId));
  if (payload.description) {
    formData.set("description", payload.description);
  }
  // Champ répété une fois par id sélectionné — multer agrège les
  // occurrences d'un même nom en tableau (cf. validator.js#`.single()`
  // pour le cas particulier d'un seul id sélectionné).
  for (const cloudServiceModelId of payload.cloudServiceModelIds ?? []) {
    formData.append("cloudServiceModelIds", String(cloudServiceModelId));
  }
  if (payload.logo) {
    formData.set("logo", payload.logo);
  }
  return formData;
}

// GET /catalog/services
export async function listCatalogServices(
  params: ListCatalogServicesParams = {}
): Promise<PaginatedResult<CatalogService>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<CatalogService>>>("/catalog/services", {
    params,
  });
  return data.data;
}

// POST /catalog/services (multipart/form-data)
export async function createCatalogService(payload: CatalogServicePayload): Promise<CatalogService> {
  const { data } = await apiClient.post<ApiEnvelope<CatalogService>>("/catalog/services", toFormData(payload), {
    headers: { "Content-Type": undefined },
  });
  return data.data;
}

// PUT /catalog/services/:id (multipart/form-data)
export async function updateCatalogService(
  id: number,
  payload: CatalogServicePayload
): Promise<CatalogService> {
  const { data } = await apiClient.put<ApiEnvelope<CatalogService>>(
    `/catalog/services/${id}`,
    toFormData(payload),
    { headers: { "Content-Type": undefined } }
  );
  return data.data;
}

// DELETE /catalog/services/:id
export async function deleteCatalogService(id: number): Promise<void> {
  await apiClient.delete(`/catalog/services/${id}`);
}
