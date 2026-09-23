"use client";

import { useEffect, useState } from "react";
import NetworksTable from "./NetworksTable";
import NetworkFormModal, { type NetworkFormValues } from "./NetworkFormModal";
import ConfirmDeleteNetworkModal from "./ConfirmDeleteNetworkModal";
import Pagination from "@/components/common/Pagination";
import { listNetworks, createNetwork, updateNetwork, deleteNetwork, type Network } from "@/services/networks.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState = { type: "create" } | { type: "edit"; network: Network } | { type: "delete"; network: Network };

/**
 * Panneau "Réseaux" de l'onglet Paramètres : charge la liste (paginée
 * côté serveur) au montage et gère les 3 actions CRUD (créer, modifier,
 * supprimer) contre l'API réelle (services/networks.service.ts). Toute
 * action qui modifie la liste recharge la page courante plutôt que de
 * patcher le tableau localement. Même logique que CloudServiceModelsPanel.
 */
export default function NetworksPanel() {
  const [networks, setNetworks] = useState<Network[]>([]);
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
      const result = await listNetworks({ page, limit: PAGE_SIZE });
      setNetworks(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des réseaux."));
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

  const handleCreate = async (values: NetworkFormValues) => {
    const created = await createNetwork({
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Réseau ${created.name} créé.`);
    await loadData();
  };

  const handleEdit = async (values: NetworkFormValues, network: Network) => {
    const updated = await updateNetwork(network.id, {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Réseau ${updated.name} mis à jour.`);
    await loadData();
  };

  const handleDelete = async (network: Network) => {
    await deleteNetwork(network.id);
    closeModal();
    showNotice(`Réseau ${network.name} supprimé.`);
    await loadData();
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <p className="text-body-secondary mb-0">
          Réseaux pouvant être rattachés à une instance en tant que dépendance réseau.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Nouveau réseau
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
          <NetworksTable
            networks={networks}
            onEdit={(network) => setModal({ type: "edit", network })}
            onDelete={(network) => setModal({ type: "delete", network })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "create" && <NetworkFormModal mode="create" onClose={closeModal} onSubmit={handleCreate} />}

      {modal?.type === "edit" && (
        <NetworkFormModal
          mode="edit"
          network={modal.network}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.network)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeleteNetworkModal
          network={modal.network}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.network)}
        />
      )}
    </div>
  );
}
