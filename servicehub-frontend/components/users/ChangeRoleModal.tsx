"use client";

import { useState } from "react";
import type { ManagedUser, Role } from "./mockUsers";
import { ROLE_LABELS } from "./mockUsers";
import ModalShell from "./ModalShell";
import { getApiErrorMessage } from "@/lib/apiError";

const ROLE_VALUES: Role[] = ["ADMIN", "VALIDATOR", "USER"];

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Accès total : gestion des utilisateurs incluse.",
  VALIDATOR: "Lecture, création et modification. Pas de gestion des utilisateurs.",
  USER: "Lecture uniquement.",
};

type ChangeRoleModalProps = {
  user: ManagedUser;
  onClose: () => void;
  onSubmit: (role: Role) => Promise<void>;
};

/**
 * Modale dédiée au changement de rôle (Bootstrap Modal + Form), distincte
 * de la modification de profil — cohérent avec le backend
 * (PATCH /users/:id/role, séparé de PUT /users/:id). `onSubmit` doit
 * résoudre en cas de succès (le parent ferme la modale) ou rejeter en
 * cas d'échec API (affiché ici, modale conservée ouverte).
 */
export default function ChangeRoleModal({ user, onClose, onSubmit }: ChangeRoleModalProps) {
  const [role, setRole] = useState<Role>(user.role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const titleId = "change-role-modal-title";

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      await onSubmit(role);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      titleId={titleId}
      title={`Changer le rôle — ${user.firstName} ${user.lastName}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isSubmitting || role === user.role}
            onClick={handleConfirm}
          >
            {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            Enregistrer
          </button>
        </>
      }
    >
      {formError && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      <fieldset>
        <legend className="visually-hidden">Rôle</legend>
        {ROLE_VALUES.map((value) => (
          <div className="form-check mb-3" key={value}>
            <input
              id={`role-${value}`}
              type="radio"
              name="role"
              className="form-check-input"
              checked={role === value}
              onChange={() => setRole(value)}
            />
            <label htmlFor={`role-${value}`} className="form-check-label">
              <span className="fw-semibold d-block">{ROLE_LABELS[value]}</span>
              <span className="text-body-secondary small">{ROLE_DESCRIPTIONS[value]}</span>
            </label>
          </div>
        ))}
      </fieldset>
    </ModalShell>
  );
}
