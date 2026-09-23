import apiClient from "@/lib/axios";

/**
 * Service Pays (référentiel `Country`, module settings côté backend —
 * GET/POST/PUT sous /settings/countries, ADMIN/VALIDATOR ; DELETE réservé
 * ADMIN). Référentiel générique (name/code/description), soft delete
 * (`paranoid: true` côté modèle).
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Country {
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

export interface CountryPayload {
  name: string;
  code: string;
  description?: string;
}

export interface ListCountriesParams {
  page?: number;
  limit?: number;
  search?: string;
}

// GET /settings/countries
export async function listCountries(params: ListCountriesParams = {}): Promise<PaginatedResult<Country>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<Country>>>("/settings/countries", {
    params,
  });
  return data.data;
}

// POST /settings/countries
export async function createCountry(payload: CountryPayload): Promise<Country> {
  const { data } = await apiClient.post<ApiEnvelope<Country>>("/settings/countries", payload);
  return data.data;
}

// PUT /settings/countries/:id
export async function updateCountry(id: number, payload: CountryPayload): Promise<Country> {
  const { data } = await apiClient.put<ApiEnvelope<Country>>(`/settings/countries/${id}`, payload);
  return data.data;
}

// DELETE /settings/countries/:id
export async function deleteCountry(id: number): Promise<void> {
  await apiClient.delete(`/settings/countries/${id}`);
}
