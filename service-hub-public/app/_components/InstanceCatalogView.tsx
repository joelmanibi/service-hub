"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PublicInstance, PublicService } from "@/lib/publicApi";
import { API_ORIGIN } from "@/lib/publicApi";
import InstanceCard from "./InstanceCard";
import Pagination from "./Pagination";
import FilterSection, { type FilterOption } from "./FilterSection";

type InstanceCatalogViewProps = {
  service: PublicService;
  instances: PublicInstance[];
  loadError: boolean;
};

const UNKNOWN_LABEL = "Non renseigné";
const PAGE_SIZE = 12;

function countBy(instances: PublicInstance[], getLabel: (instance: PublicInstance) => string): FilterOption[] {
  const counts = new Map<string, number>();

  for (const instance of instances) {
    const label = getLabel(instance);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function toggle(current: string[], label: string): string[] {
  return current.includes(label) ? current.filter((item) => item !== label) : [...current, label];
}

/**
 * Page détail d'un service : même structure à deux blocs que la page
 * d'accueil (colonne latérale marque + filtres, contenu principal titre
 * + grille), appliquée cette fois aux instances du service (résumé
 * anonymisé — cf. lib/publicApi.ts). Filtres par statut, pays et site
 * d'hébergement + recherche par nom, entièrement en mémoire côté client
 * comme sur la page d'accueil.
 */
export default function InstanceCatalogView({ service, instances, loadError }: InstanceCatalogViewProps) {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedHostings, setSelectedHostings] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const statusOptions = useMemo(
    () => countBy(instances, (instance) => instance.statutInstance?.name ?? UNKNOWN_LABEL),
    [instances]
  );
  const countryOptions = useMemo(
    () => countBy(instances, (instance) => instance.country?.name ?? UNKNOWN_LABEL),
    [instances]
  );
  const hostingOptions = useMemo(() => {
    // Une instance peut avoir plusieurs hébergements : compte chaque nom
    // séparément (contrairement à `countBy`, qui suppose un seul libellé
    // par instance — adapté au statut et au pays, pas ici).
    const counts = new Map<string, number>();

    for (const instance of instances) {
      const labels = instance.hostings.length > 0 ? instance.hostings.map((hosting) => hosting.name) : [UNKNOWN_LABEL];
      for (const label of labels) {
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [instances]);

  const resetFilters = () => {
    setSearch("");
    setSelectedStatuses([]);
    setSelectedCountries([]);
    setSelectedHostings([]);
    setPage(1);
  };

  const filteredInstances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return instances.filter((instance) => {
      const statusLabel = instance.statutInstance?.name ?? UNKNOWN_LABEL;
      const countryLabel = instance.country?.name ?? UNKNOWN_LABEL;
      const hostingLabels = instance.hostings.length > 0 ? instance.hostings.map((h) => h.name) : [UNKNOWN_LABEL];

      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(statusLabel);
      const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(countryLabel);
      const matchesHosting =
        selectedHostings.length === 0 || hostingLabels.some((label) => selectedHostings.includes(label));
      const matchesSearch = query.length === 0 || instance.name.toLowerCase().includes(query);

      return matchesStatus && matchesCountry && matchesHosting && matchesSearch;
    });
  }, [instances, search, selectedStatuses, selectedCountries, selectedHostings]);

  const hasActiveFilters =
    search !== "" || selectedStatuses.length > 0 || selectedCountries.length > 0 || selectedHostings.length > 0;
  const totalPages = Math.max(1, Math.ceil(filteredInstances.length / PAGE_SIZE));
  const paginatedInstances = filteredInstances.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const logoSrc = service.logoUrl ? `${API_ORIGIN}${service.logoUrl}` : null;

  return (
    <div className="container-fluid">
      <div className="row min-vh-100">
        <aside
          className="col-12 col-lg-3 col-xl-2 bg-white border-end py-4 sticky-top"
          style={{ top: 0, maxHeight: "100vh", overflowY: "auto" }}
        >
          <Link href="/" className="d-flex align-items-center gap-2 mb-4 text-decoration-none text-reset">
            <Image src="/orange-logo.svg" alt="Orange" width={36} height={36} />
            <span className="fw-bold fs-5">ServiceHub</span>
          </Link>

          <div className="d-flex align-items-center justify-content-between mb-2">
            <label htmlFor="instance-search" className="form-label small fw-semibold mb-0">
              Rechercher
            </label>
            {hasActiveFilters && (
              <button type="button" className="btn btn-link btn-sm p-0" onClick={resetFilters}>
                Réinitialiser
              </button>
            )}
          </div>
          <div className="input-group mb-4">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search" aria-hidden="true" />
            </span>
            <input
              id="instance-search"
              type="search"
              className="form-control border-start-0"
              placeholder="Nom de l'instance..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <FilterSection
            title="Statut"
            idPrefix="instance-status"
            options={statusOptions}
            selected={selectedStatuses}
            onToggle={(label) => {
              setSelectedStatuses((current) => toggle(current, label));
              setPage(1);
            }}
          />

          <FilterSection
            title="Pays"
            idPrefix="instance-country"
            options={countryOptions}
            selected={selectedCountries}
            onToggle={(label) => {
              setSelectedCountries((current) => toggle(current, label));
              setPage(1);
            }}
          />

          <FilterSection
            title="Site d'hébergement"
            idPrefix="instance-hosting"
            options={hostingOptions}
            selected={selectedHostings}
            onToggle={(label) => {
              setSelectedHostings((current) => toggle(current, label));
              setPage(1);
            }}
          />
        </aside>

        <main className="col-12 col-lg-9 col-xl-10 bg-body-tertiary py-5">
          <Link href="/" className="d-inline-flex align-items-center gap-2 text-decoration-none small mb-4">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Retour au catalogue
          </Link>

          <div className="d-flex align-items-center gap-3 mb-2">
            {logoSrc && (
              // eslint-disable-next-line @next/next/no-img-element -- logo externe servi par le backend, hors domaines statiques connus de next/image
              <img
                src={logoSrc}
                alt=""
                className="rounded-3"
                style={{ width: "3rem", height: "3rem", objectFit: "contain" }}
              />
            )}
            <div>
              <h1 className="fw-bold mb-1">{service.name}</h1>
              {service.serviceType && (
                <span className="badge rounded-pill text-bg-secondary">{service.serviceType.name}</span>
              )}
            </div>
          </div>

          {service.description && (
            <p className="text-body-secondary mb-5" style={{ maxWidth: "40rem" }}>
              {service.description}
            </p>
          )}

          <h2 className="h5 fw-bold mb-4">Instances</h2>

          {loadError ? (
            <div className="alert alert-danger" role="alert">
              La liste des instances est momentanément indisponible. Merci de réessayer plus tard.
            </div>
          ) : instances.length === 0 ? (
            <p className="text-body-secondary small">Aucune instance disponible pour ce service.</p>
          ) : filteredInstances.length === 0 ? (
            <p className="text-body-secondary small">Aucune instance ne correspond à ces filtres.</p>
          ) : (
            <>
              <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
                {paginatedInstances.map((instance) => (
                  <div className="col" key={instance.id}>
                    <InstanceCard instance={instance} />
                  </div>
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
