import type { ReactNode } from "react";

/**
 * Carte Boosted commune à toutes les pages d'authentification
 * (Login, Forgot Password, Reset Password).
 */
export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4 p-md-5">{children}</div>
    </div>
  );
}
