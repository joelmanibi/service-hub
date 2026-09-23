import type { AuthUser } from "@/services/auth.service";

const ACCESS_TOKEN_KEY = "sh_access_token";
const REFRESH_TOKEN_KEY = "sh_refresh_token";
const USER_KEY = "sh_user";

/**
 * Stockage de session côté client (localStorage) : jeton d'accès, jeton
 * de rafraîchissement et informations utilisateur retournés par
 * POST /auth/verify-otp. lib/axios.ts lit le jeton d'accès d'ici pour
 * chaque requête sortante. Aucun accès direct à localStorage ailleurs
 * dans l'application — toujours passer par ces fonctions.
 */

export function setSession(session: { accessToken: string; refreshToken: string; user: AuthUser }) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function clearSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Décode le payload d'un JWT (aucune vérification de signature côté
// client — impossible sans le secret — uniquement pour lire `exp` et
// juger localement si le jeton est encore utilisable).
function decodeJwtExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Indique si une session active existe côté client : un jeton d'accès
 * est stocké et son `exp` (s'il est décodable) n'est pas dépassé.
 * Utilisé par la page racine (/) pour rediriger vers /dashboard ou
 * /login.
 */
export function hasActiveSession(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  const expiresAt = decodeJwtExpiryMs(token);
  if (expiresAt === null) return true;

  return expiresAt > Date.now();
}
