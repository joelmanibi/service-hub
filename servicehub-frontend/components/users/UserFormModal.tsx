"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import ModalShell from "./ModalShell";
import type { ManagedUser, Role } from "./mockUsers";
import { ROLE_LABELS } from "./mockUsers";
import { getApiErrorMessage } from "@/lib/apiError";
import SearchableSelect from "@/components/common/SearchableSelect";

const ROLE_VALUES: [Role, ...Role[]] = ["ADMIN", "VALIDATOR", "USER"];

// Aligné sur les validators Joi du backend (modules/users/validator.js) :
// createUserSchema (+ login, + role) / updateUserSchema (profil seul —
// le rôle a son propre flux dédié, ChangeRoleModal).
const userFormSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis.").max(100),
  lastName: z.string().trim().min(1, "Le nom est requis.").max(100),
  email: z.string().trim().min(1, "L'email est requis.").email("Adresse email invalide."),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  login: z.string().trim().min(1, "Le login est requis.").max(60),
  role: z.enum(ROLE_VALUES),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

type UserFormModalProps = {
  mode: "create" | "edit";
  user?: ManagedUser;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
};

/**
 * Modale de création/modification d'utilisateur (Bootstrap Modal +
 * Bootstrap Form). En édition, login et rôle sont affichés en lecture
 * seule : le login est immuable et le rôle se change via un flux dédié
 * (ChangeRoleModal), jamais via cette mise à jour de profil générique —
 * cohérent avec le backend (updateUserSchema exclut role/isActive).
 * `onSubmit` doit résoudre en cas de succès (le parent ferme la
 * modale) ou rejeter en cas d'échec API (affiché ici, modale conservée
 * ouverte pour permettre de corriger et réessayer).
 */
export default function UserFormModal({ mode, user, onClose, onSubmit }: UserFormModalProps) {
  const titleId = "user-form-modal-title";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      login: user?.login ?? "",
      role: user?.role ?? "USER",
    },
    mode: "onChange",
  });

  useEffect(() => {
    setFocus("firstName");
  }, [setFocus]);

  const formId = "user-form";

  return (
    <ModalShell
      titleId={titleId}
      title={mode === "create" ? "Créer un utilisateur" : "Modifier l'utilisateur"}
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
            <label htmlFor="firstName" className="form-label">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              className={`form-control${errors.firstName ? " is-invalid" : ""}`}
              aria-invalid={errors.firstName ? "true" : "false"}
              {...register("firstName")}
            />
            {errors.firstName && (
              <div className="invalid-feedback" role="alert">
                {errors.firstName.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="lastName" className="form-label">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              className={`form-control${errors.lastName ? " is-invalid" : ""}`}
              aria-invalid={errors.lastName ? "true" : "false"}
              {...register("lastName")}
            />
            {errors.lastName && (
              <div className="invalid-feedback" role="alert">
                {errors.lastName.message}
              </div>
            )}
          </div>

          <div className="col-12">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`form-control${errors.email ? " is-invalid" : ""}`}
              aria-invalid={errors.email ? "true" : "false"}
              {...register("email")}
            />
            {errors.email && (
              <div className="invalid-feedback" role="alert">
                {errors.email.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="phone" className="form-label">
              Téléphone <span className="text-body-secondary">(optionnel)</span>
            </label>
            <input
              id="phone"
              type="tel"
              className={`form-control${errors.phone ? " is-invalid" : ""}`}
              aria-invalid={errors.phone ? "true" : "false"}
              {...register("phone")}
            />
            {errors.phone && (
              <div className="invalid-feedback" role="alert">
                {errors.phone.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="login" className="form-label">
              Login
            </label>
            <input
              id="login"
              type="text"
              className={`form-control${errors.login ? " is-invalid" : ""}`}
              aria-invalid={errors.login ? "true" : "false"}
              readOnly={mode === "edit"}
              disabled={mode === "edit"}
              {...register("login")}
            />
            {errors.login && (
              <div className="invalid-feedback" role="alert">
                {errors.login.message}
              </div>
            )}
            {mode === "edit" && (
              <div className="form-text">Le login ne peut pas être modifié.</div>
            )}
          </div>

          {mode === "create" && (
            <div className="col-12">
              <label htmlFor="role" className="form-label">
                Rôle
              </label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    id="role"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={ROLE_VALUES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
                  />
                )}
              />
            </div>
          )}
        </div>
      </form>
    </ModalShell>
  );
}
