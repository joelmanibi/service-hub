/**
 * Accès en lecture seule à l'API publique de ServiceHub (backend
 * `GET /public/services`, sans authentification). N'est appelé que côté
 * serveur (Server Components) — `API_URL` n'a donc pas besoin du préfixe
 * `NEXT_PUBLIC_` : jamais inclus dans le bundle envoyé au navigateur.
 */

export type PublicServiceType = {
  id: number;
  name: string;
};

export type PublicReferenceItem = {
  id: number;
  name: string;
};

// `clients`/`hostings`/`platforms` : listes dédupliquées des Clients/
// Hébergements/Plateformes des Instances de ce service, exposées
// uniquement pour alimenter les filtres de la home page (cf.
// backend/src/modules/public/service.js#withRelationalFilters) — jamais
// le détail par instance (quelle instance appartient à quel client).
export type PublicService = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  serviceType: PublicServiceType | null;
  clients: PublicReferenceItem[];
  hostings: PublicReferenceItem[];
  platforms: PublicReferenceItem[];
};

// Résumé anonymisé d'une Instance (module instance) : jamais de Client,
// de Pod, de Composant/Inventaire (IP, nom de serveur) ni de niveau de
// support (responsable, téléphone) — cf. backend/src/modules/public.
export type PublicInstance = {
  id: number;
  name: string;
  statutInstance: PublicReferenceItem | null;
  environments: PublicReferenceItem[];
  hostings: PublicReferenceItem[];
  country: PublicReferenceItem | null;
};

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

const API_URL = process.env.API_URL ?? "http://localhost:3005/api/v1";

// Origine du backend (sans le préfixe /api/v1) : les logos de service sont
// servis par Express à la racine (/uploads/...), hors du préfixe API.
export const API_ORIGIN = new URL(API_URL).origin;

export async function getPublicServices(): Promise<PublicService[]> {
  const response = await fetch(`${API_URL}/public/services`);

  if (!response.ok) {
    throw new Error("Impossible de charger le catalogue de services.");
  }

  const body: ApiEnvelope<PublicService[]> = await response.json();
  return body.data;
}

// Renvoie `null` si le service n'existe pas (ou si `id` n'est pas un
// identifiant valide) — la page appelante déclenche alors `notFound()`.
export async function getPublicService(id: string): Promise<PublicService | null> {
  const response = await fetch(`${API_URL}/public/services/${id}`);

  if (!response.ok) {
    return null;
  }

  const body: ApiEnvelope<PublicService> = await response.json();
  return body.data;
}

export async function getPublicServiceInstances(id: string): Promise<PublicInstance[]> {
  const response = await fetch(`${API_URL}/public/services/${id}/instances`);

  if (!response.ok) {
    throw new Error("Impossible de charger les instances de ce service.");
  }

  const body: ApiEnvelope<PublicInstance[]> = await response.json();
  return body.data;
}
