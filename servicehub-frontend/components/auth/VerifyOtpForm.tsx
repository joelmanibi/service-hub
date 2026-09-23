"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import TextField from "./TextField";
import SubmitButton from "./SubmitButton";
import { requestOtp, verifyOtp } from "@/services/auth.service";
import { setSession } from "@/lib/session";
import { getApiErrorMessage } from "@/lib/apiError";

const OTP_LENGTH = 6;
const RESEND_DELAY_SECONDS = 60;

// Aligné sur le validator Joi du backend (modules/auth/validator.js —
// verifyOtpSchema) : code strictement numérique à 6 chiffres.
const verifyOtpSchema = z.object({
  code: z
    .string()
    .trim()
    .length(OTP_LENGTH, `Le code doit contenir ${OTP_LENGTH} chiffres.`)
    .regex(/^\d+$/, "Le code ne doit contenir que des chiffres."),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

type VerifyOtpFormProps = {
  identifier: string;
  onVerified: (values: VerifyOtpFormValues) => void;
};

/**
 * Étape 2 du workflow de connexion : saisie du code OTP à 6 chiffres,
 * affichée automatiquement après l'étape 1 (RequestOtpForm). Compte à
 * rebours de 60 secondes avant de pouvoir renvoyer un code — le lien
 * "Renvoyer un code" reste désactivé jusqu'à expiration. Une vérification
 * réussie (POST /auth/verify-otp) stocke la session (lib/session.ts) et
 * redirige vers le dashboard.
 */
export default function VerifyOtpForm({ identifier, onVerified }: VerifyOtpFormProps) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
    mode: "onChange", // validation en temps réel (requis)
  });

  // Focus automatique sur le champ à l'affichage de cette étape.
  useEffect(() => {
    setFocus("code");
  }, [setFocus]);

  // Compte à rebours de 60 secondes avant de pouvoir renvoyer un code.
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const canResend = secondsLeft === 0;

  const onSubmit = async (values: VerifyOtpFormValues) => {
    setFormError(null);

    try {
      const result = await verifyOtp(identifier, values.code);
      setSession(result);
      onVerified(values);
      router.push("/dashboard");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Impossible de contacter le serveur. Réessayez."));
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setFormError(null);

    try {
      await requestOtp(identifier);
      reset({ code: "" });
      setSecondsLeft(RESEND_DELAY_SECONDS);
      setFocus("code");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Impossible de contacter le serveur. Réessayez."));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <p className="text-body-secondary small mb-3">
        Un code de connexion a été envoyé à <strong>{identifier}</strong>.
      </p>

      {formError && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      <TextField
        id="code"
        label="Code de vérification"
        inputMode="numeric"
        maxLength={OTP_LENGTH}
        autoComplete="one-time-code"
        error={errors.code?.message}
        registration={register("code")}
      />

      <p className="small mb-4" aria-live="polite">
        {canResend ? (
          "Vous pouvez redemander un code."
        ) : (
          <>
            Ce code expire dans <strong>{secondsLeft}</strong> seconde
            {secondsLeft > 1 ? "s" : ""}.
          </>
        )}
      </p>

      <SubmitButton
        isSubmitting={isSubmitting}
        label="Valider"
        loadingLabel="Vérification..."
      />

      <div className="text-center mt-3">
        <button
          type="button"
          className="btn btn-link p-0 small"
          disabled={!canResend || isResending}
          aria-disabled={!canResend || isResending}
          onClick={handleResend}
        >
          {isResending ? "Envoi en cours..." : "Renvoyer un code"}
        </button>
      </div>
    </form>
  );
}
