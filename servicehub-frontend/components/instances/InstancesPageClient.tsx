"use client";

import { useEffect, useState } from "react";
import InstancesHeader from "./InstancesHeader";
import InstancesTable from "./InstancesTable";
import InstancesGrid from "./InstancesGrid";
import InstanceFormModal, { type InstanceFormValues } from "./InstanceFormModal";
import InstanceDetailModal from "./InstanceDetailModal";
import ConfirmDeleteInstanceModal from "./ConfirmDeleteInstanceModal";
import BulkInstanceImportModal from "./BulkInstanceImportModal";
import BulkDeleteInstancesModal from "./BulkDeleteInstancesModal";
import InstancesFilterPanel, { EMPTY_INSTANCE_FILTERS, type InstanceFilters } from "./InstancesFilterPanel";
import Pagination from "@/components/common/Pagination";
import ViewToggle, { type ViewMode } from "@/components/common/ViewToggle";
import {
  listInstances,
  createInstance,
  updateInstance,
  deleteInstance,
  type ManagedInstance,
} from "@/services/instances.service";
import { listClients } from "@/services/clients.service";
import type { ManagedClient } from "@/components/clients/clientTypes";
import { listCountries, type Country } from "@/services/countries.service";
import { listCatalogServices, type CatalogService } from "@/services/catalog.service";
import { listServiceTypes, type ServiceType } from "@/services/serviceTypes.service";
import { listStatutInstances, type StatutInstance } from "@/services/statutInstances.service";
import { listEnvironments, type Environment } from "@/services/environments.service";
import { listHostings, type Hosting } from "@/services/hostings.service";
import { listNetworks, type Network } from "@/services/networks.service";
import { listPods, type Pod } from "@/services/pods.service";
import { listSupportLevels, type SupportLevel } from "@/services/supportLevels.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState =
  | { type: "create" }
  | { type: "view"; instance: ManagedInstance }
  | { type: "edit"; instance: ManagedInstance }
  | { type: "delete"; instance: ManagedInstance }
  | { type: "bulk-import" }
  | { type: "bulk-delete"; instances: ManagedInstance[] };

/**
 * Orchestrateur client de la page Catalogue (instances) : charge la
 * liste des instances (paginée côté serveur) ainsi que tous les
 * référentiels nécessaires au formulaire (clients, pods, services, statuts,
 * environnements, hébergements, niveaux de support — chargés en une seule
 * fois, non paginés, pour peupler les select) au montage, et détient
 * l'état de la modale
 * ouverte. Toute action qui modifie la liste recharge la page courante
 * plutôt que de patcher le tableau localement. Les 3 actions (créer,
 * modifier, supprimer) appellent l'API réelle (services/instances.service.ts) ;
 * chaque modale reste ouverte et affiche l'erreur si l'appel échoue, ne
 * se ferme qu'en cas de succès.
 */
