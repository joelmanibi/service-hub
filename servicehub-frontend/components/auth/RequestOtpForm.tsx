"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import TextField from "./TextField";
import SubmitButton from "./SubmitButton";
import { requestOtp } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/apiError";

// Aligné sur le validator Joi du backend (modules/auth/validator.js —
// requestOtpSchema) : un identifiant unique (login ou email), requis.
const requestOtpSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Veuillez renseigner votre login ou votre email.")
    .max(150),
});

export type RequestOtpFormValues = z.infer<typeof requestOtpSchema>;

type RequestOtpFormProps = {
  onOtpRequested: (identifier: string) => void;
};

/**
 * Étape 1 du workflow de connexion : saisie du login ou email, envoi du
 * code OTP via POST /auth/request-otp. Déclenche l'affichage automatique
 * de VerifyOtpForm (étape 2) via `onOtpRequested`, géré par le parent
 * (LoginForm). Le backend répond toujours de façon générique (anti-
 * énumération de comptes) : une réponse réussie ne garantit donc pas
 * que l'identifiant existe, seulement que la requête a été traitée.
 */
export default function RequestOtpForm({ onOtpRequested }: RequestOtpFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<RequestOtpFormValues>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: { identifier: "" },
    mode: "onChange", // validation en temps réel (requis)
  });

  // Focus automatique sur le champ au montage de la page.
  useEffect(() => {
    setFocus("identifier");
  }, [setFocus]);

  const onSubmit = async (values: RequestOtpFormValues) => {
    setFormError(null);

    try {
      await requestOtp(values.identifier);
      onOtpRequested(values.identifier);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Impossible de contacter le serveur. Réessayez."));
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      {formError && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      <TextField
        id="identifier"
        label="Email ou Login"
        autoComplete="username"
        error={errors.identifier?.message}
        registration={register("identifier")}
      />

      <SubmitButton
        isSubmitting={isSubmitting}
        label="Recevoir un code"
        loadingLabel="Envoi du code..."
      />
    </form>
  );
}
