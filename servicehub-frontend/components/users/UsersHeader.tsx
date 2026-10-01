type UsersHeaderProps = {
  onCreate: () => void;
  onBulkImport: () => void;
  onExport: () => void;
  isExporting: boolean;
};

/**
 * En-tête de la page Utilisateurs : titre + boutons d'ouverture de la
 * modale de création et d'export CSV. `flex-wrap` pour rester lisible
 * sur mobile (boutons passent sous le titre plutôt que de déborder).
 */
export default function UsersHeader({ onCreate, onBulkImport, onExport, isExporting }: UsersHeaderProps) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h1 className="h3 fw-bold mb-1">Utilisateurs</h1>
        <p className="text-body-secondary mb-0">
          Gestion des comptes, des rôles et des accès de l&apos;application.
        </p>
      </div>

      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onExport} disabled={isExporting}>
          {isExporting ? (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          ) : (
            <i className="bi bi-download me-2" aria-hidden="true" />
          )}
          Exporter
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onBulkImport}>
          <i className="bi bi-upload me-2" aria-hidden="true" />
          Importer en masse
        </button>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          <i className="bi bi-person-plus me-2" aria-hidden="true" />
          Nouvel utilisateur
        </button>
      </div>
    </div>
  );
}
