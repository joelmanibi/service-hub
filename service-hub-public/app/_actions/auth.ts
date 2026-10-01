"use server";

import { API_URL } from "@/lib/publicApi";
import { clearSession, getRefreshToken, getSession, saveSession } from "@/lib/session";

/**
 * Server Actions de connexion du site public — même parcours OTP que
 * l'administration (backend modules/auth : request-otp puis verify-otp),
 * mêmes comptes. Exécutées côté serveur Next : les jetons ne transitent
 * jamais par le navigateur, ils sont posés directement en cookies httpOnly.
 */

export type AuthActionResult = { ok: true } | { ok: false; error: string };

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export async function requestOtpAction(identifier: string): Promise<AuthActionResult> {
  const value = identifier.trim();
  if (!value) return { ok: false, error: "Saisissez votre identifiant ou votre email." };

  try {
    const response = await fetch(`${API_URL}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: value }),
      cache: "no-store",
    });
    if (!response.ok) {
      return { ok: false, error: await readError(response, "Impossible d'envoyer le code. Réessayez.") };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Service d'authentification indisponible. Réessayez plus tard." };
  }
}

export async function verifyOtpAction(identifier: string, code: string): Promise<AuthActionResult> {
  try {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: identifier.trim(), code: code.trim() }),
      cache: "no-store",
    });
    if (!response.ok) {
      return { ok: false, error: await readError(response, "Code invalide ou expiré.") };
    }

    const body = (await response.json()) as { data: { accessToken: string; refreshToken: string } };
    await saveSession(body.data.accessToken, body.data.refreshToken);
    return { ok: true };
  } catch {
    return { ok: false, error: "Service d'authentification indisponible. Réessayez plus tard." };
  }
}

export async function logoutAction(): Promise<void> {
  const [session, refreshToken] = await Promise.all([getSession(), getRefreshToken()]);

  // Révocation du refresh token côté backend (au mieux) — la session locale
  // est supprimée dans tous les cas.
  if (session && refreshToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => undefined);
  }

  await clearSession();
}
