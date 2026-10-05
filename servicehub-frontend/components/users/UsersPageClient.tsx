"use client";

import { useCallback, useEffect, useState } from "react";
import UsersHeader from "./UsersHeader";
import UsersTable from "./UsersTable";
import UserFormModal, { type UserFormValues } from "./UserFormModal";
import ChangeRoleModal from "./ChangeRoleModal";
import ConfirmActionModal, { type ConfirmActionType } from "./ConfirmActionModal";
import BulkUserImportModal from "./BulkUserImportModal";
import UsersSearchBar from "./UsersSearchBar";
import { listPods, type Pod } from "@/services/pods.service";
import Pagination from "@/components/common/Pagination";
import type { ManagedUser, Role } from "./mockUsers";
import { ROLE_LABELS } from "./mockUsers";
import {
  listUsers,
  createUser,
  updateUser,
  changeUserRole,
  activateUser,
  deactivateUser,
  resetUserAccess,
} from "@/services/users.service";
import { getApiErrorMessage } from "@/lib/apiError";
import { downloadCsv } from "@/lib/exportCsv";

const PAGE_SIZE = 10;
const EXPORT_PAGE_SIZE = 100;

type ModalState =
  | { type: "create" }
  | { type: "bulk-import" }
  | { type: "edit"; user: ManagedUser }
  | { type: "changeRole"; user: ManagedUser }
  | { type: "confirm"; action: ConfirmActionType; user: ManagedUser };

/**
 * Orchestrateur client de la page Utilisateurs : charge la liste depuis
 * l'API au montage (GET /users) et détient l'état de la modale ouverte.
 * Pagination pilotée par le serveur (page/limit) : toute action qui
 * modifie la liste (créer/modifier/changer le rôle/activer/désactiver)
 * recharge la page courante plutôt que de patcher le tableau localement,
 * pour rester cohérent avec le total/nombre de pages renvoyés par l'API.
 * Les 6 actions ADMIN appellent l'API réelle (services/users.service.ts) ;
 * chaque modale reste ouverte et affiche l'erreur si l'appel échoue, ne
 * se ferme qu'en cas de succès.
 */
