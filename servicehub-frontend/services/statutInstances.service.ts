import apiClient from "@/lib/axios";

/**
 * Référentiel Statuts d'instance (`StatutInstance`, module settings —
 * GET /settings/statut-instances). Lecture seule côté frontend pour
 * l'instant : utilisé uniquement pour peupler le select du formulaire
 * Instance (aucun onglet Paramètres dédié demandé).
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface StatutInstance {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// GET /settings/statut-instances
export async function listStatutInstances(): Promise<StatutInstance[]> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<StatutInstance>>>(
    "/settings/statut-instances",
    { params: { limit: 100 } }
  );
  return data.data.items;
}
