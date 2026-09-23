import type { Metadata } from "next";
import CatalogPageClient from "@/components/catalog/CatalogPageClient";

export const metadata: Metadata = {
  title: "Services — ServiceHub",
};

export default function ServicesPage() {
  return <CatalogPageClient />;
}
