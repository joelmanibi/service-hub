import apiClient from "@/lib/axios";
import type { ManagedClient } from "@/components/clients/clientTypes";

export { listTypeClients } from "@/services/typeClients.service";
export { listCountries } from "@/services/countries.service";

/**
 * Service Clients (référentiel `Client`, module settings côté backend —
 * GET/POST/PUT sous /settings/clients, ADMIN/VALIDATOR ; DELETE réservé
 * ADMIN). Le backend ne renvoie que les clés étrangères brutes
 * (typeClientId, countryId) : les libellés (type de client, pays) sont
 * résolus côté UI à partir des référentiels /settings/type-clients et
 * /settings/countries, chargés une fois par ClientsPageClient.
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface RawClient {
  id: number;
  name: string;
  code: string;
  description: string | null;
  typeClientId: number;
  countryId: number | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListClientsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ClientPayload {
  name: string;
  code: string;
  description?: string;
  typeClientId: number;
  countryId: number | null;
}

function toManagedClient(raw: RawClient): ManagedClient {
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    description: raw.description,
    typeClientId: raw.typeClientId,
    countryId: raw.countryId,
  };
}

// GET /settings/clients
export async function listClients(params: ListClientsParams = {}): Promise<PaginatedResult<ManagedClient>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<RawClient>>>("/settings/clients", {
    params,
  });

  return {
    ...data.data,
    items: data.data.items.map(toManagedClient),
  };
}

// POST /settings/clients
export async function createClient(payload: ClientPayload): Promise<ManagedClient> {
  const { data } = await apiClient.post<ApiEnvelope<RawClient>>("/settings/clients", payload);
  return toManagedClient(data.data);
}

// PUT /settings/clients/:id
export async function updateClient(id: number, payload: ClientPayload): Promise<ManagedClient> {
  const { data } = await apiClient.put<ApiEnvelope<RawClient>>(`/settings/clients/${id}`, payload);
  return toManagedClient(data.data);
}

// DELETE /settings/clients/:id
export async function deleteClient(id: number): Promise<void> {
  await apiClient.delete(`/settings/clients/${id}`);
}
