"use client";

import { useEffect, useState } from "react";
import CloudServiceModelsTable from "./CloudServiceModelsTable";
import CloudServiceModelFormModal, {
  type CloudServiceModelFormValues,
} from "./CloudServiceModelFormModal";
import ConfirmDeleteCloudServiceModelModal from "./ConfirmDeleteCloudServiceModelModal";
import Pagination from "@/components/common/Pagination";
import {
  listCloudServiceModels,
  createCloudServiceModel,
  updateCloudServiceModel,
  deleteCloudServiceModel,
  type CloudServiceModel,
} from "@/services/cloudServiceModels.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState =
  | { type: "create" }
  | { type: "edit"; cloudServiceModel: CloudServiceModel }
  | { type: "delete"; cloudServiceModel: CloudServiceModel };

/**
 * Panneau "Modèles de service cloud" de l'onglet Paramètres : charge la
 * liste (paginée côté serveur) au montage et gère les 3 actions CRUD
 * (créer, modifier, supprimer) contre l'API réelle
 * (services/cloudServiceModels.service.ts). Toute action qui modifie la
 * liste recharge la page courante plutôt que de patcher le tableau
 * localement. Même logique que ServiceTypesPanel.
 */
export default function CloudServiceModelsPanel() {
  const [cloudServiceModels, setCloudServiceModels] = useState<CloudServiceModel[]>([]);
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
      const result = await listCloudServiceModels({ page, limit: PAGE_SIZE });
      setCloudServiceModels(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des modèles de service cloud."));
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

  const handleCreate = async (values: CloudServiceModelFormValues) => {
    const created = await createCloudServiceModel({
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Modèle de service cloud ${created.name} créé.`);
    await loadData();
  };

  const handleEdit = async (values: CloudServiceModelFormValues, cloudServiceModel: CloudServiceModel) => {
    const updated = await updateCloudServiceModel(cloudServiceModel.id, {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Modèle de service cloud ${updated.name} mis à jour.`);
    await loadData();
  };

  const handleDelete = async (cloudServiceModel: CloudServiceModel) => {
    await deleteCloudServiceModel(cloudServiceModel.id);
    closeModal();
    showNotice(`Modèle de service cloud ${cloudServiceModel.name} supprimé.`);
    await loadData();
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <p className="text-body-secondary mb-0">
          Modèle de service cloud (IaaS, PaaS, SaaS, FaaS, CaaS) utilisé pour classifier les services du catalogue.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Nouveau modèle
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
          <CloudServiceModelsTable
            cloudServiceModels={cloudServiceModels}
            onEdit={(cloudServiceModel) => setModal({ type: "edit", cloudServiceModel })}
            onDelete={(cloudServiceModel) => setModal({ type: "delete", cloudServiceModel })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "create" && (
        <CloudServiceModelFormModal mode="create" onClose={closeModal} onSubmit={handleCreate} />
      )}

      {modal?.type === "edit" && (
        <CloudServiceModelFormModal
          mode="edit"
          cloudServiceModel={modal.cloudServiceModel}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.cloudServiceModel)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeleteCloudServiceModelModal
          cloudServiceModel={modal.cloudServiceModel}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.cloudServiceModel)}
        />
      )}
    </div>
  );
}
