type DashboardHeaderProps = {
  title?: string;
  subtitle?: string;
};

/**
 * En-tête de page (titre + sous-titre). Extrait de page.tsx pour éviter
 * de dupliquer ce balisage si d'autres pages de la zone applicative
 * adoptent le même en-tête.
 *
 * Réutilisable : `title`/`subtitle` optionnels, texte par défaut du
 * Dashboard.
 */
export default function DashboardHeader({
  title = "Dashboard",
  subtitle = "Vue d'ensemble du catalogue de services ServiceHub.",
}: DashboardHeaderProps) {
  return (
    <div className="mb-4">
      <h1 className="h3 fw-bold mb-1">{title}</h1>
      <p className="text-body-secondary mb-0">{subtitle}</p>
    </div>
  );
}
