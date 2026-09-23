/**
 * Badge Bootstrap représentant le statut actif/inactif d'un utilisateur.
 */
export default function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`badge rounded-pill text-bg-${isActive ? "success" : "secondary"}`}>
      {isActive ? "Actif" : "Désactivé"}
    </span>
  );
}
