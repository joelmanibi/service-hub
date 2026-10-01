"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { requestOtpAction, verifyOtpAction } from "../_actions/auth";
import styles from "./LoginModal.module.scss";

type LoginModalProps = {
  onClose: () => void;
};

/**
 * Fenêtre de connexion du site public, en deux étapes — mêmes comptes et
 * même parcours que l'administration : (1) identifiant ou email → envoi
 * d'un code à usage unique par email, (2) saisie du code. En cas de
 * succès, la session est posée en cookie httpOnly par la Server Action et
 * la page est rafraîchie pour afficher les informations sensibles.
 */
export default function LoginModal({ onClose }: LoginModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"identifier" | "code">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const sendCode = () => {
    setError(null);
    startTransition(async () => {
      const result = await requestOtpAction(identifier);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInfo("Si un compte correspond, un code de connexion vient d'être envoyé par email.");
      setStep("code");
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (step === "identifier") {
      sendCode();
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(identifier, code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.dialogWrapper} role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
        <div className={`card border-0 shadow ${styles.dialog}`}>
          <div className="card-body p-4">
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div className="d-flex align-items-center gap-3">
                <span className={`rounded-3 d-inline-flex align-items-center justify-content-center ${styles.icon}`}>
                  <i className="bi bi-shield-lock" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="login-modal-title" className="h5 fw-semibold mb-0">
                    Connexion
                  </h2>
                  <p className="small text-body-secondary mb-0">Accès aux informations sensibles</p>
                </div>
              </div>
              <button type="button" className="btn-close" aria-label="Fermer" onClick={onClose} />
            </div>

            <p className="small text-body-secondary">
              Client, composants, inventaire (IP, serveurs) et contacts de support sont réservés aux utilisateurs
              ServiceHub. Connectez-vous avec votre compte habituel.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {step === "identifier" ? (
                <div className="mb-3">
                  <label htmlFor="login-identifier" className="form-label small fw-semibold">
                    Identifiant ou email
                  </label>
                  <input
                    ref={inputRef}
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    className="form-control"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>
              ) : (
                <div className="mb-3">
                  {info && (
                    <div className="alert alert-info small py-2" role="status">
                      <i className="bi bi-envelope me-2" aria-hidden="true" />
                      {info}
                    </div>
                  )}
                  <label htmlFor="login-code" className="form-label small fw-semibold">
                    Code reçu par email
                  </label>
                  <input
                    ref={inputRef}
                    id="login-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className={`form-control text-center fw-semibold ${styles.codeInput}`}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\s+/g, ""))}
                    disabled={isPending}
                    maxLength={10}
                    required
                  />
                  <div className="d-flex justify-content-between mt-2 small">
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0"
                      onClick={() => {
                        setStep("identifier");
                        setCode("");
                        setError(null);
                      }}
                      disabled={isPending}
                    >
                      Changer d&apos;identifiant
                    </button>
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={sendCode} disabled={isPending}>
                      Renvoyer le code
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-danger small py-2" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isPending || (step === "identifier" ? !identifier.trim() : !code.trim())}
              >
                {isPending && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                {step === "identifier" ? "Recevoir un code" : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
