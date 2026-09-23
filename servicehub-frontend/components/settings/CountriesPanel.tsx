"use client";

import { useEffect, useState } from "react";
import CountriesTable from "./CountriesTable";
import CountryFormModal, { type CountryFormValues } from "./CountryFormModal";
import ConfirmDeleteCountryModal from "./ConfirmDeleteCountryModal";
import Pagination from "@/components/common/Pagination";
import {
  listCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  type Country,
} from "@/services/countries.service";
import { getApiErrorMessage } from "@/lib/apiError";

const PAGE_SIZE = 10;

type ModalState =
  | { type: "create" }
  | { type: "edit"; country: Country }
  | { type: "delete"; country: Country };

/**
 * Panneau "Pays" de l'onglet Paramètres : charge la liste (paginée côté
 * serveur) au montage et gère les 3 actions CRUD (créer, modifier,
 * supprimer) contre l'API réelle (services/countries.service.ts). Toute
 * action qui modifie la liste recharge la page courante plutôt que de
 * patcher le tableau localement. Même logique que TypeClientsPanel.
 */
export default function CountriesPanel() {
  const [countries, setCountries] = useState<Country[]>([]);
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
      const result = await listCountries({ page, limit: PAGE_SIZE });
      setCountries(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger la liste des pays."));
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

  const handleCreate = async (values: CountryFormValues) => {
    const created = await createCountry({
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Pays ${created.name} créé.`);
    await loadData();
  };

  const handleEdit = async (values: CountryFormValues, country: Country) => {
    const updated = await updateCountry(country.id, {
      name: values.name,
      code: values.code,
      description: values.description || undefined,
    });

    closeModal();
    showNotice(`Pays ${updated.name} mis à jour.`);
    await loadData();
  };

  const handleDelete = async (country: Country) => {
    await deleteCountry(country.id);
    closeModal();
    showNotice(`Pays ${country.name} supprimé.`);
    await loadData();
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <p className="text-body-secondary mb-0">Géographie utilisée pour rattacher les clients.</p>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Nouveau pays
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
          <CountriesTable
            countries={countries}
            onEdit={(country) => setModal({ type: "edit", country })}
            onDelete={(country) => setModal({ type: "delete", country })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {modal?.type === "create" && <CountryFormModal mode="create" onClose={closeModal} onSubmit={handleCreate} />}

      {modal?.type === "edit" && (
        <CountryFormModal
          mode="edit"
          country={modal.country}
          onClose={closeModal}
          onSubmit={(values) => handleEdit(values, modal.country)}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDeleteCountryModal
          country={modal.country}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.country)}
        />
      )}
    </div>
  );
}
