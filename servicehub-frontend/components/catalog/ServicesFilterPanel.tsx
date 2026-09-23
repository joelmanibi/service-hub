"use client";

import { useState } from "react";
import type { ManagedClient } from "@/components/clients/clientTypes";
import type { Hosting } from "@/services/hostings.service";
import SearchableSelect from "@/components/common/SearchableSelect";

export type ServiceFilters = {
  clientId: string;
  platformId: string;
  hostingId: string;
};

export const EMPTY_SERVICE_FILTERS: ServiceFilters = {
  clientId: "",
  platformId: "",
  hostingId: "",
};

type ServicesFilterPanelProps = {
  filters: ServiceFilters;
  onChange: (filters: ServiceFilters) => void;
  clients: ManagedClient[];
  hostings: Hosting[];
};

/**
 * Panneau de filtres avancés de la page Services, replié par défaut (même
 * convention que InstancesFilterPanel). Un Service n'a pas lui-même de
 * Client/Plateforme/Hébergement — ces filtres sélectionnent les services
 * ayant au moins une Instance rattachée au client/à la plateforme/à
 * l'hébergement choisi, résolus côté serveur (cf.
 * services/catalog.service.ts#ListCatalogServicesParams). Les plateformes
 * ne sont pas un référentiel à part : chaque Hosting embarque déjà ses
 * `platforms` (cf. hostings.service.ts) — la liste proposée ici est donc
 * l'union de toutes les plateformes de tous les hébergements, chaque
 * option précisant son hébergement pour lever l'ambiguïté entre deux
 * plateformes de même nom sur des hébergements différents.
 */
export default function ServicesFilterPanel({ filters, onChange, clients, hostings }: ServicesFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveFilters = Object.values(filters).some((value) => value !== "");
  const panelId = "services-filter-panel-body";

  const update = (key: keyof ServiceFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const platformOptions = hostings.flatMap((hosting) =>
    hosting.platforms.map((platform) => ({
      id: platform.id,
      label: `${platform.name} (${hosting.name})`,
    }))
  );

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-0">
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
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChange(EMPTY_SERVICE_FILTERS)}>
              Réinitialiser
            </button>
          )}
        </div>

        {isOpen && (
          <div id={panelId} className="row g-3 mt-1">
            <div className="col-12 col-sm-6 col-lg-4">
              <label htmlFor="filter-service-client" className="form-label">
                Client
              </label>
              <SearchableSelect
                id="filter-service-client"
                value={filters.clientId}
                onChange={(value) => update("clientId", value)}
                emptyOptionLabel="Tous"
                options={clients.map((client) => ({ value: String(client.id), label: client.name }))}
              />
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <label htmlFor="filter-service-platform" className="form-label">
                Plateforme
              </label>
              <SearchableSelect
                id="filter-service-platform"
                value={filters.platformId}
                onChange={(value) => update("platformId", value)}
                emptyOptionLabel="Toutes"
                options={platformOptions.map((platform) => ({ value: String(platform.id), label: platform.label }))}
              />
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <label htmlFor="filter-service-hosting" className="form-label">
                Hébergement
              </label>
              <SearchableSelect
                id="filter-service-hosting"
                value={filters.hostingId}
                onChange={(value) => update("hostingId", value)}
                emptyOptionLabel="Tous"
                options={hostings.map((hosting) => ({ value: String(hosting.id), label: hosting.name }))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
