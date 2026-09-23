"use client";

import { useEffect, useState } from "react";
import SupportLevelsTable from "./SupportLevelsTable";
import SupportLevelFormModal, { type SupportLevelFormValues } from "./SupportLevelFormModal";
import ConfirmDeleteSupportLevelModal from "./ConfirmDeleteSupportLevelModal";
import Pagination from "@/components/common/Pagination";
import {
  listSupportLevels,
  createSupportLevel,
  updateSupportLevel,
  deleteSupportLevel,
  type SupportLevel,
} from "@/services/supportLevels.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState =
  | { type: "create" }
  | { type: "edit"; supportLevel: SupportLevel }
  | { type: "delete"; supportLevel: SupportLevel };

/**
 * Panneau "Niveaux de support" de l'onglet Paramètres : charge la liste
 * (paginée côté serveur) au montage et gère les 3 actions CRUD (créer,
 * modifier, supprimer) contre l'API réelle (services/supportLevels.service.ts).
 * Toute action qui modifie la liste recharge la page courante plutôt que
 * de patcher le tableau localement. Même logique que PodsPanel/HostingsPanel.
 */
export default function SupportLevelsPanel() {
  const [supportLevels, setSupportLevels] = useState<SupportLevel[]>([]);
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
      const result = await listSupportLevels({ page, limit: PAGE_SIZE });
      setSupportLevels(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des niveaux de support."));
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

  const handleCreate = async (values: SupportLevelFormValues) => {
    const created = await createSupportLevel({
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Niveau de support ${created.name} créé.`);
    await loadData();
  };

  const handleEdit = async (values: SupportLevelFormValues, supportLevel: SupportLevel) => {
    const updated = await updateSupportLevel(supportLevel.id, {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Niveau de support ${updated.name} mis à jour.`);
    await loadData();
  };

  const handleDelete = async (supportLevel: SupportLevel) => {
    await deleteSupportLevel(supportLevel.id);
    closeModal();
    showNotice(`Niveau de support ${supportLevel.name} supprimé.`);
    await loadData();
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <p className="text-body-secondary mb-0">Niveaux de support assignables aux instances.</p>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Nouveau niveau de support
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
          <SupportLevelsTable
            supportLevels={supportLevels}
            onEdit={(supportLevel) => setModal({ type: "edit", supportLevel })}
            onDelete={(supportLevel) => setModal({ type: "delete", supportLevel })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "create" && (
        <SupportLevelFormModal mode="create" onClose={closeModal} onSubmit={handleCreate} />
      )}

      {modal?.type === "edit" && (
        <SupportLevelFormModal
          mode="edit"
          supportLevel={modal.supportLevel}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.supportLevel)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeleteSupportLevelModal
          supportLevel={modal.supportLevel}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.supportLevel)}
        />
      )}
    </div>
  );
}
