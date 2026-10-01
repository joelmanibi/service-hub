/**
 * Accès en lecture seule à l'API publique de ServiceHub (backend
 * `GET /public/services`, sans authentification).
 *
 * Deux URL distinctes :
 *  - `API_SERVER_URL` (variable `API_SERVER_URL`) : utilisée par le
 *    serveur Next (Server Components, Server Actions) pour appeler le
 *    backend — une URL interne convient (ex. http://127.0.0.1:5002/api/v1).
 *    Jamais envoyée au navigateur.
 *  - `NEXT_PUBLIC_API_URL` : URL de l'API telle que le NAVIGATEUR la voit
 *    (ex. /api/v1 derrière le reverse proxy, ou une URL absolue publique) ;
 *    sert à construire les liens vers les fichiers téléversés (logos,
 *    schémas d'architecture), cf. `API_ORIGIN`. Injectée au build.
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
// de Composant/Inventaire (IP, nom de serveur) ni de niveau de
// support (responsable, téléphone) — cf. backend/src/modules/public.
export type PublicInstance = {
  id: number;
  name: string;
  service: PublicReferenceItem | null;
  statutInstance: PublicReferenceItem | null;
  environments: PublicReferenceItem[];
  hostings: PublicReferenceItem[];
  pod: PublicReferenceItem | null;
  // Plateformes (dédupliquées) des composants de l'instance.
  platforms: PublicReferenceItem[];
  country: PublicReferenceItem | null;
};

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// `API_URL` : ancien nom de la variable serveur, accepté pour ne pas casser
// un .env existant.
export const API_SERVER_URL = process.env.API_SERVER_URL ?? process.env.API_URL ?? "http://localhost:3005/api/v1";

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005/api/v1";

// Origine publique du backend (sans le préfixe /api/v1) : les fichiers
// téléversés sont servis par Express à la racine (/uploads/...), hors du
// préfixe API. Chaîne vide si NEXT_PUBLIC_API_URL est relative (/api/v1) :
// les liens restent alors relatifs au domaine du site (reverse proxy).
export const API_ORIGIN = /^https?:\/\//i.test(PUBLIC_API_URL) ? new URL(PUBLIC_API_URL).origin : "";

export async function getPublicServices(): Promise<PublicService[]> {
  const response = await fetch(`${API_SERVER_URL}/public/services`);

  if (!response.ok) {
    throw new Error("Impossible de charger le catalogue de services.");
  }

  const body: ApiEnvelope<PublicService[]> = await response.json();
  return body.data;
}

// Renvoie `null` si le service n'existe pas (ou si `id` n'est pas un
// identifiant valide) — la page appelante déclenche alors `notFound()`.
export async function getPublicService(id: string): Promise<PublicService | null> {
  const response = await fetch(`${API_SERVER_URL}/public/services/${id}`);

  if (!response.ok) {
    return null;
  }

  const body: ApiEnvelope<PublicService> = await response.json();
  return body.data;
}

// Toutes les instances, tous services confondus (page "Instances").
export async function getPublicInstances(): Promise<PublicInstance[]> {
  const response = await fetch(`${API_SERVER_URL}/public/instances`);

  if (!response.ok) {
    throw new Error("Impossible de charger la liste des instances.");
  }

  const body: ApiEnvelope<PublicInstance[]> = await response.json();
  return body.data;
}

export async function getPublicServiceInstances(id: string): Promise<PublicInstance[]> {
  const response = await fetch(`${API_SERVER_URL}/public/services/${id}/instances`);

  if (!response.ok) {
    throw new Error("Impossible de charger les instances de ce service.");
  }

  const body: ApiEnvelope<PublicInstance[]> = await response.json();
  return body.data;
}

// Fiche détaillée d'une Instance (backend GET /public/services/:id/
// instances/:instanceId) : informations publiques uniquement. Le client,
// les composants (avec leur inventaire IP/serveurs) et les contacts de
// support sont des informations sensibles, servies à part
// (`getPublicServiceInstanceSensitive`) aux seuls utilisateurs connectés.
export type PublicInventaire = {
  id: number;
  ip: string;
  nomServeur: string;
};

export type PublicInstanceComposant = {
  id: number;
  name: string;
  description: string | null;
  platform: PublicReferenceItem | null;
  inventaires: PublicInventaire[];
};

export type PublicInstanceSupportLevel = {
  id: number;
  supportLevel: PublicReferenceItem | null;
  responsable: string | null;
  telephone: string | null;
};

export type PublicInstanceDetail = {
  id: number;
  code: string;
  name: string;
  comments: string | null;
  produitOceane: string | null;
  architectureImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  service: {
    id: number;
    name: string;
    logoUrl: string | null;
    serviceType: PublicServiceType | null;
  };
  statutInstance: PublicReferenceItem | null;
  pod: PublicReferenceItem | null;
  country: PublicReferenceItem | null;
  environments: PublicReferenceItem[];
  hostings: PublicReferenceItem[];
  networks: PublicReferenceItem[];
};

export type PublicInstanceSensitive = {
  client: PublicReferenceItem | null;
  composants: PublicInstanceComposant[];
  supportLevels: PublicInstanceSupportLevel[];
};

// "unauthorized" : jeton absent du backend, expiré ou révoqué — la fiche
// affiche alors les sections sensibles verrouillées (reconnexion requise).
export type SensitiveResult =
  | { status: "ok"; data: PublicInstanceSensitive }
  | { status: "unauthorized" }
  | { status: "error" };

export async function getPublicServiceInstanceSensitive(
  serviceId: string,
  instanceId: string,
  accessToken: string
): Promise<SensitiveResult> {
  try {
    const response = await fetch(`${API_SERVER_URL}/public/services/${serviceId}/instances/${instanceId}/sensitive`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (response.status === 401) return { status: "unauthorized" };
    if (!response.ok) return { status: "error" };

    const body: ApiEnvelope<PublicInstanceSensitive> = await response.json();
    return { status: "ok", data: body.data };
  } catch {
    return { status: "error" };
  }
}

// Renvoie `null` si l'instance n'existe pas ou n'appartient pas à ce
// service — la page appelante déclenche alors `notFound()`.
export async function getPublicServiceInstance(
  serviceId: string,
  instanceId: string
): Promise<PublicInstanceDetail | null> {
  const response = await fetch(`${API_SERVER_URL}/public/services/${serviceId}/instances/${instanceId}`);

  if (!response.ok) {
    return null;
  }

  const body: ApiEnvelope<PublicInstanceDetail> = await response.json();
  return body.data;
}
