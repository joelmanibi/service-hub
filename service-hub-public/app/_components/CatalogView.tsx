"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicService } from "@/lib/publicApi";
import ServiceCard from "./ServiceCard";
import Pagination from "./Pagination";
import Header from "./Header";
import FiltersPanel from "./FiltersPanel";
import ActiveFilters, { type ActiveFilterChip } from "./ActiveFilters";
import type { FilterOption } from "./FilterSection";
import styles from "./CatalogView.module.scss";

type CatalogViewProps = {
  services: PublicService[];
  loadError: boolean;
};

const UNCATEGORIZED_LABEL = "Non catégorisé";
const PAGE_SIZE = 8;

function countBy(services: PublicService[], getLabels: (service: PublicService) => string[]): FilterOption[] {
  const counts = new Map<string, number>();

  for (const service of services) {
    for (const label of getLabels(service)) {
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

/**
 * Page catalogue complète : header simple (marque + nav), sidebar de
 * filtres (rail fixe desktop, tiroir sur mobile/tablette) et contenu
 * principal (titre, recherche, puces de filtres actifs, grille de
 * services). Toute la logique de filtrage/recherche/pagination reste
 * inchangée par rapport à la version précédente — seule la disposition
 * visuelle change. Le catalogue public reste de taille modeste : toute
 * la liste est chargée une fois côté serveur (page.tsx) puis filtrée
 * ici en mémoire, pour un filtrage instantané sans aller-retour réseau
 * supplémentaire. Filtres par type de service, client, plateforme et
 * hébergement (ces trois derniers dérivés des Instances de chaque
 * service — cf. lib/publicApi.ts#PublicService — un service peut donc
 * apparaître dans plusieurs options d'un même filtre).
 */
export default function CatalogView({ services, loadError }: CatalogViewProps) {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedHostings, setSelectedHostings] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  // État purement visuel (tiroir de filtres sur mobile/tablette) — ne
  // touche à aucune donnée ni logique métier.
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fermeture au clavier (Échap) — comportement standard attendu d'un
  // dialogue modal (role="dialog" aria-modal="true" sur le tiroir).
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

  const serviceTypes = useMemo(
    () => countBy(services, (service) => [service.serviceType?.name ?? UNCATEGORIZED_LABEL]),
    [services]
  );
  const clientOptions = useMemo(
    () => countBy(services, (service) => service.clients.map((client) => client.name)),
    [services]
  );
  const platformOptions = useMemo(
    () => countBy(services, (service) => service.platforms.map((platform) => platform.name)),
    [services]
  );
  const hostingOptions = useMemo(
    () => countBy(services, (service) => service.hostings.map((hosting) => hosting.name)),
    [services]
  );

  const toggleType = (label: string) => {
    setSelectedTypes((current) => toggle(current, label));
    setPage(1);
  };

  const toggleClient = (label: string) => {
    setSelectedClients((current) => toggle(current, label));
    setPage(1);
  };

  const togglePlatform = (label: string) => {
    setSelectedPlatforms((current) => toggle(current, label));
    setPage(1);
  };

  const toggleHosting = (label: string) => {
    setSelectedHostings((current) => toggle(current, label));
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedTypes([]);
    setSelectedClients([]);
    setSelectedPlatforms([]);
    setSelectedHostings([]);
    setPage(1);
  };

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      const typeLabel = service.serviceType?.name ?? UNCATEGORIZED_LABEL;
      const clientLabels = service.clients.map((client) => client.name);
      const platformLabels = service.platforms.map((platform) => platform.name);
      const hostingLabels = service.hostings.map((hosting) => hosting.name);

      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(typeLabel);
      const matchesClient =
        selectedClients.length === 0 || clientLabels.some((label) => selectedClients.includes(label));
      const matchesPlatform =
        selectedPlatforms.length === 0 || platformLabels.some((label) => selectedPlatforms.includes(label));
      const matchesHosting =
        selectedHostings.length === 0 || hostingLabels.some((label) => selectedHostings.includes(label));
      const matchesSearch =
        query.length === 0 ||
        service.name.toLowerCase().includes(query) ||
        (service.description ?? "").toLowerCase().includes(query);

      return matchesType && matchesClient && matchesPlatform && matchesHosting && matchesSearch;
    });
  }, [services, search, selectedTypes, selectedClients, selectedPlatforms, selectedHostings]);

  const hasActiveFilters =
    search !== "" ||
    selectedTypes.length > 0 ||
    selectedClients.length > 0 ||
    selectedPlatforms.length > 0 ||
    selectedHostings.length > 0;
  const activeFilterCount =
    selectedTypes.length + selectedClients.length + selectedPlatforms.length + selectedHostings.length;
  const totalPages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
  const paginatedServices = filteredServices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Puces de filtres actifs affichées dans le contenu principal : chaque
  // suppression rappelle exactement le même handler de bascule que la
  // case à cocher correspondante dans la sidebar (aucune nouvelle
  // logique, juste un raccourci visuel vers l'état existant).
  const activeFilterChips: ActiveFilterChip[] = [
    ...selectedTypes.map((label) => ({ key: `type-${label}`, label, onRemove: () => toggleType(label) })),
    ...selectedClients.map((label) => ({ key: `client-${label}`, label, onRemove: () => toggleClient(label) })),
    ...selectedPlatforms.map((label) => ({ key: `platform-${label}`, label, onRemove: () => togglePlatform(label) })),
    ...selectedHostings.map((label) => ({ key: `hosting-${label}`, label, onRemove: () => toggleHosting(label) })),
  ];

  const filtersPanelProps = {
    hasActiveFilters,
    onReset: resetFilters,
    serviceTypes,
    selectedTypes,
    onToggleType: toggleType,
    clientOptions,
    selectedClients,
    onToggleClient: toggleClient,
    platformOptions,
    selectedPlatforms,
    onTogglePlatform: togglePlatform,
    hostingOptions,
    selectedHostings,
    onToggleHosting: toggleHosting,
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <div className="d-flex flex-column flex-lg-row flex-fill">
        <aside
          className={`d-none d-lg-block bg-white border-end py-4 px-3 sticky-top ${styles.sidebar}`}
          style={{ top: 0, maxHeight: "100vh", overflowY: "auto" }}
        >
          <FiltersPanel idScope="desktop" {...filtersPanelProps} />
        </aside>

        <main className={`bg-body-tertiary py-4 px-3 px-lg-5 ${styles.main}`}>
          <div className="mb-4" style={{ maxWidth: "40rem" }}>
            <h1 className={`fw-semibold mb-2 ${styles.pageTitle}`}>Catalogue des services</h1>
            <p className="text-body-secondary mb-0">
              Découvrez l&apos;ensemble des services proposés par ServiceHub.
            </p>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
            <div className={`input-group input-group-lg flex-grow-1 position-relative ${styles.searchGroup}`}>
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search" aria-hidden="true" />
              </span>
              <input
                id="catalog-search"
                type="search"
                className={`form-control border-start-0 ${styles.searchInput}`}
                placeholder="Rechercher un service, une application, un code ou une description..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                aria-label="Rechercher un service"
              />
              {/* Indication purement visuelle — aucun raccourci clavier réel
                  n'est câblé (le projet n'en avait pas). */}
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
            {services.length} service{services.length > 1 ? "s" : ""} disponible{services.length > 1 ? "s" : ""} ·{" "}
            {filteredServices.length} affiché{filteredServices.length > 1 ? "s" : ""}
          </p>

          <ActiveFilters chips={activeFilterChips} />

          {loadError ? (
            <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" />
              Le catalogue de services est momentanément indisponible. Merci de réessayer plus tard.
            </div>
          ) : services.length === 0 ? (
            <p className="text-body-secondary small">Aucun service disponible pour le moment.</p>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-search text-body-secondary fs-2" aria-hidden="true" />
              <p className="fw-semibold mb-1 mt-3">Aucun service trouvé</p>
              <p className="text-body-secondary small mb-3">Modifiez votre recherche ou réinitialisez les filtres.</p>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={resetFilters}>
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className={styles.cardsGrid}>
                {paginatedServices.map((service) => (
                  <ServiceCard service={service} key={service.id} />
                ))}
              </div>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </main>
      </div>

      {isFiltersOpen && (
        <>
          <button
            type="button"
            className={`btn p-0 border-0 ${styles.drawerBackdrop}`}
            aria-label="Fermer les filtres"
            onClick={() => setIsFiltersOpen(false)}
          />
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

            <FiltersPanel idScope="mobile" {...filtersPanelProps} />

            <button type="button" className="btn btn-primary w-100 mt-3" onClick={() => setIsFiltersOpen(false)}>
              Voir les résultats
            </button>
          </div>
        </>
      )}
    </div>
  );
}
