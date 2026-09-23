import apiClient, { API_ORIGIN } from "@/lib/axios";

/**
 * Service Instances (module instance côté backend — GET/POST/PUT sous
 * /instances, ADMIN/VALIDATOR ; DELETE réservé ADMIN, soft delete —
 * `Instance` est `paranoid`). Le backend inclut `client`/`pod`/
 * `statutInstance` (objets imbriqués), `environments`/`hostings`/`networks`
 * (tableaux, relation many-to-many — `networks` : dépendances réseau,
 * référentiel settings.Network) et `composants` (tableau, propre à
 * l'instance — pas un référentiel partagé), chacun avec ses `inventaires`
 * imbriqués (propres au composant), et `instanceSupportLevels` (tableau
 * des niveaux de support assignés — référentiel settings.SupportLevel +
 * un `responsable`/`telephone` propres à l'assignation, jamais partagés) — envoyés en
 * création/modification (`ComposantInput[]`, `SupportLevelAssignmentInput[]`),
 * ils remplacent intégralement les listes existantes côté backend — mais
 * PAS `service` — seul `serviceId` brut est renvoyé, résolu côté UI à
 * partir du référentiel catalog/services (comme typeClientId/countryId
 * pour Client). Le schéma d'architecture (`architectureImageUrl`) est géré
 * hors de ce payload JSON, via un endpoint `multipart/form-data` dédié
 * (`uploadInstanceArchitectureImage`/`removeInstanceArchitectureImage`),
 * au même titre que le logo de Service (catalog.service.ts).
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface RawReferenceItem {
  id: number;
  name: string;
  code: string;
}

interface RawInventaire {
  id: number;
  ip: string;
  nomServeur: string;
}

interface RawComposant {
  id: number;
  name: string;
  description: string | null;
  platformId: number | null;
  platform?: { id: number; name: string } | null;
  inventaires?: RawInventaire[];
}

interface RawInstanceSupportLevel {
  id: number;
  supportLevelId: number;
  responsable: string | null;
  telephone: string | null;
  supportLevel?: RawReferenceItem | null;
}

interface RawInstance {
  id: number;
  code: string;
  name: string;
  serviceId: number;
  clientId: number;
  podId: number;
  statutInstanceId: number;
  comments: string | null;
  produitOceane: string | null;
  architectureImageUrl: string | null;
  client?: RawReferenceItem | null;
  pod?: RawReferenceItem | null;
  statutInstance?: RawReferenceItem | null;
  environments?: RawReferenceItem[];
  hostings?: RawReferenceItem[];
  networks?: RawReferenceItem[];
  composants?: RawComposant[];
  instanceSupportLevels?: RawInstanceSupportLevel[];
}

export interface Inventaire {
  id: number;
  ip: string;
  nomServeur: string;
}

// Payload d'un inventaire envoyé au backend : pas d'`id`, la liste
// complète remplace les inventaires existants du composant côté service
// (pas de diff par id — cf. modules/instance/service.js#syncComposants).
export interface InventaireInput {
  ip: string;
  nomServeur: string;
}

export interface Composant {
  id: number;
  name: string;
  description: string | null;
  platformId: number | null;
  platformName: string | null;
  inventaires: Inventaire[];
}

// Payload d'un composant envoyé au backend : pas d'`id`, la liste
// complète remplace les composants existants côté service (pas de diff
// par id — cf. modules/instance/service.js#syncComposants). `platformId`
// référence le référentiel settings.Platform (propre à un Hosting),
// facultatif — cf. hostings.service.ts.
export interface ComposantInput {
  name: string;
  description?: string;
  platformId?: number | null;
  inventaires?: InventaireInput[];
}

export interface InstanceSupportLevel {
  id: number;
  supportLevelId: number;
  supportLevelName: string;
  responsable: string | null;
  telephone: string | null;
}

// Payload d'une assignation de niveau de support envoyé au backend : pas
// d'`id`, la liste complète remplace les assignations existantes côté
// service (pas de diff par id — cf. modules/instance/service.js#syncSupportLevels).
export interface SupportLevelAssignmentInput {
  supportLevelId: number;
  responsable?: string;
  telephone?: string;
}

export interface ManagedInstance {
  id: number;
  code: string;
  name: string;
  serviceId: number;
  clientId: number;
  clientName: string;
  podId: number;
  podName: string;
  statutInstanceId: number;
  statutInstanceName: string;
  comments: string | null;
  produitOceane: string | null;
  architectureImageUrl: string | null;
  environmentIds: number[];
  environmentNames: string[];
  hostingIds: number[];
  hostingNames: string[];
  networkIds: number[];
  networkNames: string[];
  composants: Composant[];
  supportLevels: InstanceSupportLevel[];
}

// `architectureImageUrl` est un chemin relatif (/uploads/...) renvoyé par
// le backend ; cette fonction le résout en URL absolue utilisable dans un
// <img src>.
export function getInstanceArchitectureImageUrl(architectureImageUrl: string | null): string | null {
  return architectureImageUrl ? `${API_ORIGIN}${architectureImageUrl}` : null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListInstancesParams {
  page?: number;
  limit?: number;
  search?: string;
  countryId?: number;
  serviceId?: number;
  serviceTypeId?: number;
  environmentId?: number;
  statutInstanceId?: number;
  podId?: number;
}

export interface InstancePayload {
  name: string;
  serviceId: number;
  clientId: number;
  podId: number;
  statutInstanceId: number;
  comments?: string;
  produitOceane?: string;
  environmentIds?: number[];
  hostingIds?: number[];
  networkIds?: number[];
  composants?: ComposantInput[];
  supportLevels?: SupportLevelAssignmentInput[];
}

function toManagedInstance(raw: RawInstance): ManagedInstance {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    serviceId: raw.serviceId,
    clientId: raw.clientId,
    clientName: raw.client?.name ?? "",
    podId: raw.podId,
    podName: raw.pod?.name ?? "",
    statutInstanceId: raw.statutInstanceId,
    statutInstanceName: raw.statutInstance?.name ?? "",
    comments: raw.comments,
    produitOceane: raw.produitOceane,
    architectureImageUrl: raw.architectureImageUrl,
    environmentIds: (raw.environments ?? []).map((item) => item.id),
    environmentNames: (raw.environments ?? []).map((item) => item.name),
    hostingIds: (raw.hostings ?? []).map((item) => item.id),
    hostingNames: (raw.hostings ?? []).map((item) => item.name),
    networkIds: (raw.networks ?? []).map((item) => item.id),
    networkNames: (raw.networks ?? []).map((item) => item.name),
    composants: (raw.composants ?? []).map((composant) => ({
      id: composant.id,
      name: composant.name,
      description: composant.description,
      platformId: composant.platformId,
      platformName: composant.platform?.name ?? null,
      inventaires: composant.inventaires ?? [],
    })),
    supportLevels: (raw.instanceSupportLevels ?? []).map((instanceSupportLevel) => ({
      id: instanceSupportLevel.id,
      supportLevelId: instanceSupportLevel.supportLevelId,
      supportLevelName: instanceSupportLevel.supportLevel?.name ?? "",
      responsable: instanceSupportLevel.responsable,
      telephone: instanceSupportLevel.telephone,
    })),
  };
}

// GET /instances
export async function listInstances(params: ListInstancesParams = {}): Promise<PaginatedResult<ManagedInstance>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<RawInstance>>>("/instances", { params });

  return {
    ...data.data,
    items: data.data.items.map(toManagedInstance),
  };
}

// POST /instances
export async function createInstance(payload: InstancePayload): Promise<ManagedInstance> {
  const { data } = await apiClient.post<ApiEnvelope<RawInstance>>("/instances", payload);
  return toManagedInstance(data.data);
}

// PUT /instances/:id
export async function updateInstance(id: number, payload: InstancePayload): Promise<ManagedInstance> {
  const { data } = await apiClient.put<ApiEnvelope<RawInstance>>(`/instances/${id}`, payload);
  return toManagedInstance(data.data);
}

// DELETE /instances/:id
export async function deleteInstance(id: number): Promise<void> {
  await apiClient.delete(`/instances/${id}`);
}

// POST /instances/:id/architecture-image (multipart/form-data)
export async function uploadInstanceArchitectureImage(id: number, file: File): Promise<ManagedInstance> {
  const formData = new FormData();
  formData.append("architectureImage", file);
  const { data } = await apiClient.post<ApiEnvelope<RawInstance>>(
    `/instances/${id}/architecture-image`,
    formData,
    { headers: { "Content-Type": undefined } }
  );
  return toManagedInstance(data.data);
}

// DELETE /instances/:id/architecture-image
export async function removeInstanceArchitectureImage(id: number): Promise<ManagedInstance> {
  const { data } = await apiClient.delete<ApiEnvelope<RawInstance>>(`/instances/${id}/architecture-image`);
  return toManagedInstance(data.data);
}
