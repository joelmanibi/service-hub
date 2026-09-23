"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AuthCard from "./AuthCard";
import AuthHeader from "./AuthHeader";
import AuthFooter from "./AuthFooter";
import BackToLoginLink from "./BackToLoginLink";
import TextField from "./TextField";
import SubmitButton from "./SubmitButton";
import { simulateAuthSubmit } from "./simulateAuthSubmit";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Veuillez renseigner votre adresse email.")
    .email("Adresse email invalide."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onChange", // validation en temps réel (requis)
  });

  // Focus automatique sur le champ, cohérent avec la page Login.
  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  const onSubmit = (values: ForgotPasswordFormValues) =>
    simulateAuthSubmit(values);

  return (
    <AuthCard>
      <AuthHeader
        title="Mot de passe oublié"
        subtitle="Saisissez votre adresse email."
      />

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register("email")}
        />

        <SubmitButton
          isSubmitting={isSubmitting}
          label="Envoyer"
          loadingLabel="Envoi en cours..."
        />

        <AuthFooter>
          <BackToLoginLink />
        </AuthFooter>
      </form>
    </AuthCard>
  );
}
