"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "../_actions/auth";
import { useSession } from "./SessionProvider";
import styles from "./Header.module.scss";

const PLACEHOLDER_NAV_LINKS = ["Documentation", "Aide"] as const;

// "Catalogue" couvre aussi les pages d'un service et ses fiches d'instance
// (/services/...) ; "Instances" la liste globale (/instances).
const NAV_LINKS = [
  { href: "/", label: "Catalogue", isActive: (path: string) => path === "/" || path.startsWith("/services") },
  { href: "/instances", label: "Instances", isActive: (path: string) => path.startsWith("/instances") },
] as const;

/**
 * Barre de navigation du site public — catalogue consultable sans
 * authentification ; la connexion (bouton à droite) ne sert qu'à afficher
 * les informations sensibles des fiches d'instance. "Documentation"/"Aide"
 * n'ont pas encore de page dédiée : affichées comme entrées désactivées
 * plutôt que des liens morts (`href="#"`).
 */
export default function Header() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { user, openLogin } = useSession();
  const [isLoggingOut, startLogout] = useTransition();

  const handleLogout = () => {
    startLogout(async () => {
      await logoutAction();
      router.refresh();
    });
  };

  return (
    <header className={`navbar navbar-expand bg-white border-bottom ${styles.header}`}>
      <div className="container-fluid px-3 px-lg-4">
        <Link href="/" className={`navbar-brand d-flex align-items-center gap-2 fw-bold mb-0 ${styles.brand}`}>
          <Image src="/orange-logo.svg" alt="Orange" width={20} height={20} />
          ServiceHub
        </Link>

        <nav aria-label="Navigation principale">
          <ul className="nav">
            {NAV_LINKS.map(({ href, label, isActive }) => {
              const active = isActive(pathname);

              return (
                <li className="nav-item" key={href}>
                  <Link
                    href={href}
                    className={`nav-link fw-semibold ${active ? styles.activeLink : "text-body"}`}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            {PLACEHOLDER_NAV_LINKS.map((label) => (
              <li className="nav-item d-none d-sm-block" key={label}>
                <span className="nav-link disabled" aria-disabled="true">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="d-flex align-items-center gap-2 ms-auto ms-sm-3">
          {user ? (
            <>
              <span className="small text-body-secondary d-none d-md-inline-flex align-items-center gap-1 text-truncate">
                <i className="bi bi-person-check text-success" aria-hidden="true" />
                {user.email}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                ) : (
                  <i className="bi bi-box-arrow-right" aria-hidden="true" />
                )}
                <span className="d-none d-sm-inline">Se déconnecter</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
              onClick={openLogin}
            >
              <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
              <span className="d-none d-sm-inline">Se connecter</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
