import apiClient from "@/lib/axios";
import type { ManagedUser, Role } from "@/components/users/mockUsers";

/**
 * Service Utilisateurs (module users, réservé ADMIN côté backend).
 * Traduit les réponses de l'API — User avec son Credential imbriqué
 * (login, dernière connexion vivent sur Credential, pas sur User) — vers
 * le type ManagedUser attendu par l'UI (components/users), qui reste
 * inchangée : seule cette couche de mapping absorbe la différence de
 * forme entre l'API et les composants déjà construits.
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface RawCredential {
  login: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

interface RawUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  credential?: RawCredential | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "firstName" | "lastName" | "email" | "createdAt";
  order?: "ASC" | "DESC";
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  login: string;
  role?: Role;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

function formatLastLogin(iso: string | null | undefined): string | null {
  if (!iso) return null;

  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toManagedUser(raw: RawUser): ManagedUser {
  return {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.email,
    login: raw.credential?.login ?? "",
    phone: raw.phone,
    role: raw.role,
    isActive: raw.isActive,
    lastLoginAt: formatLastLogin(raw.credential?.lastLoginAt),
  };
}

// GET /users
export async function listUsers(params: ListUsersParams = {}): Promise<PaginatedResult<ManagedUser>> {
  const { data } = await apiClient.get<ApiEnvelope<PaginatedResult<RawUser>>>("/users", { params });

  return {
    ...data.data,
    items: data.data.items.map(toManagedUser),
  };
}

// POST /users
export async function createUser(payload: CreateUserPayload): Promise<ManagedUser> {
  const { data } = await apiClient.post<ApiEnvelope<RawUser>>("/users", payload);
  return toManagedUser(data.data);
}

// PUT /users/:id
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<ManagedUser> {
  const { data } = await apiClient.put<ApiEnvelope<RawUser>>(`/users/${id}`, payload);
  return toManagedUser(data.data);
}

// PATCH /users/:id/role
export async function changeUserRole(id: number, role: Role): Promise<ManagedUser> {
  const { data } = await apiClient.patch<ApiEnvelope<RawUser>>(`/users/${id}/role`, { role });
  return toManagedUser(data.data);
}

// PATCH /users/:id/activate
export async function activateUser(id: number): Promise<ManagedUser> {
  const { data } = await apiClient.patch<ApiEnvelope<RawUser>>(`/users/${id}/activate`);
  return toManagedUser(data.data);
}

// PATCH /users/:id/deactivate
export async function deactivateUser(id: number): Promise<ManagedUser> {
  const { data } = await apiClient.patch<ApiEnvelope<RawUser>>(`/users/${id}/deactivate`);
  return toManagedUser(data.data);
}

// PATCH /users/:id/reset-access
export async function resetUserAccess(id: number): Promise<void> {
  await apiClient.patch(`/users/${id}/reset-access`);
}
