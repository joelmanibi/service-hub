"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AuthCard from "./AuthCard";
import AuthHeader from "./AuthHeader";
import AuthFooter from "./AuthFooter";
import BackToLoginLink from "./BackToLoginLink";
import PasswordInput from "./PasswordInput";
import SubmitButton from "./SubmitButton";
import { simulateAuthSubmit } from "./simulateAuthSubmit";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange", // validation en temps réel (requis)
  });

  // Focus automatique sur le premier champ, cohérent avec les autres pages.
  useEffect(() => {
    setFocus("password");
  }, [setFocus]);

  const onSubmit = (values: ResetPasswordFormValues) =>
    simulateAuthSubmit(values);

  return (
    <AuthCard>
      <AuthHeader
        title="Réinitialiser le mot de passe"
        subtitle="Choisissez un nouveau mot de passe pour votre compte."
      />

      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <PasswordInput
          id="password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <PasswordInput
          id="confirmPassword"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

        <SubmitButton
          isSubmitting={isSubmitting}
          label="Réinitialiser"
          loadingLabel="Réinitialisation..."
        />

        <AuthFooter>
          <BackToLoginLink />
        </AuthFooter>
      </form>
    </AuthCard>
  );
}
