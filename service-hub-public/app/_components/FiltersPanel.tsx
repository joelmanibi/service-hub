import FilterSection, { type FilterOption } from "./FilterSection";

type FiltersPanelProps = {
  idScope: string;
  hasActiveFilters: boolean;
  onReset: () => void;
  serviceTypes: FilterOption[];
  selectedTypes: string[];
  onToggleType: (label: string) => void;
  clientOptions: FilterOption[];
  selectedClients: string[];
  onToggleClient: (label: string) => void;
  platformOptions: FilterOption[];
  selectedPlatforms: string[];
  onTogglePlatform: (label: string) => void;
  hostingOptions: FilterOption[];
  selectedHostings: string[];
  onToggleHosting: (label: string) => void;
};

/**
 * Regroupe les 4 FilterSection du catalogue + le bouton de
 * réinitialisation. Factorisé pour être rendu à la fois dans la
 * sidebar desktop et dans le tiroir mobile sans dupliquer le JSX —
 * purement présentationnel, aucun état propre (tout vient de
 * CatalogView). `idScope` préfixe les id HTML pour rester uniques
 * quand les deux instances existent en même temps dans le DOM.
 */
export default function FiltersPanel({
  idScope,
  hasActiveFilters,
  onReset,
  serviceTypes,
  selectedTypes,
  onToggleType,
  clientOptions,
  selectedClients,
  onToggleClient,
  platformOptions,
  selectedPlatforms,
  onTogglePlatform,
  hostingOptions,
  selectedHostings,
  onToggleHosting,
}: FiltersPanelProps) {
  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="small fw-semibold text-uppercase text-body-secondary">Filtres</span>
        {hasActiveFilters && (
          <button type="button" className="btn btn-link btn-sm p-0" onClick={onReset}>
            Réinitialiser
          </button>
        )}
      </div>

      <hr className="my-2" />

      <FilterSection
        title="Type de service"
        idPrefix={`${idScope}-service-type`}
        options={serviceTypes}
        selected={selectedTypes}
        onToggle={onToggleType}
        defaultOpen
      />

      <hr className="my-2" />

      <FilterSection
        title="Client"
        idPrefix={`${idScope}-service-client`}
        options={clientOptions}
        selected={selectedClients}
        onToggle={onToggleClient}
        defaultOpen
      />

      <hr className="my-2" />

      <FilterSection
        title="Plateforme"
        idPrefix={`${idScope}-service-platform`}
        options={platformOptions}
        selected={selectedPlatforms}
        onToggle={onTogglePlatform}
        defaultOpen
      />

      <hr className="my-2" />

      <FilterSection
        title="Hébergement"
        idPrefix={`${idScope}-service-hosting`}
        options={hostingOptions}
        selected={selectedHostings}
        onToggle={onToggleHosting}
        defaultOpen
      />
    </div>
  );
}
