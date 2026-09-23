"use client";

import { useEffect, useState } from "react";
import ServiceTypesTable from "./ServiceTypesTable";
import ServiceTypeFormModal, { type ServiceTypeFormValues } from "./ServiceTypeFormModal";
import ConfirmDeleteServiceTypeModal from "./ConfirmDeleteServiceTypeModal";
import Pagination from "@/components/common/Pagination";
import {
  listServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  type ServiceType,
} from "@/services/serviceTypes.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState =
  | { type: "create" }
  | { type: "edit"; serviceType: ServiceType }
  | { type: "delete"; serviceType: ServiceType };

/**
 * Panneau "Types de service" de l'onglet Paramètres : charge la liste
 * (paginée côté serveur) au montage et gère les 3 actions CRUD (créer,
 * modifier, supprimer) contre l'API réelle (services/serviceTypes.service.ts).
 * Toute action qui modifie la liste recharge la page courante plutôt que
 * de patcher le tableau localement. Même logique que
 * TypeClientsPanel/CountriesPanel.
 */
export default function ServiceTypesPanel() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await listServiceTypes({ page, limit: PAGE_SIZE });
      setServiceTypes(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des types de service."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  };

  const closeModal = () => setModal(null);

  const handleCreate = async (values: ServiceTypeFormValues) => {
    const created = await createServiceType({
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Type de service ${created.name} créé.`);
    await loadData();
  };

  const handleEdit = async (values: ServiceTypeFormValues, serviceType: ServiceType) => {
    const updated = await updateServiceType(serviceType.id, {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Type de service ${updated.name} mis à jour.`);
    await loadData();
  };

  const handleDelete = async (serviceType: ServiceType) => {
    await deleteServiceType(serviceType.id);
    closeModal();
    showNotice(`Type de service ${serviceType.name} supprimé.`);
    await loadData();
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <p className="text-body-secondary mb-0">Classification utilisée pour catégoriser les services du catalogue.</p>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Nouveau type
        </button>
      </div>

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

      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <>
          <ServiceTypesTable
            serviceTypes={serviceTypes}
            onEdit={(serviceType) => setModal({ type: "edit", serviceType })}
            onDelete={(serviceType) => setModal({ type: "delete", serviceType })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "create" && (
        <ServiceTypeFormModal mode="create" onClose={closeModal} onSubmit={handleCreate} />
      )}

      {modal?.type === "edit" && (
        <ServiceTypeFormModal
          mode="edit"
          serviceType={modal.serviceType}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.serviceType)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeleteServiceTypeModal
          serviceType={modal.serviceType}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.serviceType)}
        />
      )}
    </div>
  );
}
