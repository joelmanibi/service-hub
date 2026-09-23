import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceHub — Catalogue des services",
  description: "Découvrez l'ensemble des services exploité par le GOS",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body className="d-flex flex-column min-vh-100">{children}</body>
    </html>
  );
}
