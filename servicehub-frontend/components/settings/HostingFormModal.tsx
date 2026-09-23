"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import ModalShell from "@/components/users/ModalShell";
import type { Hosting } from "@/services/hostings.service";
import { getApiErrorMessage } from "@/lib/apiError";

// Aligné sur les validators Joi du backend
// (modules/settings/validator.js — createHostingSchema/updateHostingSchema).
// `id` (champ caché, non affiché) : présent pour une plateforme existante
// — transmis tel quel au parent (HostingsPanel) pour que le backend la
// mette à jour en place plutôt que de la recréer (cf.
// modules/settings/service.js#syncPlatforms) et préserve ainsi les
// composants d'instance qui la référencent (Composant.platformId).
const platformFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Le nom de la plateforme est requis.").max(150),
  description: z.string().trim().max(255).optional().or(z.literal("")),
});

const hostingFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(150),
  code: z.string().trim().min(1, "Le code est requis.").max(50),
  description: z.string().trim().max(255).optional().or(z.literal("")),
  platforms: z.array(platformFormSchema).optional(),
});

export type HostingFormValues = z.infer<typeof hostingFormSchema>;

type HostingFormModalProps = {
  mode: "create" | "edit";
  hosting?: Hosting;
  onClose: () => void;
  onSubmit: (values: HostingFormValues) => Promise<void>;
};

/**
 * Modale de création/modification d'un hébergement (Bootstrap Modal +
 * Bootstrap Form). Les plateformes (`platforms`) sont propres à cet
 * hébergement — pas un référentiel partagé sélectionné par id (une
 * plateforme n'appartient qu'à un seul hébergement) — donc une liste
 * éditable via `useFieldArray` (ajout/suppression de lignes nom +
 * description), même principe que les Composants d'une Instance
 * (InstanceFormModal). Envoyée telle quelle, `platforms` remplace
 * intégralement les plateformes existantes côté backend (cf.
 * modules/settings/service.js#syncPlatforms). `onSubmit` doit résoudre en
 * cas de succès (le parent ferme la modale) ou rejeter en cas d'échec API
 * (affiché ici, modale conservée ouverte).
 */
export default function HostingFormModal({ mode, hosting, onClose, onSubmit }: HostingFormModalProps) {
  const titleId = "hosting-form-modal-title";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    control,
    formState: { errors, isSubmitting },
  } = useForm<HostingFormValues>({
    resolver: zodResolver(hostingFormSchema),
    defaultValues: {
      name: hosting?.name ?? "",
      code: hosting?.code ?? "",
      description: hosting?.description ?? "",
      platforms: hosting?.platforms.map((platform) => ({
        id: String(platform.id),
        name: platform.name,
        description: platform.description ?? "",
      })) ?? [],
    },
    mode: "onChange",
  });

  const {
    fields: platformFields,
    append: appendPlatform,
    remove: removePlatform,
  } = useFieldArray({ control, name: "platforms" });

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  const formId = "hosting-form";

  return (
    <ModalShell
      titleId={titleId}
      title={mode === "create" ? "Créer un hébergement" : "Modifier l'hébergement"}
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

          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="form-label mb-0">
                Plateformes <span className="text-body-secondary">(optionnel)</span>
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => appendPlatform({ name: "", description: "" })}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Ajouter une plateforme
              </button>
            </div>

            {platformFields.length === 0 && <p className="text-body-secondary small mb-0">Aucune plateforme.</p>}

            {platformFields.map((field, index) => (
              <div className="row g-2 align-items-start mb-2" key={field.id}>
                <input type="hidden" {...register(`platforms.${index}.id` as const)} />
                <div className="col-12 col-sm-5">
                  <input
                    type="text"
                    placeholder="Nom de la plateforme"
                    aria-label={`Nom de la plateforme ${index + 1}`}
                    className={`form-control${errors.platforms?.[index]?.name ? " is-invalid" : ""}`}
                    aria-invalid={errors.platforms?.[index]?.name ? "true" : "false"}
                    {...register(`platforms.${index}.name` as const)}
                  />
                  {errors.platforms?.[index]?.name && (
                    <div className="invalid-feedback" role="alert">
                      {errors.platforms[index]?.name?.message}
                    </div>
                  )}
                </div>
                <div className="col-12 col-sm-6">
                  <input
                    type="text"
                    placeholder="Description (optionnel)"
                    aria-label={`Description de la plateforme ${index + 1}`}
                    className="form-control"
                    {...register(`platforms.${index}.description` as const)}
                  />
                </div>
                <div className="col-12 col-sm-1 d-flex">
                  <button
                    type="button"
                    className="btn btn-icon btn-sm text-danger"
                    aria-label={`Supprimer la plateforme ${index + 1}`}
                    onClick={() => removePlatform(index)}
                  >
                    <i className="bi bi-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
