export type Role = "ADMIN" | "VALIDATOR" | "USER";

export type UserPod = {
  id: number;
  code: string;
  name: string;
};

export type ManagedUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  login: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  // Pods de rattachement (un ou plusieurs, éventuellement aucun).
  pods: UserPod[];
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  VALIDATOR: "Validateur",
  USER: "Utilisateur",
};
