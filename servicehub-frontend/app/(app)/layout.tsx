import type { ReactNode } from "react";
import AppLayout from "@/components/layout/AppLayout";

/**
 * Layout de la zone applicative authentifiée (Dashboard, Catalogue,
 * Instances, Rapports, Paramètres...). Délègue toute la coquille visuelle
 * à AppLayout (Client Component) ; reste lui-même un Server Component
 * pour préserver le rendu serveur des pages qu'il enveloppe.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
