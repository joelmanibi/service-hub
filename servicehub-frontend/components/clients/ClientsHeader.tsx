type ClientsHeaderProps = {
  onCreate: () => void;
  onExport: () => void;
  isExporting: boolean;
};

/**
 * En-tête de la page Clients : titre + boutons d'ouverture de la modale
 * de création et d'export CSV. `flex-wrap` pour rester lisible sur
 * mobile (boutons passent sous le titre plutôt que de déborder).
 */
export default function ClientsHeader({ onCreate, onExport, isExporting }: ClientsHeaderProps) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h1 className="h3 fw-bold mb-1">Clients</h1>
        <p className="text-body-secondary mb-0">Gestion du référentiel des clients de l&apos;application.</p>
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
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          <i className="bi bi-building-add me-2" aria-hidden="true" />
          Nouveau client
        </button>
      </div>
    </div>
  );
}
