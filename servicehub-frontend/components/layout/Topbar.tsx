import Link from "next/link";
import styles from "./Topbar.module.scss";

type TopbarProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

/**
 * Barre supérieure : bouton de menu (offcanvas mobile / repli desktop),
 * notifications et profil utilisateur. Sticky (et non fixed-top) et
 * placée dans la colonne principale (AppLayout) afin de rester à côté
 * de la Sidebar plutôt que de s'étendre au-dessus d'elle. La marque
 * (logo + nom) vit dans la Sidebar elle-même. Interactions des menus
 * déroulants et de l'offcanvas déléguées au JS Boosted (data-bs-*),
 * chargé par AppLayout.
 */
export default function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  return (
    <header
      className={`navbar sticky-top border-bottom bg-white px-2 px-md-3 ${styles.topbar}`}
    >
      {/* Mobile : ouvre la sidebar en overlay (offcanvas géré par Boosted) */}
      <button
        type="button"
        className="btn btn-icon d-lg-none"
        data-bs-toggle="offcanvas"
        data-bs-target="#appSidebar"
        aria-controls="appSidebar"
        aria-label="Ouvrir la navigation"
      >
        <i className="bi bi-list fs-4" aria-hidden="true" />
      </button>

      {/* Desktop : replie/déplie la sidebar (état React, AppLayout) */}
      <button
        type="button"
        className="btn btn-icon d-none d-lg-inline-flex"
        onClick={onToggleSidebar}
        aria-pressed={sidebarCollapsed}
        aria-label={
          sidebarCollapsed ? "Déplier la navigation" : "Replier la navigation"
        }
      >
        <i className="bi bi-list fs-4" aria-hidden="true" />
      </button>

      <div className="d-flex align-items-center gap-1 gap-md-2 ms-auto">
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-icon"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            aria-label="Notifications"
          >
            <i className="bi bi-bell fs-5" aria-hidden="true" />
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <h2 className="dropdown-header h6 mb-0">Notifications</h2>
            </li>
            <li>
              <span className="dropdown-item-text text-body-secondary small">
                Aucune notification pour l&apos;instant.
              </span>
            </li>
          </ul>
        </div>

        <div className="dropdown">
          <button
            type="button"
            className="btn btn-icon dropdown-toggle d-flex align-items-center gap-2"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="bi bi-person-circle fs-5" aria-hidden="true" />
            <span className="d-none d-md-inline">Mon compte</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <Link className="dropdown-item" href="/profile">
                Profil
              </Link>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <Link className="dropdown-item" href="/login">
                Déconnexion
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