export default function UsersPageClient() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pods, setPods] = useState<Pod[]>([]);
  const [podFilter, setPodFilter] = useState("");
  const [search, setSearch] = useState("");
  // Après le premier chargement, la liste reste affichée (atténuée) pendant
  // les rechargements au lieu d'être remplacée par un spinner.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await listUsers({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        podId: podFilter ? Number(podFilter) : undefined,
        sortBy: "firstName",
        order: "ASC",
      });
      setUsers(result.items);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des utilisateurs."));
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, podFilter, search]);

  // Nouvelle recherche : retour à la première page de résultats.
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Référentiel des pods (formulaire, filtre, import en masse) — chargé
  // une fois ; une erreur ici n'empêche pas d'afficher les utilisateurs.
  useEffect(() => {
    listPods({ limit: 100 })
      .then((result) => setPods(result.items))
      .catch(() => setPods([]));
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  };

  const closeModal = () => setModal(null);

  const handleCreate = async (values: UserFormValues) => {
    const created = await createUser({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone || undefined,
      login: values.login,
      role: values.role,
      podIds: values.podIds,
    });

    closeModal();
    showNotice(`Utilisateur ${created.firstName} ${created.lastName} créé.`);
    await loadUsers();
  };

  const handleEdit = async (values: UserFormValues, user: ManagedUser) => {
    const updated = await updateUser(user.id, {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone || undefined,
      podIds: values.podIds,
    });

    closeModal();
    showNotice(`Utilisateur ${updated.firstName} ${updated.lastName} mis à jour.`);
    await loadUsers();
  };

  const handleChangeRole = async (role: Role, user: ManagedUser) => {
    const updated = await changeUserRole(user.id, role);

    closeModal();
    showNotice(`Rôle de ${updated.firstName} ${updated.lastName} mis à jour.`);
    await loadUsers();
  };

  const handleConfirmAction = async (action: ConfirmActionType, user: ManagedUser) => {
    if (action === "deactivate") {
      await deactivateUser(user.id);
    } else if (action === "reactivate") {
      await activateUser(user.id);
    } else {
      await resetUserAccess(user.id);
    }

    closeModal();

    const messages: Record<ConfirmActionType, string> = {
      deactivate: `${user.firstName} ${user.lastName} désactivé.`,
      reactivate: `${user.firstName} ${user.lastName} réactivé.`,
      resetAccess: `Accès de ${user.firstName} ${user.lastName} réinitialisé.`,
    };
    showNotice(messages[action]);
    await loadUsers();
  };

  // Parcourt toutes les pages côté serveur — le backend plafonne `limit`
  // à 100 sur ce module, donc un seul appel ne couvre pas un total
  // arbitraire.
  const handleExport = async () => {
    setIsExporting(true);

    try {
      const allUsers: ManagedUser[] = [];
      let currentPage = 1;
      let pages = 1;

      do {
        const result = await listUsers({ page: currentPage, limit: EXPORT_PAGE_SIZE, sortBy: "firstName", order: "ASC" });
        allUsers.push(...result.items);
        pages = result.totalPages;
        currentPage += 1;
      } while (currentPage <= pages);

      downloadCsv(
        "utilisateurs.csv",
        ["Nom", "Email", "Login", "Rôle", "Pods", "Statut", "Dernière connexion"],
        allUsers.map((user) => [
          `${user.firstName} ${user.lastName}`,
          user.email,
          user.login,
          ROLE_LABELS[user.role],
          user.pods.map((pod) => pod.code).join("; "),
          user.isActive ? "Actif" : "Inactif",
          user.lastLoginAt ?? "Jamais connecté",
        ])
      );
    } catch (error) {
      showNotice(getApiErrorMessage(error, "Impossible d'exporter la liste des utilisateurs."));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container-fluid">
      <UsersHeader
        onCreate={() => setModal({ type: "create" })}
        onBulkImport={() => setModal({ type: "bulk-import" })}
        onExport={handleExport}
        isExporting={isExporting}
      />

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
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={loadUsers}>
            Réessayer
          </button>
        </div>
      )}

      {/* Barre d'outils toujours affichée (hors bloc de chargement) : le champ
          de recherche garde le focus pendant le rechargement de la liste. */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body d-flex flex-wrap align-items-center gap-3">
          <UsersSearchBar onSearchChange={handleSearchChange} isSearching={isLoading && hasLoadedOnce} />
          <div className="d-flex align-items-center gap-2 ms-lg-auto">
            <label htmlFor="users-pod-filter" className="small text-body-secondary text-nowrap mb-0">
              Pod
            </label>
            <select
              id="users-pod-filter"
              className="form-select form-select-sm"
              value={podFilter}
              onChange={(event) => {
                setPodFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous les pods</option>
              {pods.map((pod) => (
                <option key={pod.id} value={pod.id}>
                  {pod.code}
                  {pod.name !== pod.code ? ` — ${pod.name}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading && !hasLoadedOnce ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : (
        <div style={{ opacity: isLoading ? 0.6 : 1, transition: "opacity 0.15s ease" }} aria-busy={isLoading}>
          <p className="text-body-secondary small mb-2">
            {total} utilisateur{total > 1 ? "s" : ""}
            {search ? ` correspondant à « ${search} »` : ""}
            {podFilter ? " dans ce pod" : search ? "" : " au total"}
          </p>
          <UsersTable
            emptyMessage={
              search || podFilter ? "Aucun utilisateur ne correspond à cette recherche." : "Aucun utilisateur."
            }
            users={users}
            onEdit={(user) => setModal({ type: "edit", user })}
            onChangeRole={(user) => setModal({ type: "changeRole", user })}
            onToggleStatus={(user) =>
              setModal({ type: "confirm", action: user.isActive ? "deactivate" : "reactivate", user })
            }
            onResetAccess={(user) => setModal({ type: "confirm", action: "resetAccess", user })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {modal?.type === "create" && (
        <UserFormModal mode="create" pods={pods} onClose={closeModal} onSubmit={handleCreate} />
      )}

      {modal?.type === "bulk-import" && (
        <BulkUserImportModal
          pods={pods}
          onClose={closeModal}
          onDone={async (createdCount) => {
            closeModal();
            if (createdCount > 0) {
              showNotice(`${createdCount} utilisateur${createdCount > 1 ? "s" : ""} créé${createdCount > 1 ? "s" : ""}.`);
              await loadUsers();
            }
          }}
        />
      )}

      {modal?.type === "edit" && (
        <UserFormModal
          mode="edit"
          user={modal.user}
          pods={pods}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.user)}
        />
      )}

      {modal?.type === "changeRole" && (
        <ChangeRoleModal
          user={modal.user}
          onClose={closeModal}
          onSubmit={(role) => handleChangeRole(role, modal.user)}
        />
      )}

      {modal?.type === "confirm" && (
        <ConfirmActionModal
          action={modal.action}
          user={modal.user}
          onClose={closeModal}
          onConfirm={() => handleConfirmAction(modal.action, modal.user)}
        />
      )}
    </div>
  );
}
