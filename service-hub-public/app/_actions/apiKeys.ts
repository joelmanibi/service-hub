"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError, callBackend } from "@/lib/apiKeysApi";
import { getSession } from "@/lib/session";

/**
 * Server Actions de la page « Mes clés d'API » : demande de clé, annulation
 * d'une demande en attente, affichage d'une clé. Exécutées côté serveur
 * Next avec le jeton de session (cookie httpOnly). L'affichage d'une clé
 * n'est accordé par le backend qu'à son propriétaire (ou à un ADMIN).
 */

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

const SESSION_EXPIRED = "Votre session a expiré : reconnectez-vous.";

async function run<T>(action: (accessToken: string) => Promise<T>): Promise<ActionResult<T>> {
  const session = await getSession();
  if (!session) return { ok: false, error: SESSION_EXPIRED };

  try {
    return { ok: true, data: await action(session.accessToken) };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return { ok: false, error: error.status === 401 ? SESSION_EXPIRED : error.message };
    }
    return { ok: false, error: "Le service est momentanément indisponible. Réessayez plus tard." };
  }
}

export async function createApiKeyRequestAction(input: {
  applicationName: string;
  usageDescription: string;
  validityDays: number | null;
}): Promise<ActionResult> {
  const applicationName = input.applicationName.trim();
  const usageDescription = input.usageDescription.trim();

  if (applicationName.length < 2) return { ok: false, error: "Indiquez le nom de l'application (2 caractères minimum)." };
  if (usageDescription.length < 10) {
    return { ok: false, error: "Décrivez l'usage prévu de la clé (10 caractères minimum)." };
  }

  const result = await run((token) =>
    callBackend("/api-key-requests", token, {
      method: "POST",
      body: JSON.stringify({ applicationName, usageDescription, validityDays: input.validityDays }),
    })
  );
  if (result.ok) revalidatePath("/mes-cles-api");
  return result.ok ? { ok: true, data: null } : result;
}

export async function cancelApiKeyRequestAction(requestId: number): Promise<ActionResult> {
  const result = await run((token) => callBackend(`/api-key-requests/${requestId}/cancel`, token, { method: "POST" }));
  if (result.ok) revalidatePath("/mes-cles-api");
  return result.ok ? { ok: true, data: null } : result;
}

export async function revealApiKeyAction(apiKeyId: number): Promise<ActionResult<string>> {
  const result = await run((token) => callBackend<{ key: string }>(`/api-keys/${apiKeyId}/reveal`, token));
  return result.ok ? { ok: true, data: result.data.key } : result;
}
