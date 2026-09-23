"use client";

import { useEffect, useState } from "react";
import ClientsHeader from "./ClientsHeader";
import ClientsTable from "./ClientsTable";
import ClientFormModal, { type ClientFormValues } from "./ClientFormModal";
import ConfirmDeleteClientModal from "./ConfirmDeleteClientModal";
import Pagination from "@/components/common/Pagination";
import type { ManagedClient, ReferenceItem } from "./clientTypes";
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  listTypeClients,
  listCountries,
} from "@/services/clients.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState =
  | { type: "create" }
  | { type: "edit"; client: ManagedClient }
  | { type: "delete"; client: ManagedClient };

/**
 * Orchestrateur client de la page Clients : charge la liste des clients
 * (paginée côté serveur) ainsi que les référentiels (types de client,
 * pays) nécessaires au formulaire, et détient l'état de la modale
 * ouverte. Toute action qui modifie la liste recharge la page courante
 * plutôt que de patcher le tableau localement, pour rester cohérent avec
 * le total/nombre de pages renvoyés par l'API. Les 3 actions (créer,
 * modifier, supprimer) appellent l'API réelle (services/clients.service.ts) ;
 * chaque modale reste ouverte et affiche l'erreur si l'appel échoue, ne
 * se ferme qu'en cas de succès.
 */
export default function ClientsPageClient() {
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [typeClients, setTypeClients] = useState<ReferenceItem[]>([]);
  const [countries, setCountries] = useState<ReferenceItem[]>([]);
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
      const [clientsResult, typeClientsResult, countriesResult] = await Promise.all([
        listClients({ page, limit: PAGE_SIZE }),
        listTypeClients({ limit: 100 }),
        listCountries({ limit: 100 }),
      ]);
      setClients(clientsResult.items);
      setTotalPages(clientsResult.totalPages);
      setTypeClients(typeClientsResult.items);
      setCountries(countriesResult.items);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des clients."));
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

  const handleCreate = async (values: ClientFormValues) => {
    const created = await createClient({
      name: values.name,
      code: values.code,
      description: values.description || undefined,
      typeClientId: Number(values.typeClientId),
      countryId: values.countryId ? Number(values.countryId) : null,
    });

    closeModal();
    showNotice(`Client ${created.name} créé.`);
    await loadData();
  };

  const handleEdit = async (values: ClientFormValues, client: ManagedClient) => {
    const updated = await updateClient(client.id, {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
      typeClientId: Number(values.typeClientId),
      countryId: values.countryId ? Number(values.countryId) : null,
    });

    closeModal();
    showNotice(`Client ${updated.name} mis à jour.`);
    await loadData();
  };

  const handleDelete = async (client: ManagedClient) => {
    await deleteClient(client.id);
    closeModal();
    showNotice(`Client ${client.name} supprimé.`);
    await loadData();
  };

  return (
    <div className="container-fluid">
      <ClientsHeader onCreate={() => setModal({ type: "create" })} />

      {notice && (
        <div className="alert alert-success alert-dismissible" role="status">
          {notice}
          <button
            type="button"
            className="btn-close"
            aria-label="Fermer"
            onClick={() => setNotice(null)}
          />
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
          <ClientsTable
            clients={clients}
            typeClients={typeClients}
            countries={countries}
            onEdit={(client) => setModal({ type: "edit", client })}
            onDelete={(client) => setModal({ type: "delete", client })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "create" && (
        <ClientFormModal
          mode="create"
          typeClients={typeClients}
          countries={countries}
          onClose={closeModal}
          onSubmit={handleCreate}
        />
      )}

      {modal?.type === "edit" && (
        <ClientFormModal
          mode="edit"
          client={modal.client}
          typeClients={typeClients}
          countries={countries}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.client)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeleteClientModal
          client={modal.client}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.client)}
        />
      )}
    </div>
  );
}
