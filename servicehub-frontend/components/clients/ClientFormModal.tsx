"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import ModalShell from "@/components/users/ModalShell";
import type { ManagedClient, ReferenceItem } from "./clientTypes";
import { getApiErrorMessage } from "@/lib/apiError";
import SearchableSelect from "@/components/common/SearchableSelect";

// Aligné sur les validators Joi du backend
// (modules/settings/validator.js — createClientSchema/updateClientSchema).
const clientFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(150),
  code: z.string().trim().min(1, "Le code est requis.").max(50),
  description: z.string().trim().max(255).optional().or(z.literal("")),
  typeClientId: z.string().min(1, "Le type de client est requis."),
  countryId: z.string().optional().or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

type ClientFormModalProps = {
  mode: "create" | "edit";
  client?: ManagedClient;
  typeClients: ReferenceItem[];
  countries: ReferenceItem[];
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => Promise<void>;
};

/**
 * Modale de création/modification d'un client (Bootstrap Modal +
 * Bootstrap Form). `typeClientId`/`countryId` sont manipulés comme des
 * chaînes côté formulaire (valeurs de SearchableSelect — select à
 * recherche, piloté via `Controller` plutôt que `register`), converties
 * en nombre par le parent (ClientsPageClient) avant l'appel API. `onSubmit`
 * doit résoudre en cas de succès (le parent ferme la modale) ou rejeter
 * en cas d'échec API (affiché ici, modale conservée ouverte).
 */
export default function ClientFormModal({
  mode,
  client,
  typeClients,
  countries,
  onClose,
  onSubmit,
}: ClientFormModalProps) {
  const titleId = "client-form-modal-title";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name ?? "",
      code: client?.code ?? "",
      description: client?.description ?? "",
      typeClientId: client ? String(client.typeClientId) : "",
      countryId: client?.countryId ? String(client.countryId) : "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  const formId = "client-form";

  return (
    <ModalShell
      titleId={titleId}
      title={mode === "create" ? "Créer un client" : "Modifier le client"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" form={formId} className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {mode === "create" ? "Créer" : "Enregistrer"}
          </button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          try {
            await onSubmit(values);
          } catch (error) {
            setFormError(getApiErrorMessage(error));
          }
        })}
      >
        {formError && (
          <div className="alert alert-danger" role="alert">
            {formError}
          </div>
        )}

        <div className="row g-3">
          <div className="col-12 col-sm-6">
            <label htmlFor="name" className="form-label">
              Nom
            </label>
            <input
              id="name"
              type="text"
              className={`form-control${errors.name ? " is-invalid" : ""}`}
              aria-invalid={errors.name ? "true" : "false"}
              {...register("name")}
            />
            {errors.name && (
              <div className="invalid-feedback" role="alert">
                {errors.name.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="code" className="form-label">
              Code
            </label>
            <input
              id="code"
              type="text"
              className={`form-control${errors.code ? " is-invalid" : ""}`}
              aria-invalid={errors.code ? "true" : "false"}
              {...register("code")}
            />
            {errors.code && (
              <div className="invalid-feedback" role="alert">
                {errors.code.message}
              </div>
            )}
          </div>

          <div className="col-12">
            <label htmlFor="description" className="form-label">
              Description <span className="text-body-secondary">(optionnel)</span>
            </label>
            <textarea
              id="description"
              className={`form-control${errors.description ? " is-invalid" : ""}`}
              aria-invalid={errors.description ? "true" : "false"}
              rows={2}
              {...register("description")}
            />
            {errors.description && (
              <div className="invalid-feedback" role="alert">
                {errors.description.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="typeClientId" className="form-label">
              Type de client
            </label>
            <Controller
              name="typeClientId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="typeClientId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={!!errors.typeClientId}
                  placeholder="Sélectionner..."
                  options={typeClients.map((typeClient) => ({ value: String(typeClient.id), label: typeClient.name }))}
                />
              )}
            />
            {errors.typeClientId && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.typeClientId.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="countryId" className="form-label">
              Pays <span className="text-body-secondary">(optionnel)</span>
            </label>
            <Controller
              name="countryId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="countryId"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  emptyOptionLabel="Aucun"
                  options={countries.map((country) => ({ value: String(country.id), label: country.name }))}
                />
              )}
            />
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
