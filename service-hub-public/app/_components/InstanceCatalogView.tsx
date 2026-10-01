"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PublicInstance, PublicService } from "@/lib/publicApi";
import { API_ORIGIN } from "@/lib/publicApi";
import InstanceCard from "./InstanceCard";
import Pagination from "./Pagination";
import Header from "./Header";
import InstanceFiltersPanel from "./InstanceFiltersPanel";
import ActiveFilters, { type ActiveFilterChip } from "./ActiveFilters";
import type { FilterOption } from "./FilterSection";
import styles from "./CatalogView.module.scss";

type InstanceCatalogViewProps = {
  // Absent sur la page "Instances" (tous services confondus) : le titre
  // devient générique et un filtre Service apparaît.
  service?: PublicService;
  instances: PublicInstance[];
  loadError: boolean;
};

const UNKNOWN_LABEL = "Non renseigné";
const PAGE_SIZE = 8;

function countBy(instances: PublicInstance[], getLabels: (instance: PublicInstance) => string[]): FilterOption[] {
  const counts = new Map<string, number>();

  for (const instance of instances) {
    for (const label of getLabels(instance)) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function toggle(current: string[], label: string): string[] {
  return current.includes(label) ? current.filter((item) => item !== label) : [...current, label];
}

const serviceLabelOf = (instance: PublicInstance) => [instance.service?.name ?? UNKNOWN_LABEL];
const statusLabelOf =(instance: PublicInstance) => [instance.statutInstance?.name ?? UNKNOWN_LABEL];
const podLabelOf = (instance: PublicInstance) => [instance.pod?.name ?? UNKNOWN_LABEL];
const countryLabelOf = (instance: PublicInstance) => [instance.country?.name ?? UNKNOWN_LABEL];
// Une instance peut avoir plusieurs hébergements : chaque nom compte séparément.
const hostingLabelsOf = (instance: PublicInstance) =>
  instance.hostings.length > 0 ? instance.hostings.map((hosting) => hosting.name) : [UNKNOWN_LABEL];
// Idem pour les plateformes (une par composant, dédupliquées côté API).
const platformLabelsOf = (instance: PublicInstance) =>
  instance.platforms.length > 0 ? instance.platforms.map((platform) => platform.name) : [UNKNOWN_LABEL];

/**
 * Liste d'instances, avec la même disposition que la page catalogue
 * (CatalogView — header, sidebar de filtres fixe desktop / tiroir
 * mobile, contenu principal avec recherche, puces de filtres actifs et
 * grille). Sert à la fois la page d'un service (`service` fourni) et la
 * page "Instances" (toutes les instances, filtre Service en plus).
 * Filtres par statut, pod, pays et hébergement + recherche par nom
 * (et par service sur la page globale), entièrement en mémoire côté client.
 */
export default function InstanceCatalogView({ service, instances, loadError }: InstanceCatalogViewProps) {
  const isGlobal = !service;
  const [search, setSearch] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPods, setSelectedPods] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedHostings, setSelectedHostings] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    if (!isFiltersOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFiltersOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFiltersOpen]);

  const serviceOptions = useMemo(() => countBy(instances, serviceLabelOf), [instances]);
  const statusOptions = useMemo(() => countBy(instances, statusLabelOf), [instances]);
  const podOptions = useMemo(() => countBy(instances, podLabelOf), [instances]);
  const countryOptions = useMemo(() => countBy(instances, countryLabelOf), [instances]);
  const hostingOptions = useMemo(() => countBy(instances, hostingLabelsOf), [instances]);
  const platformOptions = useMemo(() => countBy(instances, platformLabelsOf), [instances]);

  const toggleService = (label: string) => {
    setSelectedServices((current) => toggle(current, label));
    setPage(1);
  };

  const toggleStatus = (label: string) => {
    setSelectedStatuses((current) => toggle(current, label));
    setPage(1);
  };

  const togglePod = (label: string) => {
    setSelectedPods((current) => toggle(current, label));
    setPage(1);
  };

  const toggleCountry = (label: string) => {
    setSelectedCountries((current) => toggle(current, label));
    setPage(1);
  };

  const toggleHosting = (label: string) => {
    setSelectedHostings((current) => toggle(current, label));
    setPage(1);
  };

  const togglePlatform = (label: string) => {
    setSelectedPlatforms((current) => toggle(current, label));
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedServices([]);
    setSelectedStatuses([]);
    setSelectedPods([]);
    setSelectedCountries([]);
    setSelectedHostings([]);
    setSelectedPlatforms([]);
    setPage(1);
  };

  const filteredInstances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return instances.filter((instance) => {
      const [serviceLabel] = serviceLabelOf(instance);
      const [statusLabel] = statusLabelOf(instance);
      const [podLabel] = podLabelOf(instance);
      const [countryLabel] = countryLabelOf(instance);
      const hostingLabels = hostingLabelsOf(instance);
      const platformLabels = platformLabelsOf(instance);

      const matchesService = selectedServices.length === 0 || selectedServices.includes(serviceLabel);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(statusLabel);
      const matchesPod = selectedPods.length === 0 || selectedPods.includes(podLabel);
      const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(countryLabel);
      const matchesHosting =
        selectedHostings.length === 0 || hostingLabels.some((label) => selectedHostings.includes(label));
      const matchesPlatform =
        selectedPlatforms.length === 0 || platformLabels.some((label) => selectedPlatforms.includes(label));
      const matchesSearch =
        query.length === 0 ||
        instance.name.toLowerCase().includes(query) ||
        (instance.service?.name ?? "").toLowerCase().includes(query);

      return (
        matchesService &&
        matchesStatus &&
        matchesPod &&
        matchesCountry &&
        matchesHosting &&
        matchesPlatform &&
        matchesSearch
      );
    });
  }, [
    instances,
    search,
    selectedServices,
    selectedStatuses,
    selectedPods,
    selectedCountries,
    selectedHostings,
    selectedPlatforms,
  ]);

  const hasActiveFilters =
    search !== "" ||
    selectedServices.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedPods.length > 0 ||
    selectedCountries.length > 0 ||
    selectedHostings.length > 0 ||
    selectedPlatforms.length > 0;
  const activeFilterCount =
    selectedServices.length +
    selectedStatuses.length +
    selectedPods.length +
    selectedCountries.length +
    selectedHostings.length +
    selectedPlatforms.length;
  const totalPages = Math.max(1, Math.ceil(filteredInstances.length / PAGE_SIZE));
  const paginatedInstances = filteredInstances.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const logoSrc = service?.logoUrl ? `${API_ORIGIN}${service.logoUrl}` : null;

  const activeFilterChips: ActiveFilterChip[] = [
    ...selectedServices.map((label) => ({ key: `service-${label}`, label, onRemove: () => toggleService(label) })),
    ...selectedStatuses.map((label) => ({ key: `status-${label}`, label, onRemove: () => toggleStatus(label) })),
    ...selectedPods.map((label) => ({ key: `pod-${label}`, label, onRemove: () => togglePod(label) })),
    ...selectedCountries.map((label) => ({ key: `country-${label}`, label, onRemove: () => toggleCountry(label) })),
    ...selectedHostings.map((label) => ({ key: `hosting-${label}`, label, onRemove: () => toggleHosting(label) })),
    ...selectedPlatforms.map((label) => ({ key: `platform-${label}`, label, onRemove: () => togglePlatform(label) })),
  ];

  const filtersPanelProps = {
    hasActiveFilters,
    onReset: resetFilters,
    ...(isGlobal && { serviceOptions, selectedServices, onToggleService: toggleService }),
    statusOptions,
    selectedStatuses,
    onToggleStatus: toggleStatus,
    countryOptions,
    selectedCountries,
    onToggleCountry: toggleCountry,
    hostingOptions,
    selectedHostings,
    onToggleHosting: toggleHosting,
    platformOptions,
    selectedPlatforms,
    onTogglePlatform: togglePlatform,
    podOptions,
    selectedPods,
    onTogglePod: togglePod,
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <div className="d-flex flex-column flex-lg-row flex-fill">
        <aside
          className={`d-none d-lg-block bg-white border-end py-4 px-3 sticky-top ${styles.sidebar}`}
          style={{ top: 0, maxHeight: "100vh", overflowY: "auto" }}
        >
          <InstanceFiltersPanel idScope="desktop" {...filtersPanelProps} />
        </aside>

        <main className={`bg-body-tertiary py-4 px-3 px-lg-5 ${styles.main}`}>
          {service ? (
            <>
              <Link href="/" className="d-inline-flex align-items-center gap-2 text-decoration-none small mb-3">
                <i className="bi bi-arrow-left" aria-hidden="true" />
                Retour au catalogue
              </Link>

              <div className="mb-4" style={{ maxWidth: "40rem" }}>
                <div className="d-flex align-items-center gap-3 mb-2">
                  {logoSrc && (
                    // eslint-disable-next-line @next/next/no-img-element -- logo externe servi par le backend, hors domaines statiques connus de next/image
                    <img
                      src={logoSrc}
                      alt=""
                      className="rounded-2"
                      style={{ width: "2.75rem", height: "2.75rem", objectFit: "contain", flexShrink: 0 }}
                    />
                  )}
                  <h1 className={`fw-semibold mb-0 ${styles.pageTitle}`}>{service.name}</h1>
                  {service.serviceType && (
                    <span className="badge rounded-pill bg-body-secondary text-body-secondary text-nowrap">
                      {service.serviceType.name}
                    </span>
                  )}
                </div>
                <p className="text-body-secondary mb-0">
                  {service.description || "Retrouvez l'ensemble des instances de ce service."}
                </p>
              </div>
            </>
          ) : (
            <div className="mb-4" style={{ maxWidth: "40rem" }}>
              <h1 className={`fw-semibold mb-2 ${styles.pageTitle}`}>Toutes les instances</h1>
              <p className="text-body-secondary mb-0">
                Parcourez l&apos;ensemble des instances, tous services confondus.
              </p>
            </div>
          )}

          <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
            <div className={`input-group input-group-lg flex-grow-1 position-relative ${styles.searchGroup}`}>
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search" aria-hidden="true" />
              </span>
              <input
                id="instance-search"
                type="search"
                className={`form-control border-start-0 ${styles.searchInput}`}
                placeholder={
                  isGlobal ? "Rechercher une instance ou un service..." : "Rechercher une instance par son nom..."
                }
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                aria-label="Rechercher une instance"
              />
              <kbd className={`text-body-secondary d-none d-md-inline-flex ${styles.shortcutHint}`} aria-hidden="true">
                Ctrl K
              </kbd>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary d-lg-none d-inline-flex align-items-center justify-content-center gap-2"
              onClick={() => setIsFiltersOpen(true)}
            >
              <i className="bi bi-gear" aria-hidden="true" />
              Filtres
              {activeFilterCount > 0 && <span className="badge text-bg-secondary rounded-pill">{activeFilterCount}</span>}
            </button>
          </div>

          <p className="text-body-secondary small mb-3">
            {instances.length} instance{instances.length > 1 ? "s" : ""} disponible{instances.length > 1 ? "s" : ""} ·{" "}
            {filteredInstances.length} affichée{filteredInstances.length > 1 ? "s" : ""}
          </p>

          <ActiveFilters chips={activeFilterChips} />

          {loadError ? (
            <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" />
              La liste des instances est momentanément indisponible. Merci de réessayer plus tard.
            </div>
          ) : instances.length === 0 ? (
            <p className="text-body-secondary small">
              {isGlobal ? "Aucune instance disponible pour le moment." : "Aucune instance disponible pour ce service."}
            </p>
          ) : filteredInstances.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-search text-body-secondary fs-2" aria-hidden="true" />
              <p className="fw-semibold mb-1 mt-3">Aucune instance trouvée</p>
              <p className="text-body-secondary small mb-3">Modifiez votre recherche ou réinitialisez les filtres.</p>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={resetFilters}>
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className={styles.cardsGrid}>
                {paginatedInstances.map((instance) => (
                  <InstanceCard instance={instance} showService={isGlobal} key={instance.id} />
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </main>
      </div>

      {isFiltersOpen && (
        <>
          <div className={styles.drawerBackdrop} aria-hidden="true" />
          <div className={`bg-white py-4 px-3 ${styles.drawerPanel}`} role="dialog" aria-modal="true" aria-label="Filtres">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="fw-bold">Filtres</span>
              <button
                type="button"
                className="btn btn-icon btn-sm"
                aria-label="Fermer les filtres"
                onClick={() => setIsFiltersOpen(false)}
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            <InstanceFiltersPanel idScope="mobile" {...filtersPanelProps} />

            <button type="button" className="btn btn-primary w-100 mt-3" onClick={() => setIsFiltersOpen(false)}>
              Voir les résultats
            </button>
          </div>
        </>
      )}
    </div>
  );
}
