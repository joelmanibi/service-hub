import { AxiosError } from "axios";

/**
 * Extrait un message d'erreur affichable depuis une erreur Axios (l'API
 * ServiceHub répond toujours { success: false, message } en cas
 * d'erreur — voir shared/utils/ApiError.js et middlewares/errorHandler.js
 * côté backend), avec un message de repli générique si la forme ne
 * correspond pas (ex: backend injoignable).
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue. Veuillez réessayer."
): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return fallback;
}
