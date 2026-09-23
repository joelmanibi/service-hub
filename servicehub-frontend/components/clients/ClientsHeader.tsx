type ClientsHeaderProps = {
  onCreate: () => void;
};

/**
 * En-tête de la page Clients : titre + bouton d'ouverture de la modale
 * de création. `flex-wrap` pour rester lisible sur mobile (bouton passe
 * sous le titre plutôt que de déborder).
 */
export default function ClientsHeader({ onCreate }: ClientsHeaderProps) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h1 className="h3 fw-bold mb-1">Clients</h1>
        <p className="text-body-secondary mb-0">Gestion du référentiel des clients de l&apos;application.</p>
      </div>

      <button type="button" className="btn btn-primary" onClick={onCreate}>
        <i className="bi bi-building-add me-2" aria-hidden="true" />
        Nouveau client
      </button>
    </div>
  );
}
