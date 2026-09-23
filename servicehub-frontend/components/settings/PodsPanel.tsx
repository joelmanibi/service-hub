"use client";

import { useEffect, useState } from "react";
import PodsTable from "./PodsTable";
import PodFormModal, { type PodFormValues } from "./PodFormModal";
import ConfirmDeletePodModal from "./ConfirmDeletePodModal";
import Pagination from "@/components/common/Pagination";
import { listPods, createPod, updatePod, deletePod, type Pod } from "@/services/pods.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState = { type: "create" } | { type: "edit"; pod: Pod } | { type: "delete"; pod: Pod };

/**
 * Panneau "Pods" de l'onglet Paramètres : charge la liste (paginée côté
 * serveur) au montage et gère les 3 actions CRUD (créer, modifier,
 * supprimer) contre l'API réelle (services/pods.service.ts). Toute action
 * qui modifie la liste recharge la page courante plutôt que de patcher le
 * tableau localement. Même logique que HostingsPanel/TypeClientsPanel.
 */
export default function PodsPanel() {
  const [pods, setPods] = useState<Pod[]>([]);
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
      const result = await listPods({ page, limit: PAGE_SIZE });
      setPods(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des pods."));
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

  const handleCreate = async (values: PodFormValues) => {
    const created = await createPod({
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Pod ${created.name} créé.`);
    await loadData();
  };

  const handleEdit = async (values: PodFormValues, pod: Pod) => {
    const updated = await updatePod(pod.id, {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Pod ${updated.name} mis à jour.`);
    await loadData();
  };

  const handleDelete = async (pod: Pod) => {
    await deletePod(pod.id);
    closeModal();
    showNotice(`Pod ${pod.name} supprimé.`);
    await loadData();
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <p className="text-body-secondary mb-0">Pods auxquels appartiennent les instances.</p>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Nouveau pod
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
          <PodsTable
            pods={pods}
            onEdit={(pod) => setModal({ type: "edit", pod })}
            onDelete={(pod) => setModal({ type: "delete", pod })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "create" && <PodFormModal mode="create" onClose={closeModal} onSubmit={handleCreate} />}

      {modal?.type === "edit" && (
        <PodFormModal
          mode="edit"
          pod={modal.pod}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.pod)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeletePodModal pod={modal.pod} onClose={closeModal} onConfirm={() => handleDelete(modal.pod)} />
      )}
    </div>
  );
}
