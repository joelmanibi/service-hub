import apiClient from "@/lib/axios";

/**
 * Service Hébergements (référentiel `Hosting`, module settings côté
 * backend — GET/POST/PUT sous /settings/hostings, ADMIN/VALIDATOR ;
 * DELETE réservé ADMIN). Référentiel générique (name/code/description),
 * soft delete (`paranoid: true` côté modèle). Un hébergement peut avoir
 * plusieurs plateformes (`platforms`, table `platforms` — propres à cet
 * hébergement, jamais partagées avec un autre, pas un référentiel
 * sélectionné dans une liste). Un Composant d'Instance peut référencer
 * une Platform par son id (cf. instances.service.ts) : `platforms` est
 * donc synchronisée par diff — pas remplacée en bloc — pour préserver les
 * id existants (cf. modules/settings/service.js#syncPlatforms). Un
 * élément de `PlatformInput` avec `id` met à jour la plateforme
 * existante ; sans `id`, une nouvelle plateforme est créée ; toute
 * plateforme de l'hébergement absente de la liste envoyée est supprimée.
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Platform {
  id: number;
  name: string;
  description: string | null;
}

// Payload d'une plateforme envoyé au backend : `id` présent pour une
// plateforme existante (mise à jour en place), absent pour une nouvelle
// plateforme (création) — cf. modules/settings/service.js#syncPlatforms.
export interface PlatformInput {
  id?: number;
  name: string;
  description?: string;
}

export interface Hosting {
  id: number;
  name: string;
  code: string;
  description: string | null;
  platforms: Platform[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HostingPayload {
  name: string;
  code: string;
  description?: string;
  platforms?: PlatformInput[];
}

export interface ListHostingsParams {
  page?: number;
  limit?: number;
  search?: string;
}

// GET /settings/hostings
export async function listHostings(params: ListHostingsParams = {}): Promise<PaginatedResult<Hosting>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<Hosting>>>("/settings/hostings", {
    params,
  });
  return data.data;
}

// POST /settings/hostings
export async function createHosting(payload: HostingPayload): Promise<Hosting> {
  const { data } = await apiClient.post<ApiEnvelope<Hosting>>("/settings/hostings", payload);
  return data.data;
}

// PUT /settings/hostings/:id
export async function updateHosting(id: number, payload: HostingPayload): Promise<Hosting> {
  const { data } = await apiClient.put<ApiEnvelope<Hosting>>(`/settings/hostings/${id}`, payload);
  return data.data;
}

// DELETE /settings/hostings/:id
export async function deleteHosting(id: number): Promise<void> {
  await apiClient.delete(`/settings/hostings/${id}`);
}
