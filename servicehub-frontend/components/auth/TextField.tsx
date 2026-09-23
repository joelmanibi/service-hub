import type { UseFormRegisterReturn } from "react-hook-form";

type TextFieldProps = {
  id: string;
  label: string;
  type?: "text" | "email";
  autoComplete?: string;
  inputMode?: "text" | "numeric";
  maxLength?: number;
  error?: string;
  registration: UseFormRegisterReturn;
};

/**
 * Champ texte/email générique (label + input + message d'erreur),
 * partagé par LoginForm ("Email ou Login"), ForgotPasswordForm ("Email")
 * et VerifyOtpForm ("Code de vérification", via inputMode/maxLength) —
 * évite de dupliquer le balisage label/input/invalid-feedback.
 */
export default function TextField({
  id,
  label,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  error,
  registration,
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`form-control${error ? " is-invalid" : ""}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : undefined}
        {...registration}
      />
      {error && (
        <div id={errorId} className="invalid-feedback" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
