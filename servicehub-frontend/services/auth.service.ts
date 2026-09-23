import apiClient from "@/lib/axios";

/**
 * Service d'authentification.
 * Reflète exactement le contrat du backend (modules/auth) :
 * authentification par code OTP (plus de mot de passe / plus de
 * /auth/login) — request-otp, verify-otp, refresh, logout, profile.
 */

export type Role = "ADMIN" | "VALIDATOR" | "USER";

export interface AuthUser {
  id: number;
  login: string;
  email: string;
  role: Role;
}

export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export interface ProfileResult {
  id: number;
  login: string;
  email: string;
  role: Role;
  lastLoginAt: string | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// POST /auth/request-otp — réponse toujours générique côté backend
// (anti-énumération), rien à retourner ici.
export async function requestOtp(identifier: string): Promise<void> {
  await apiClient.post<ApiEnvelope<null>>("/auth/request-otp", { identifier });
}

// POST /auth/verify-otp
export async function verifyOtp(identifier: string, code: string): Promise<VerifyOtpResult> {
  const { data } = await apiClient.post<ApiEnvelope<VerifyOtpResult>>("/auth/verify-otp", {
    identifier,
    code,
  });

  return data.data;
}

// POST /auth/refresh
export async function refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
  const { data } = await apiClient.post<ApiEnvelope<RefreshResult>>("/auth/refresh", {
    refreshToken,
  });

  return data.data;
}

// POST /auth/logout (authentifié)
export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}

// GET /auth/profile (authentifié)
export async function getProfile(): Promise<ProfileResult> {
  const { data } = await apiClient.get<ApiEnvelope<ProfileResult>>("/auth/profile");
  return data.data;
}
