"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import styles from "./AppLayout.module.scss";

/**
 * Coquille applicative principale (zone authentifiée) : Sidebar
 * repliable sur toute la hauteur, à côté d'une colonne principale
 * (Topbar sticky + contenu). Composée par app/(app)/layout.tsx et
 * partagée par toutes les pages de l'application.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Charge le JS Boosted (offcanvas, menus déroulants) uniquement côté
  // client : ce bundle manipule le DOM directement et ne doit jamais
  // s'exécuter pendant le rendu serveur.
  useEffect(() => {
    import("boosted/dist/js/boosted.bundle.min.js");
  }, []);

  return (
    <div className={styles.shell}>
      <Sidebar collapsed={sidebarCollapsed} />

      <div className={styles.mainColumn}>
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        />

        <main id="main-content" className={`${styles.content} p-3 p-lg-4`}>
          {children}
        </main>
      </div>
    </div>
  );
}
