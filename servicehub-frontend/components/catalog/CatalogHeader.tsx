type CatalogHeaderProps = {
  onCreate: () => void;
  onBulkImport: () => void;
};

/**
 * En-tête de la page Services (onglet Sidebar "Services", route
 * /services) : titre + boutons d'ouverture des modales de création
 * (unitaire et en masse). `flex-wrap` pour rester lisible sur mobile
 * (boutons passent sous le titre plutôt que de déborder).
 */
export default function CatalogHeader({ onCreate, onBulkImport }: CatalogHeaderProps) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h1 className="h3 fw-bold mb-1">Services</h1>
        <p className="text-body-secondary mb-0">Gestion des services proposés par l&apos;application.</p>
      </div>

      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onBulkImport}>
          <i className="bi bi-upload me-2" aria-hidden="true" />
          Importer en masse
        </button>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Nouveau service
        </button>
      </div>
    </div>
  );
}
