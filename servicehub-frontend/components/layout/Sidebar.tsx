"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.scss";

type SidebarProps = {
  collapsed: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
  { href: "/catalog", label: "Catalogue", icon: "bi-hdd-network" },
  { href: "/services", label: "Services", icon: "bi-grid" },
  { href: "/reports", label: "Rapports", icon: "bi-bar-chart" },
  { href: "/clients", label: "Clients", icon: "bi-building" },
  { href: "/users", label: "Utilisateurs", icon: "bi-people" },
  { href: "/settings", label: "Paramètres", icon: "bi-gear" },
];

/**
 * Navigation principale de l'application. Recouvrement plein écran sous
 * le breakpoint lg (offcanvas Boosted, piloté par data-bs-* dans
 * Topbar), rail fixe repliable en icônes seules à partir de lg (état
 * `collapsed`, contrôlé par AppLayout). Le bloc marque vit dans la
 * Sidebar elle-même (au-dessus de offcanvas-header, qui est masqué par
 * Boosted en desktop) afin de rester visible dans les deux modes ; la
 * bascule de repli vit dans la Topbar.
 */
export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={`offcanvas-lg offcanvas-start bg-white border-end ${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      tabIndex={-1}
      id="appSidebar"
      aria-label="Navigation"
    >
      <div className={`d-flex align-items-center gap-2 p-2 p-lg-3 border-bottom ${styles.brandRow}`}>
        <Link
          href="/dashboard"
          className="d-flex align-items-center gap-2 text-body text-decoration-none"
        >
          <Image src="/orange-logo.svg" alt="Orange" width={40} height={40} />
          <span className={`fw-bold ${styles.navLabel}`}>ServiceHub</span>
        </Link>
      </div>

      <div className="offcanvas-header d-lg-none">
        <span className="offcanvas-title h6 mb-0">Navigation</span>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="offcanvas"
          data-bs-target="#appSidebar"
          aria-label="Fermer"
        />
      </div>

      <div className="offcanvas-body p-2 p-lg-3">
        <nav aria-label="Navigation principale">
          <ul className="nav nav-pills flex-column gap-1">
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const isActive = pathname === href || pathname?.startsWith(`${href}/`);

              return (
                <li className="nav-item" key={href}>
                  <Link
                    href={href}
                    className={`nav-link d-flex align-items-center gap-2 ${isActive ? "active" : "text-body"}`}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={label}
                    title={label}
                  >
                    <i className={`bi ${icon} fs-5`} aria-hidden="true" />
                    <span className={styles.navLabel}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
