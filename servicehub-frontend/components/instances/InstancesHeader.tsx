type InstancesHeaderProps = {
  onCreate: () => void;
  onBulkImport: () => void;
};

/**
 * En-tête de la page Catalogue (onglet Sidebar "Catalogue", route
 * /catalog — liste les instances, déploiements concrets d'un service
 * chez un client) : titre + boutons d'ouverture des modales de création
 * (unitaire et en masse). `flex-wrap` pour rester lisible sur mobile
 * (boutons passent sous le titre plutôt que de déborder).
 */
export default function InstancesHeader({ onCreate, onBulkImport }: InstancesHeaderProps) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h1 className="h3 fw-bold mb-1">Catalogue</h1>
        <p className="text-body-secondary mb-0">
          Gestion des instances de service
        </p>
      </div>

      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onBulkImport}>
          <i className="bi bi-upload me-2" aria-hidden="true" />
          Importer en masse
        </button>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Nouvelle instance
        </button>
      </div>
    </div>
  );
}
