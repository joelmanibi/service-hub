"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import ModalShell from "@/components/users/ModalShell";
import { getServiceLogoUrl, type CatalogService } from "@/services/catalog.service";
import type { ServiceType } from "@/services/serviceTypes.service";
import type { CloudServiceModel } from "@/services/cloudServiceModels.service";
import { getApiErrorMessage } from "@/lib/apiError";
import SearchableSelect from "@/components/common/SearchableSelect";

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

// Aligné sur les validators Joi du backend
// (modules/catalog/validator.js — createServiceSchema/updateServiceSchema).
// `code` est volontairement absent : généré automatiquement par le
// backend, jamais fourni ni modifiable par le formulaire.
const serviceFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(150),
  serviceTypeId: z.string().min(1, "Le type de service est requis."),
  description: z.string().trim().optional().or(z.literal("")),
  cloudServiceModelIds: z.array(z.string()).optional(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

type ServiceFormModalProps = {
  mode: "create" | "edit";
  service?: CatalogService;
  serviceTypes: ServiceType[];
  cloudServiceModels: CloudServiceModel[];
  onClose: () => void;
  onSubmit: (values: ServiceFormValues, logo: File | null) => Promise<void>;
};

/**
 * Modale de création/modification d'un service du catalogue (Bootstrap
 * Modal + Bootstrap Form). `serviceTypeId` est manipulé comme une chaîne
 * côté formulaire (valeur d'un SearchableSelect — select à recherche,
 * piloté via `Controller` plutôt que `register`), convertie en nombre par
 * le parent (CatalogPageClient) avant l'appel API. Le logo (optionnel)
 * est géré hors react-hook-form/zod (état local `logoFile`) — un input
 * file non contrôlé se prête mal à la validation zod, et il n'a pas
 * besoin de suivre le cycle de vie du reste du formulaire : `onSubmit`
 * reçoit le fichier sélectionné en second argument, `null` si inchangé
 * (le parent envoie alors le payload sans le champ `logo`, ce qui
 * conserve le logo existant côté backend en modification). `onSubmit`
 * doit résoudre en cas de succès (le parent ferme la modale) ou rejeter
 * en cas d'échec API (affiché ici, modale conservée ouverte).
 */
export default function ServiceFormModal({
  mode,
  service,
  serviceTypes,
  cloudServiceModels,
  onClose,
  onSubmit,
}: ServiceFormModalProps) {
  const titleId = "service-form-modal-title";
  const [formError, setFormError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(getServiceLogoUrl(service?.logoUrl ?? null));

  const {
    register,
    handleSubmit,
    setFocus,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name ?? "",
      serviceTypeId: service ? String(service.serviceTypeId) : "",
      description: service?.description ?? "",
      cloudServiceModelIds: service?.cloudServiceModels.map((item) => String(item.id)) ?? [],
    },
    mode: "onChange",
  });

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  // Révoque l'URL d'objet créée pour l'aperçu à chaque changement de
  // fichier / démontage — évite de fuir des blobs en mémoire.
  useEffect(() => {
    if (!logoFile) {
      return undefined;
    }
    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoError(null);

    if (!file) {
      setLogoFile(null);
      setLogoPreview(getServiceLogoUrl(service?.logoUrl ?? null));
      return;
    }

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Format non supporté (JPEG, PNG, WEBP, GIF ou SVG).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("Fichier trop volumineux (5 Mo maximum).");
      event.target.value = "";
      return;
    }

    setLogoFile(file);
  };

  const formId = "service-form";

  return (
    <ModalShell
      titleId={titleId}
      title={mode === "create" ? "Créer un service" : "Modifier le service"}
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
            await onSubmit(values, logoFile);
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

        {mode === "edit" && service && (
          <div className="mb-3">
            <span className="form-label d-block mb-1">Code</span>
            <span className="fw-semibold">{service.code}</span>
            <div className="form-text">Le code est généré automatiquement et ne peut pas être modifié.</div>
          </div>
        )}

        <div className="row g-3">
          <div className="col-12">
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

          <div className="col-12">
            <label htmlFor="serviceTypeId" className="form-label">
              Type de service
            </label>
            <Controller
              name="serviceTypeId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="serviceTypeId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={!!errors.serviceTypeId}
                  placeholder="Sélectionner..."
                  options={serviceTypes.map((serviceType) => ({
                    value: String(serviceType.id),
                    label: serviceType.name,
                  }))}
                />
              )}
            />
            {errors.serviceTypeId && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.serviceTypeId.message}
              </div>
            )}
          </div>

          <div className="col-12">
            <span className="form-label d-block">
              Modèle(s) de service cloud <span className="text-body-secondary">(optionnel)</span>
            </span>
            <div className="border rounded p-2" style={{ maxHeight: "10rem", overflowY: "auto" }}>
              {cloudServiceModels.map((cloudServiceModel) => (
                <div className="form-check" key={cloudServiceModel.id}>
                  <input
                    id={`cloudServiceModelIds-${cloudServiceModel.id}`}
                    type="checkbox"
                    className="form-check-input"
                    value={cloudServiceModel.id}
                    {...register("cloudServiceModelIds")}
                  />
                  <label className="form-check-label" htmlFor={`cloudServiceModelIds-${cloudServiceModel.id}`}>
                    {cloudServiceModel.code} — {cloudServiceModel.name}
                  </label>
                </div>
              ))}
              {cloudServiceModels.length === 0 && (
                <p className="text-body-secondary small mb-0">Aucun modèle de service cloud.</p>
              )}
            </div>
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

          <div className="col-12">
            <label htmlFor="logo" className="form-label">
              Logo <span className="text-body-secondary">(optionnel)</span>
            </label>
            <div className="d-flex align-items-center gap-3">
              {logoPreview && (
                // eslint-disable-next-line @next/next/no-img-element -- logo utilisateur hors domaines Next Image configurés
                <img
                  src={logoPreview}
                  alt=""
                  className="rounded border"
                  style={{ width: "3rem", height: "3rem", objectFit: "contain" }}
                />
              )}
              <input
                id="logo"
                type="file"
                accept={ACCEPTED_LOGO_TYPES.join(",")}
                className={`form-control${logoError ? " is-invalid" : ""}`}
                aria-invalid={logoError ? "true" : "false"}
                onChange={handleLogoChange}
              />
            </div>
            {logoError && (
              <div className="invalid-feedback d-block" role="alert">
                {logoError}
              </div>
            )}
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
