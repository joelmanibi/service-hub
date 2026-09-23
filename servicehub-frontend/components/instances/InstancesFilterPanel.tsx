"use client";

import { useEffect, useRef, useState } from "react";
import type { ReferenceItem } from "@/components/clients/clientTypes";
import type { CatalogService } from "@/services/catalog.service";
import type { ServiceType } from "@/services/serviceTypes.service";
import type { Environment } from "@/services/environments.service";
import type { StatutInstance } from "@/services/statutInstances.service";
import type { Pod } from "@/services/pods.service";
import SearchableSelect from "@/components/common/SearchableSelect";

export type InstanceFilters = {
  countryId: string;
  serviceId: string;
  serviceTypeId: string;
  environmentId: string;
  statutInstanceId: string;
  podId: string;
};

export const EMPTY_INSTANCE_FILTERS: InstanceFilters = {
  countryId: "",
  serviceId: "",
  serviceTypeId: "",
  environmentId: "",
  statutInstanceId: "",
  podId: "",
};

type InstancesFilterPanelProps = {
  search: string;
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
  filters: InstanceFilters;
  onChange: (filters: InstanceFilters) => void;
  countries: ReferenceItem[];
  services: CatalogService[];
  serviceTypes: ServiceType[];
  environments: Environment[];
  statutInstances: StatutInstance[];
  pods: Pod[];
};

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Panneau de recherche + filtres de la page Catalogue (instances). La
 * recherche (nom/code/commentaire, cf. `search` de GET /instances côté
 * backend — LIKE %terme%, donc "commence par" et "contient" tous deux
 * couverts) est toujours visible et instantanée : la saisie est reflétée
 * immédiatement dans le champ, mais debouncée avant de remonter au
 * parent (InstancesPageClient) pour ne pas déclencher un appel API à
 * chaque frappe. Les filtres avancés (pays, service, type, environnement,
 * statut, pod) restent dans le panneau repliable en dessous — appliqués
 * côté serveur eux aussi, pas un filtrage local de la page actuellement
 * chargée, pour rester correct avec la pagination.
 */
export default function InstancesFilterPanel({
  search,
  onSearchChange,
  isSearching = false,
  filters,
  onChange,
  countries,
  services,
  serviceTypes,
  environments,
  statutInstances,
  pods,
}: InstancesFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const onSearchChangeRef = useRef(onSearchChange);
  const hasActiveFilters = Object.values(filters).some((value) => value !== "") || search !== "";
  const panelId = "instances-filter-panel-body";

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChangeRef.current(searchInput);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const update = (key: keyof InstanceFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const resetAll = () => {
    onChange(EMPTY_INSTANCE_FILTERS);
    setSearchInput("");
    onSearchChange("");
  };

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="mb-3">
          <label htmlFor="instances-search" className="visually-hidden">
            Rechercher une instance
          </label>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              {isSearching ? (
                <span className="spinner-border spinner-border-sm text-secondary" aria-hidden="true" />
              ) : (
                <i className="bi bi-search" aria-hidden="true" />
              )}
            </span>
            <input
              id="instances-search"
              type="search"
              className="form-control border-start-0"
              placeholder="Rechercher une instance (nom, code)..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>

        <div className={`d-flex align-items-center justify-content-between ${isOpen ? "mb-3" : ""}`}>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
            Filtres
          </button>

          {hasActiveFilters && (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={resetAll}>
              Réinitialiser
            </button>
          )}
        </div>

        {isOpen && (
          <div id={panelId} className="row g-3">
          <div className="col-12 col-sm-6 col-lg-3">
            <label htmlFor="filter-country" className="form-label">
              Pays
            </label>
            <SearchableSelect
              id="filter-country"
              value={filters.countryId}
              onChange={(value) => update("countryId", value)}
              emptyOptionLabel="Tous"
              options={countries.map((country) => ({ value: String(country.id), label: country.name }))}
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label htmlFor="filter-service" className="form-label">
              Service
            </label>
            <SearchableSelect
              id="filter-service"
              value={filters.serviceId}
              onChange={(value) => update("serviceId", value)}
              emptyOptionLabel="Tous"
              options={services.map((service) => ({ value: String(service.id), label: service.name }))}
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label htmlFor="filter-service-type" className="form-label">
              Type de service
            </label>
            <SearchableSelect
              id="filter-service-type"
              value={filters.serviceTypeId}
              onChange={(value) => update("serviceTypeId", value)}
              emptyOptionLabel="Tous"
              options={serviceTypes.map((serviceType) => ({ value: String(serviceType.id), label: serviceType.name }))}
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label htmlFor="filter-environment" className="form-label">
              Environnement
            </label>
            <SearchableSelect
              id="filter-environment"
              value={filters.environmentId}
              onChange={(value) => update("environmentId", value)}
              emptyOptionLabel="Tous"
              options={environments.map((environment) => ({ value: String(environment.id), label: environment.name }))}
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label htmlFor="filter-status" className="form-label">
              Statut
            </label>
            <SearchableSelect
              id="filter-status"
              value={filters.statutInstanceId}
              onChange={(value) => update("statutInstanceId", value)}
              emptyOptionLabel="Tous"
              options={statutInstances.map((statutInstance) => ({
                value: String(statutInstance.id),
                label: statutInstance.name,
              }))}
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label htmlFor="filter-pod" className="form-label">
              Pod
            </label>
            <SearchableSelect
              id="filter-pod"
              value={filters.podId}
              onChange={(value) => update("podId", value)}
              emptyOptionLabel="Tous"
              options={pods.map((pod) => ({ value: String(pod.id), label: pod.name }))}
            />
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
