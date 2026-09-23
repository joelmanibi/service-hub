import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.scss";

const PLACEHOLDER_NAV_LINKS = ["Documentation", "Aide"] as const;

/**
 * Barre de navigation du site public — catalogue interne accessible
 * sans authentification : jamais d'avatar, de profil ni d'espace
 * personnel ici. "Documentation"/"Aide" n'ont pas encore de page
 * dédiée : affichées comme entrées désactivées plutôt que des liens
 * morts (`href="#"`).
 */
export default function Header() {
  return (
    <header className={`navbar navbar-expand bg-white border-bottom ${styles.header}`}>
      <div className="container-fluid px-3 px-lg-4">
        <Link href="/" className={`navbar-brand d-flex align-items-center gap-2 fw-bold mb-0 ${styles.brand}`}>
          <Image src="/orange-logo.svg" alt="Orange" width={20} height={20} />
          ServiceHub
        </Link>

        <nav aria-label="Navigation principale">
          <ul className="nav">
            <li className="nav-item">
              <Link href="/" className={`nav-link fw-semibold ${styles.activeLink}`} aria-current="page">
                Catalogue
              </Link>
            </li>
            {PLACEHOLDER_NAV_LINKS.map((label) => (
              <li className="nav-item d-none d-sm-block" key={label}>
                <span className="nav-link disabled" aria-disabled="true">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
