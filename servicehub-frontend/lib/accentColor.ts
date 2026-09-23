export const ACCENT_CYCLE = ["primary", "info", "success", "warning", "danger", "secondary"] as const;

export type Accent = (typeof ACCENT_CYCLE)[number];

/**
 * Couleur d'accent stable à partir d'une chaîne (ex : code d'instance) —
 * la même entrée retombe toujours sur la même couleur, sans état ni
 * dépendance à l'ordre de rendu.
 */
export function accentFromSeed(seed: string): Accent {
  const sum = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return ACCENT_CYCLE[sum % ACCENT_CYCLE.length];
}