export default function InstancesPageClient() {
  const [instances, setInstances] = useState<ManagedInstance[]>([]);
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [statutInstances, setStatutInstances] = useState<StatutInstance[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [hostings, setHostings] = useState<Hosting[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [pods, setPods] = useState<Pod[]>([]);
  const [supportLevels, setSupportLevels] = useState<SupportLevel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<InstanceFilters>(EMPTY_INSTANCE_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
      const [
        instancesResult,
        clientsResult,
        countriesResult,
        servicesResult,
        serviceTypesResult,
        statutInstancesResult,
        environmentsResult,
        hostingsResult,
        networksResult,
        podsResult,
        supportLevelsResult,
      ] = await Promise.all([
        listInstances({
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          countryId: filters.countryId ? Number(filters.countryId) : undefined,
          serviceId: filters.serviceId ? Number(filters.serviceId) : undefined,
          serviceTypeId: filters.serviceTypeId ? Number(filters.serviceTypeId) : undefined,
          environmentId: filters.environmentId ? Number(filters.environmentId) : undefined,
          statutInstanceId: filters.statutInstanceId ? Number(filters.statutInstanceId) : undefined,
          podId: filters.podId ? Number(filters.podId) : undefined,
        }),
        listClients({ limit: 100 }),
        listCountries({ limit: 100 }),
        // `limit: 500` : le nombre de Services a dépassé 100 (une centaine
        // en usage réel) — cf. modules/catalog/validator.js#listServicesQuerySchema,
        // le select de service du formulaire d'instance doit tous les lister.
        listCatalogServices({ limit: 500 }),
        listServiceTypes({ limit: 100 }),
        listStatutInstances(),
        listEnvironments(),
        listHostings({ limit: 100 }),
        listNetworks({ limit: 100 }),
        listPods({ limit: 100 }),
        listSupportLevels({ limit: 100 }),
      ]);
      setInstances(instancesResult.items);
      setTotalPages(instancesResult.totalPages);
      setClients(clientsResult.items);
      setCountries(countriesResult.items);
      setServices(servicesResult.items);
      setServiceTypes(serviceTypesResult.items);
      setStatutInstances(statutInstancesResult);
      setEnvironments(environmentsResult);
      setHostings(hostingsResult.items);
      setNetworks(networksResult.items);
      setPods(podsResult.items);
      setSupportLevels(supportLevelsResult.items);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des instances."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, search]);

  const handleFiltersChange = (nextFilters: InstanceFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
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
      const allSelected = instances.length > 0 && instances.every((instance) => current.has(instance.id));
      if (allSelected) {
        return new Set();
      }
      return new Set(instances.map((instance) => instance.id));
    });
  };

  const selectedInstances = instances.filter((instance) => selectedIds.has(instance.id));

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  };

  const closeModal = () => setModal(null);

  const buildPayload = (values: InstanceFormValues) => ({
    name: values.name,
    clientId: Number(values.clientId),
    podId: Number(values.podId),
    serviceId: Number(values.serviceId),
    statutInstanceId: Number(values.statutInstanceId),
    comments: values.comments || undefined,
    produitOceane: values.produitOceane || undefined,
    environmentIds: (values.environmentIds ?? []).map(Number),
    hostingIds: (values.hostingIds ?? []).map(Number),
    networkIds: (values.networkIds ?? []).map(Number),
    composants: (values.composants ?? []).map((composant) => ({
      name: composant.name,
      description: composant.description || undefined,
      platformId: composant.platformId ? Number(composant.platformId) : null,
      inventaires: (composant.inventaires ?? []).map((inventaire) => ({
        ip: inventaire.ip,
        nomServeur: inventaire.nomServeur,
      })),
    })),
    supportLevels: (values.supportLevels ?? []).map((supportLevel) => ({
      supportLevelId: Number(supportLevel.supportLevelId),
      responsable: supportLevel.responsable || undefined,
      telephone: supportLevel.telephone || undefined,
    })),
  });

  const handleCreate = async (values: InstanceFormValues) => {
    const created = await createInstance(buildPayload(values));
    closeModal();
    showNotice(`Instance ${created.name} créée.`);
    await loadData();
  };

  const handleEdit = async (values: InstanceFormValues, instance: ManagedInstance) => {
    const updated = await updateInstance(instance.id, buildPayload(values));
    closeModal();
    showNotice(`Instance ${updated.name} mise à jour.`);
    await loadData();
  };

  const handleDelete = async (instance: ManagedInstance) => {
    await deleteInstance(instance.id);
    closeModal();
    showNotice(`Instance ${instance.name} supprimée.`);
    await loadData();
  };

  return (
    <div className="container-fluid">
      <InstancesHeader
        onCreate={() => setModal({ type: "create" })}
        onBulkImport={() => setModal({ type: "bulk-import" })}
      />

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

      <InstancesFilterPanel
        search={search}
        onSearchChange={handleSearchChange}
        isSearching={isLoading && instances.length > 0}
        filters={filters}
        onChange={handleFiltersChange}
        countries={countries}
        services={services}
        serviceTypes={serviceTypes}
        environments={environments}
        statutInstances={statutInstances}
        pods={pods}
      />

      {selectedIds.size > 0 && (
        <div className="d-flex align-items-center justify-content-between gap-2 mb-3 p-2 ps-3 border rounded bg-body-tertiary">
          <span className="small fw-semibold">
            {selectedIds.size} instance{selectedIds.size > 1 ? "s" : ""} sélectionnée
            {selectedIds.size > 1 ? "s" : ""}
          </span>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedIds(new Set())}>
              Désélectionner
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => setModal({ type: "bulk-delete", instances: selectedInstances })}
            >
              <i className="bi bi-trash me-2" aria-hidden="true" />
              Supprimer la sélection
            </button>
          </div>
        </div>
      )}

      {isLoading && instances.length === 0 ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-end mb-3">
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>

          {viewMode === "list" ? (
            <InstancesTable
              instances={instances}
              services={services}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onView={(instance) => setModal({ type: "view", instance })}
              onEdit={(instance) => setModal({ type: "edit", instance })}
              onDelete={(instance) => setModal({ type: "delete", instance })}
            />
          ) : (
            <InstancesGrid
              instances={instances}
              services={services}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onView={(instance) => setModal({ type: "view", instance })}
              onEdit={(instance) => setModal({ type: "edit", instance })}
              onDelete={(instance) => setModal({ type: "delete", instance })}
            />
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "view" && (
        <InstanceDetailModal instance={modal.instance} services={services} onClose={closeModal} />
      )}

      {modal?.type === "create" && (
        <InstanceFormModal
          mode="create"
          clients={clients}
          services={services}
          statutInstances={statutInstances}
          environments={environments}
          hostings={hostings}
          networks={networks}
          pods={pods}
          supportLevels={supportLevels}
          onClose={closeModal}
          onSubmit={handleCreate}
        />
      )}

      {modal?.type === "edit" && (
        <InstanceFormModal
          mode="edit"
          instance={modal.instance}
          clients={clients}
          services={services}
          statutInstances={statutInstances}
          environments={environments}
          hostings={hostings}
          networks={networks}
          pods={pods}
          supportLevels={supportLevels}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.instance)}
          onArchitectureImageChange={loadData}
        />
      )}

      {modal?.type === "bulk-import" && (
        <BulkInstanceImportModal
          clients={clients}
          services={services}
          statutInstances={statutInstances}
          environments={environments}
          hostings={hostings}
          pods={pods}
          onClose={closeModal}
          onDone={async (createdCount) => {
            closeModal();
            if (createdCount > 0) {
              showNotice(`${createdCount} instance${createdCount > 1 ? "s" : ""} créée${createdCount > 1 ? "s" : ""}.`);
              await loadData();
            }
          }}
        />
      )}

      {modal?.type === "bulk-delete" && (
        <BulkDeleteInstancesModal
          instances={modal.instances}
          onClose={closeModal}
          onDone={async (deletedCount) => {
            closeModal();
            setSelectedIds(new Set());
            if (deletedCount > 0) {
              showNotice(`${deletedCount} instance${deletedCount > 1 ? "s" : ""} supprimée${deletedCount > 1 ? "s" : ""}.`);
              await loadData();
            }
          }}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeleteInstanceModal
          instance={modal.instance}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.instance)}
        />
      )}
    </div>
  );
}
