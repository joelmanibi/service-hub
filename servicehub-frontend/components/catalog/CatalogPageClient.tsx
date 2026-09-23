"use client";

import { useEffect, useState } from "react";
import CatalogHeader from "./CatalogHeader";
import ServicesTable from "./ServicesTable";
import ServiceFormModal, { type ServiceFormValues } from "./ServiceFormModal";
import ConfirmDeleteServiceModal from "./ConfirmDeleteServiceModal";
import BulkServiceImportModal from "./BulkServiceImportModal";
import BulkDeleteServicesModal from "./BulkDeleteServicesModal";
import ServicesFilterPanel, { EMPTY_SERVICE_FILTERS, type ServiceFilters } from "./ServicesFilterPanel";
import GlobalSearch from "@/components/layout/GlobalSearch";
import Pagination from "@/components/common/Pagination";
import {
  listCatalogServices,
  createCatalogService,
  updateCatalogService,
  deleteCatalogService,
  type CatalogService,
} from "@/services/catalog.service";
import { listServiceTypes, type ServiceType } from "@/services/serviceTypes.service";
import { listCloudServiceModels, type CloudServiceModel } from "@/services/cloudServiceModels.service";
import { listClients } from "@/services/clients.service";
import type { ManagedClient } from "@/components/clients/clientTypes";
import { listHostings, type Hosting } from "@/services/hostings.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState =
  | { type: "create" }
  | { type: "edit"; service: CatalogService }
  | { type: "delete"; service: CatalogService }
  | { type: "bulk-import" }
  | { type: "bulk-delete"; services: CatalogService[] };

/**
 * Orchestrateur client de la page Services : charge la liste des
 * services (paginée côté serveur) ainsi que les référentiels nécessaires
 * au formulaire et aux filtres (types de service, modèles de service
 * cloud, clients, hébergements) au montage, et détient l'état de la
 * modale ouverte. Les filtres avancés (client, plateforme, hébergement —
 * cf. ServicesFilterPanel) sont résolus côté serveur : un Service n'a pas
 * lui-même ces attributs, mais "a" un Client/une Plateforme/un
 * Hébergement dès qu'au moins une de ses Instances y est rattachée.
 * Toute action qui modifie la liste recharge la page courante plutôt que
 * de patcher le tableau localement. Les actions (créer, modifier,
 * supprimer, importer/supprimer en masse) appellent l'API réelle
 * (services/catalog.service.ts) ; chaque modale reste ouverte et affiche
 * l'erreur si l'appel échoue, ne se ferme qu'en cas de succès. La
 * sélection multiple (`selectedIds`) porte sur les services de la page
 * courante uniquement — réinitialisée à chaque rechargement (page,
 * recherche, filtres, ou après une action) pour éviter de référencer des
 * lignes qui ne sont plus visibles.
 */
