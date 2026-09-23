import Link from "next/link";

/**
 * Lien de retour vers la connexion, partagé par ForgotPasswordForm et
 * ResetPasswordForm (contenu type d'un AuthFooter).
 */
export default function BackToLoginLink() {
  return (
    <Link href="/login" className="link-primary small">
      Retour à la connexion
    </Link>
  );
}
