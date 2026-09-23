type UsersHeaderProps = {
  onCreate: () => void;
};

/**
 * En-tête de la page Utilisateurs : titre + bouton d'ouverture de la
 * modale de création. `flex-wrap` pour rester lisible sur mobile
 * (bouton passe sous le titre plutôt que de déborder).
 */
export default function UsersHeader({ onCreate }: UsersHeaderProps) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h1 className="h3 fw-bold mb-1">Utilisateurs</h1>
        <p className="text-body-secondary mb-0">
          Gestion des comptes, des rôles et des accès de l&apos;application.
        </p>
      </div>

      <button type="button" className="btn btn-primary" onClick={onCreate}>
        <i className="bi bi-person-plus me-2" aria-hidden="true" />
        Nouvel utilisateur
      </button>
    </div>
  );
}
