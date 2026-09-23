import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — ServiceHub",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
