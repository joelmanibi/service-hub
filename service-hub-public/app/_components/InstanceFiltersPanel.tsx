import FilterSection, { type FilterOption } from "./FilterSection";

type InstanceFiltersPanelProps = {
  idScope: string;
  hasActiveFilters: boolean;
  onReset: () => void;
  // Filtre Service : uniquement sur la page "Instances" (tous services
  // confondus) — absent de la page d'un service, où il n'aurait qu'une option.
  serviceOptions?: FilterOption[];
  selectedServices?: string[];
  onToggleService?: (label: string) => void;
  statusOptions: FilterOption[];
  selectedStatuses: string[];
  onToggleStatus: (label: string) => void;
  countryOptions: FilterOption[];
  selectedCountries: string[];
  onToggleCountry: (label: string) => void;
  hostingOptions: FilterOption[];
  selectedHostings: string[];
  onToggleHosting: (label: string) => void;
  platformOptions: FilterOption[];
  selectedPlatforms: string[];
  onTogglePlatform: (label: string) => void;
  podOptions: FilterOption[];
  selectedPods: string[];
  onTogglePod: (label: string) => void;
};

/**
 * Équivalent de FiltersPanel pour les listes d'instances (page d'un service
 * et page "Instances") : regroupe les FilterSection des instances
 * (service si fourni, statut, pod, pays, hébergement, plateforme) + le bouton
 * de réinitialisation, rendu à la fois dans la sidebar desktop et dans le
 * tiroir mobile. Purement présentationnel (état dans InstanceCatalogView).
 */
export default function InstanceFiltersPanel({
  idScope,
  hasActiveFilters,
  onReset,
  serviceOptions,
  selectedServices,
  onToggleService,
  statusOptions,
  selectedStatuses,
  onToggleStatus,
  countryOptions,
  selectedCountries,
  onToggleCountry,
  hostingOptions,
  selectedHostings,
  onToggleHosting,
  platformOptions,
  selectedPlatforms,
  onTogglePlatform,
  podOptions,
  selectedPods,
  onTogglePod,
}: InstanceFiltersPanelProps) {
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

      {serviceOptions && selectedServices && onToggleService && (
        <>
          <FilterSection
            title="Service"
            idPrefix={`${idScope}-instance-service`}
            options={serviceOptions}
            selected={selectedServices}
            onToggle={onToggleService}
            defaultOpen
          />

          <hr className="my-2" />
        </>
      )}

      <FilterSection
        title="Statut"
        idPrefix={`${idScope}-instance-status`}
        options={statusOptions}
        selected={selectedStatuses}
        onToggle={onToggleStatus}
        defaultOpen
      />

      <hr className="my-2" />

      <FilterSection
        title="Pod"
        idPrefix={`${idScope}-instance-pod`}
        options={podOptions}
        selected={selectedPods}
        onToggle={onTogglePod}
        defaultOpen
      />

      <hr className="my-2" />

      <FilterSection
        title="Pays"
        idPrefix={`${idScope}-instance-country`}
        options={countryOptions}
        selected={selectedCountries}
        onToggle={onToggleCountry}
        defaultOpen
      />

      <hr className="my-2" />

      <FilterSection
        title="Hébergement"
        idPrefix={`${idScope}-instance-hosting`}
        options={hostingOptions}
        selected={selectedHostings}
        onToggle={onToggleHosting}
        defaultOpen
      />

      <hr className="my-2" />

      <FilterSection
        title="Plateforme"
        idPrefix={`${idScope}-instance-platform`}
        options={platformOptions}
        selected={selectedPlatforms}
        onToggle={onTogglePlatform}
        defaultOpen
      />
    </div>
  );
}
