import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import SessionProvider from "./_components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceHub — Catalogue des services",
  description: "Découvrez l'ensemble des services exploité par le GOS",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html lang="fr">
      <body className="d-flex flex-column min-vh-100">
        <SessionProvider user={session?.user ?? null}>{children}</SessionProvider>
      </body>
    </html>
  );
}
