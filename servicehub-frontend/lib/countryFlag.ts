/**
 * Convertit un code pays ISO 3166-1 alpha-2 (ex: "CI", "CM") en emoji
 * drapeau (paire de symboles indicateurs régionaux Unicode). Les codes du
 * référentiel Country ne sont pas garantis alpha-2 (champ libre) : repli
 * sur un globe générique si la conversion ne s'applique pas.
 */
export function countryFlagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) {
    return "🌍";
  }

  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}
