import type { Role } from "./mockUsers";
import { ROLE_LABELS } from "./mockUsers";

// ADMIN = accès total (orange, met en avant le rôle le plus sensible),
// VALIDATOR = lecture/création/modification (bleu), USER = lecture
// seule (gris) — cohérent avec la hiérarchie des rôles (module auth).
const ROLE_VARIANT: Record<Role, string> = {
  ADMIN: "primary",
  VALIDATOR: "info",
  USER: "secondary",
};

/**
 * Badge Bootstrap représentant le rôle d'un utilisateur (ADMIN /
 * VALIDATOR / USER). Réutilisable partout où un rôle doit être affiché
 * (table, modales).
 */
export default function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`badge text-bg-${ROLE_VARIANT[role]}`}>{ROLE_LABELS[role]}</span>
  );
}
