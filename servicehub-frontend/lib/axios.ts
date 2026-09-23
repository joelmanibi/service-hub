import axios from "axios";
import { getAccessToken } from "./session";

/**
 * Instance Axios centrale de l'application.
 * Responsabilité : configuration commune (base URL, en-têtes,
 * intercepteurs) pour toutes les requêtes vers le backend ServiceHub.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

// Origine du backend (sans le préfixe /api/v1) : les fichiers téléversés
// (ex: logo de Service) sont servis par Express à la racine (/uploads/...),
// hors du préfixe API — cf. backend/src/app.js.
export const API_ORIGIN = new URL(API_BASE_URL).origin;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur de requête : attache le token d'accès s'il est disponible
// (lib/session.ts — stocké après un POST /auth/verify-otp réussi).
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Intercepteur de réponse : point d'extension pour la gestion centralisée
// des erreurs (ex: 401 → rafraîchissement de token via POST /auth/refresh).
// TODO: implémenter la logique de rafraîchissement automatique/déconnexion
// — non nécessaire tant qu'aucune autre page n'appelle une route
// authentifiée (seul le flux de connexion est branché pour l'instant).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default apiClient;
