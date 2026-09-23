export type StatusDotVariant = "success" | "danger" | "secondary";

/**
 * Couleur du point de statut d'instance à partir du libellé StatutInstance
 * (référentiel settings, texte libre — pas un enum fixe). Comparaison
 * insensible à la casse et aux accents pour rester robuste aux variantes
 * de saisie ("En Service", "en service", ...). Toute autre valeur retombe
 * sur le point neutre.
 */
export function getStatusDotVariant(statusName: string): StatusDotVariant {
  const normalized = statusName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

  if (normalized === "en service") return "success";
  if (normalized === "decommissionne") return "danger";
  return "secondary";
}
