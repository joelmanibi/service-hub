import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — ServiceHub",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
