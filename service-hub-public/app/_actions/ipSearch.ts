"use server";

import { ApiRequestError, callBackend } from "@/lib/apiKeysApi";
import { getSession } from "@/lib/session";

/**
 * Recherche d'instances par adresse IP (inventaire des composants) —
 * réservée aux utilisateurs connectés : exécutée côté serveur Next avec le
 * jeton de session (cookie httpOnly), le backend refusant tout appel non
 * authentifié (GET /public/search/ip).
 */

type Ref = { id: number; name: string } | null;

export type IpSearchMatch = {
  ip: string;
  nomServeur: string;
  composant: string;
  exact: boolean;
};

export type IpSearchInstance = {
  id: number;
  code: string;
  name: string;
  service: Ref;
  statutInstance: Ref;
  pod: Ref;
  client: Ref;
  exactMatch: boolean;
  matches: IpSearchMatch[];
};

export type IpSearchResult = {
  query: string;
  total: number;
  truncated: boolean;
  instances: IpSearchInstance[];
};

export type IpSearchActionResult =
  | { ok: true; data: IpSearchResult }
  | { ok: false; error: string; sessionExpired?: boolean };

const IP_PATTERN = /^[0-9a-fA-F.:]+$/;

export async function searchInstancesByIpAction(query: string): Promise<IpSearchActionResult> {
  const term = query.trim();
  if (term.length < 2) return { ok: false, error: "Saisissez au moins 2 caractères." };
  if (!IP_PATTERN.test(term)) return { ok: false, error: "Saisissez une adresse IP (chiffres, points ou deux-points)." };

  const session = await getSession();
  if (!session) return { ok: false, error: "Votre session a expiré : reconnectez-vous.", sessionExpired: true };

  try {
    const data = await callBackend<IpSearchResult>(
      `/public/search/ip?q=${encodeURIComponent(term)}`,
      session.accessToken
    );
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      return { ok: false, error: "Votre session a expiré : reconnectez-vous.", sessionExpired: true };
    }
    return {
      ok: false,
      error: error instanceof ApiRequestError ? error.message : "Recherche momentanément indisponible.",
    };
  }
}
