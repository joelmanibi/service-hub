"use client";

import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type PasswordInputProps = {
  id: string;
  label: string;
  autoComplete?: string;
  error?: string;
  registration: UseFormRegisterReturn;
};

/**
 * Champ mot de passe avec bascule afficher/masquer, réutilisé par
 * LoginForm et ResetPasswordForm (nouveau + confirmation).
 * Composant indépendant : gère son propre état d'affichage.
 */
export default function PasswordInput({
  id,
  label,
  autoComplete = "current-password",
  error,
  registration,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="input-group has-validation">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          className={`form-control${error ? " is-invalid" : ""}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          {...registration}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={
            showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          aria-pressed={showPassword}
        >
          <i
            className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
            aria-hidden="true"
          />
        </button>
        {error && (
          <div id={errorId} className="invalid-feedback" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
