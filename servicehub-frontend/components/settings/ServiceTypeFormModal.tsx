"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ModalShell from "@/components/users/ModalShell";
import type { ServiceType } from "@/services/serviceTypes.service";
import { getApiErrorMessage } from "@/lib/apiError";

// Aligné sur les validators Joi du backend
// (modules/settings/validator.js — createSchema/updateSchema génériques).
const serviceTypeFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(150),
  code: z.string().trim().min(1, "Le code est requis.").max(50),
  description: z.string().trim().max(255).optional().or(z.literal("")),
});

export type ServiceTypeFormValues = z.infer<typeof serviceTypeFormSchema>;

type ServiceTypeFormModalProps = {
  mode: "create" | "edit";
  serviceType?: ServiceType;
  onClose: () => void;
  onSubmit: (values: ServiceTypeFormValues) => Promise<void>;
};

/**
 * Modale de création/modification d'un type de service (Bootstrap Modal
 * + Bootstrap Form). `onSubmit` doit résoudre en cas de succès (le
 * parent ferme la modale) ou rejeter en cas d'échec API (affiché ici,
 * modale conservée ouverte).
 */
export default function ServiceTypeFormModal({ mode, serviceType, onClose, onSubmit }: ServiceTypeFormModalProps) {
  const titleId = "service-type-form-modal-title";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ServiceTypeFormValues>({
    resolver: zodResolver(serviceTypeFormSchema),
    defaultValues: {
      name: serviceType?.name ?? "",
      code: serviceType?.code ?? "",
      description: serviceType?.description ?? "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  const formId = "service-type-form";

  return (
    <ModalShell
      titleId={titleId}
      title={mode === "create" ? "Créer un type de service" : "Modifier le type de service"}
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
        </div>
      </form>
    </ModalShell>
  );
}
