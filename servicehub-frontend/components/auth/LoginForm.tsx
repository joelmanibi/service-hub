"use client";

import { useState } from "react";
import AuthCard from "./AuthCard";
import AuthHeader from "./AuthHeader";
import RequestOtpForm from "./RequestOtpForm";
import VerifyOtpForm from "./VerifyOtpForm";

type Step = "identifier" | "otp";

/**
 * Page de connexion, en deux étapes : saisie du login/email
 * (RequestOtpForm) puis, automatiquement, saisie du code OTP reçu par
 * email (VerifyOtpForm). L'état de l'étape courante et l'identifiant
 * saisi vivent ici, partagés entre les deux formulaires. Aucune API
 * connectée : chaque étape simule sa propre soumission.
 */
export default function LoginForm() {
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");

  if (step === "otp") {
    return (
      <AuthCard>
        <AuthHeader
          title="Vérification"
          subtitle="Saisissez le code reçu par email pour finaliser la connexion."
        />
        <VerifyOtpForm identifier={identifier} onVerified={() => {}} />
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Connexion"
        subtitle="Saisissez votre login ou votre email pour recevoir un code de connexion."
      />
      <RequestOtpForm
        onOtpRequested={(value) => {
          setIdentifier(value);
          setStep("otp");
        }}
      />
    </AuthCard>
  );
}