export default function CatalogPageClient() {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [cloudServiceModels, setCloudServiceModels] = useState<CloudServiceModel[]>([]);
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [hostings, setHostings] = useState<Hosting[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ServiceFilters>(EMPTY_SERVICE_FILTERS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    setSelectedIds(new Set());

    try {
      const [servicesResult, serviceTypesResult, cloudServiceModelsResult, clientsResult, hostingsResult] = await Promise.all([
        listCatalogServices({
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          clientId: filters.clientId ? Number(filters.clientId) : undefined,
          platformId: filters.platformId ? Number(filters.platformId) : undefined,
          hostingId: filters.hostingId ? Number(filters.hostingId) : undefined,
        }),
        listServiceTypes({ limit: 100 }),
        listCloudServiceModels({ limit: 100 }),
        listClients({ limit: 100 }),
        listHostings({ limit: 100 }),
      ]);
      setServices(servicesResult.items);
      setTotalPages(servicesResult.totalPages);
      setServiceTypes(serviceTypesResult.items);
      setCloudServiceModels(cloudServiceModelsResult.items);
      setClients(clientsResult.items);
      setHostings(hostingsResult.items);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des services."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filters]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFiltersChange = (nextFilters: ServiceFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      const allSelected = services.length > 0 && services.every((service) => current.has(service.id));
      if (allSelected) {
        return new Set();
      }
      return new Set(services.map((service) => service.id));
    });
  };

  const selectedServices = services.filter((service) => selectedIds.has(service.id));

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  };

  const closeModal = () => setModal(null);

  const handleCreate = async (values: ServiceFormValues, logo: File | null) => {
    const created = await createCatalogService({
      name: values.name,
      serviceTypeId: Number(values.serviceTypeId),
      description: values.description || undefined,
      cloudServiceModelIds: (values.cloudServiceModelIds ?? []).map(Number),
      logo: logo ?? undefined,
    });

    closeModal();
    showNotice(`Service ${created.name} créé.`);
    await loadData();
  };

  const handleEdit = async (values: ServiceFormValues, service: CatalogService, logo: File | null) => {
    const updated = await updateCatalogService(service.id, {
      name: values.name,
      serviceTypeId: Number(values.serviceTypeId),
      description: values.description || undefined,
      cloudServiceModelIds: (values.cloudServiceModelIds ?? []).map(Number),
      logo: logo ?? undefined,
    });

    closeModal();
    showNotice(`Service ${updated.name} mis à jour.`);
    await loadData();
  };

  const handleDelete = async (service: CatalogService) => {
    await deleteCatalogService(service.id);
    closeModal();
    showNotice(`Service ${service.name} supprimé.`);
    await loadData();
  };

  return (
    <div className="container-fluid">
      <CatalogHeader
        onCreate={() => setModal({ type: "create" })}
        onBulkImport={() => setModal({ type: "bulk-import" })}
      />

      <GlobalSearch
        id="catalog-search"
        placeholder="Rechercher un service (nom, code, description)..."
        onSearch={handleSearchChange}
        className="mb-3"
      />

      <ServicesFilterPanel filters={filters} onChange={handleFiltersChange} clients={clients} hostings={hostings} />

      {notice && (
        <div className="alert alert-success alert-dismissible" role="status">
          {notice}
          <button type="button" className="btn-close" aria-label="Fermer" onClick={() => setNotice(null)} />
        </div>
      )}

      {loadError && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
          <span>{loadError}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={loadData}>
            Réessayer
          </button>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3 p-2 ps-3 border rounded bg-body-tertiary">
          <span className="small fw-semibold">
            {selectedIds.size} service{selectedIds.size > 1 ? "s" : ""} sélectionné{selectedIds.size > 1 ? "s" : ""}
          </span>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedIds(new Set())}>
              Désélectionner
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => setModal({ type: "bulk-delete", services: selectedServices })}
            >
              <i className="bi bi-trash me-2" aria-hidden="true" />
              Supprimer la sélection
            </button>
          </div>
        </div>
      )}

      {isLoading && services.length === 0 ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <>
          <ServicesTable
            services={services}
            serviceTypes={serviceTypes}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onEdit={(service) => setModal({ type: "edit", service })}
            onDelete={(service) => setModal({ type: "delete", service })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "create" && (
        <ServiceFormModal
          mode="create"
          serviceTypes={serviceTypes}
          cloudServiceModels={cloudServiceModels}
          onClose={closeModal}
          onSubmit={handleCreate}
        />
      )}

      {modal?.type === "edit" && (
        <ServiceFormModal
          mode="edit"
          service={modal.service}
          serviceTypes={serviceTypes}
          cloudServiceModels={cloudServiceModels}
          onClose={closeModal}
          onSubmit={(values, logo) => handleEdit(values, modal.service, logo)}
        />
      )}

      {modal?.type === "bulk-import" && (
        <BulkServiceImportModal
          serviceTypes={serviceTypes}
          cloudServiceModels={cloudServiceModels}
          onClose={closeModal}
          onDone={async (createdCount) => {
            closeModal();
            if (createdCount > 0) {
              showNotice(`${createdCount} service${createdCount > 1 ? "s" : ""} créé${createdCount > 1 ? "s" : ""}.`);
              await loadData();
            }
          }}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeleteServiceModal
          service={modal.service}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.service)}
        />
      )}

      {modal?.type === "bulk-delete" && (
        <BulkDeleteServicesModal
          services={modal.services}
          onClose={closeModal}
          onDone={async (deletedCount) => {
            closeModal();
            setSelectedIds(new Set());
            if (deletedCount > 0) {
              showNotice(`${deletedCount} service${deletedCount > 1 ? "s" : ""} supprimé${deletedCount > 1 ? "s" : ""}.`);
              await loadData();
            }
          }}
        />
      )}
    </div>
  );
}
