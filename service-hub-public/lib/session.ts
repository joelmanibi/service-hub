import { cookies } from "next/headers";

/**
 * Session du site public (consultation des informations sensibles d'une
 * instance). Les jetons émis par le backend (connexion OTP, mêmes comptes
 * que l'administration) sont stockés dans des cookies httpOnly : jamais
 * lisibles par le JavaScript du navigateur, seulement par le serveur Next
 * (Server Components / Server Actions), qui les transmet au backend.
 */

const ACCESS_COOKIE = "sh_access";
const REFRESH_COOKIE = "sh_refresh";
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type SessionUser = {
  email: string;
  role: string;
};

export type Session = {
  accessToken: string;
  user: SessionUser;
};

type JwtPayload = { email?: string; role?: string; exp?: number };

// Lecture du payload sans vérification de signature : c'est le backend qui
// vérifie le jeton à chaque appel. Sert seulement à l'affichage (email) et
// à ignorer un jeton déjà expiré.
function decodePayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const payload = decodePayload(accessToken);
  if (!payload?.email || (payload.exp && payload.exp * 1000 <= Date.now())) {
    return null;
  }

  return { accessToken, user: { email: payload.email, role: payload.role ?? "" } };
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

// À appeler uniquement depuis une Server Action ou un Route Handler (seuls
// contextes où Next autorise l'écriture de cookies).
export async function saveSession(accessToken: string, refreshToken: string): Promise<void> {
  const store = await cookies();
  const payload = decodePayload(accessToken);
  const accessMaxAge = payload?.exp ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000)) : 24 * 60 * 60;

  store.set(ACCESS_COOKIE, accessToken, { ...cookieOptions, maxAge: accessMaxAge });
  store.set(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: REFRESH_MAX_AGE_SECONDS });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
