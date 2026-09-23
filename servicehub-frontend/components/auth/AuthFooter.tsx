import type { ReactNode } from "react";

/**
 * Zone de liens secondaires sous le formulaire (ex: "Retour à la
 * connexion"), commune aux pages Forgot Password et Reset Password.
 */
export default function AuthFooter({ children }: { children: ReactNode }) {
  return <div className="mt-3 text-center small">{children}</div>;
}
