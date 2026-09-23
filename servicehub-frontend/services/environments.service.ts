import apiClient from "@/lib/axios";

/**
 * Référentiel Environnements (`Environment`, module settings —
 * GET /settings/environments). Lecture seule côté frontend pour
 * l'instant : utilisé uniquement pour peupler le multi-select du
 * formulaire Instance (aucun onglet Paramètres dédié demandé).
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Environment {
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

// GET /settings/environments
export async function listEnvironments(): Promise<Environment[]> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<Environment>>>("/settings/environments", {
    params: { limit: 100 },
  });
  return data.data.items;
}
