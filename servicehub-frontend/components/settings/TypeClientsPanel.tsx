"use client";

import { useEffect, useState } from "react";
import TypeClientsTable from "./TypeClientsTable";
import TypeClientFormModal, { type TypeClientFormValues } from "./TypeClientFormModal";
import ConfirmDeleteTypeClientModal from "./ConfirmDeleteTypeClientModal";
import Pagination from "@/components/common/Pagination";
import {
  listTypeClients,
  createTypeClient,
  updateTypeClient,
  deleteTypeClient,
  type TypeClient,
} from "@/services/typeClients.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState =
  | { type: "create" }
  | { type: "edit"; typeClient: TypeClient }
  | { type: "delete"; typeClient: TypeClient };

/**
 * Panneau "Types de client" de l'onglet Paramètres : charge la liste
 * (paginée côté serveur) au montage et gère les 3 actions CRUD (créer,
 * modifier, supprimer) contre l'API réelle (services/typeClients.service.ts).
 * Toute action qui modifie la liste recharge la page courante plutôt que
 * de patcher le tableau localement. Même logique de gestion
 * d'erreur/notice que ClientsPageClient : chaque modale reste ouverte et
 * affiche l'erreur en cas d'échec API.
 */
export default function TypeClientsPanel() {
  const [typeClients, setTypeClients] = useState<TypeClient[]>([]);
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
      const result = await listTypeClients({ page, limit: PAGE_SIZE });
      setTypeClients(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des types de client."));
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

  const handleCreate = async (values: TypeClientFormValues) => {
    const created = await createTypeClient({
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Type de client ${created.name} créé.`);
    await loadData();
  };

  const handleEdit = async (values: TypeClientFormValues, typeClient: TypeClient) => {
    const updated = await updateTypeClient(typeClient.id, {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Type de client ${updated.name} mis à jour.`);
    await loadData();
  };

  const handleDelete = async (typeClient: TypeClient) => {
    await deleteTypeClient(typeClient.id);
    closeModal();
    showNotice(`Type de client ${typeClient.name} supprimé.`);
    await loadData();
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <p className="text-body-secondary mb-0">Classification utilisée pour catégoriser les clients.</p>
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
          <TypeClientsTable
            typeClients={typeClients}
            onEdit={(typeClient) => setModal({ type: "edit", typeClient })}
            onDelete={(typeClient) => setModal({ type: "delete", typeClient })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "create" && <TypeClientFormModal mode="create" onClose={closeModal} onSubmit={handleCreate} />}

      {modal?.type === "edit" && (
        <TypeClientFormModal
          mode="edit"
          typeClient={modal.typeClient}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.typeClient)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeleteTypeClientModal
          typeClient={modal.typeClient}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.typeClient)}
        />
      )}
    </div>
  );
}
