"use client";

import { useEffect, useState } from "react";
import HostingsTable from "./HostingsTable";
import HostingFormModal, { type HostingFormValues } from "./HostingFormModal";
import ConfirmDeleteHostingModal from "./ConfirmDeleteHostingModal";
import Pagination from "@/components/common/Pagination";
import {
  listHostings,
  createHosting,
  updateHosting,
  deleteHosting,
  type Hosting,
} from "@/services/hostings.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState =
  | { type: "create" }
  | { type: "edit"; hosting: Hosting }
  | { type: "delete"; hosting: Hosting };

/**
 * Panneau "Hébergements" de l'onglet Paramètres : charge la liste
 * (paginée côté serveur) au montage et gère les 3 actions CRUD (créer,
 * modifier, supprimer) contre l'API réelle (services/hostings.service.ts).
 * Toute action qui modifie la liste recharge la page courante plutôt que
 * de patcher le tableau localement. Même logique que
 * TypeClientsPanel/CountriesPanel/ServiceTypesPanel.
 */
export default function HostingsPanel() {
  const [hostings, setHostings] = useState<Hosting[]>([]);
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
      const result = await listHostings({ page, limit: PAGE_SIZE });
      setHostings(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des hébergements."));
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

  const toPlatformsPayload = (values: HostingFormValues) =>
    values.platforms?.map((platform) => ({
      id: platform.id ? Number(platform.id) : undefined,
      name: platform.name,
      description: platform.description || undefined,
    })) ?? [];

  const handleCreate = async (values: HostingFormValues) => {
    const created = await createHosting({
      name: values.name,
      code: values.code,
      description: values.description || undefined,
      platforms: toPlatformsPayload(values),
    });

    closeModal();
    showNotice(`Hébergement ${created.name} créé.`);
    await loadData();
  };

  const handleEdit = async (values: HostingFormValues, hosting: Hosting) => {
    const updated = await updateHosting(hosting.id, {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
      platforms: toPlatformsPayload(values),
    });

    closeModal();
    showNotice(`Hébergement ${updated.name} mis à jour.`);
    await loadData();
  };

  const handleDelete = async (hosting: Hosting) => {
    await deleteHosting(hosting.id);
    closeModal();
    showNotice(`Hébergement ${hosting.name} supprimé.`);
    await loadData();
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <p className="text-body-secondary mb-0">Sites/modes d&apos;hébergement utilisés par les instances.</p>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Nouvel hébergement
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
          <HostingsTable
            hostings={hostings}
            onEdit={(hosting) => setModal({ type: "edit", hosting })}
            onDelete={(hosting) => setModal({ type: "delete", hosting })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "create" && <HostingFormModal mode="create" onClose={closeModal} onSubmit={handleCreate} />}

      {modal?.type === "edit" && (
        <HostingFormModal
          mode="edit"
          hosting={modal.hosting}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.hosting)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeleteHostingModal
          hosting={modal.hosting}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.hosting)}
        />
      )}
    </div>
  );
}
