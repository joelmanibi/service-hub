import type { Metadata } from "next";
import ClientsPageClient from "@/components/clients/ClientsPageClient";

export const metadata: Metadata = {
  title: "Clients — ServiceHub",
};

export default function ClientsPage() {
  return <ClientsPageClient />;
}
