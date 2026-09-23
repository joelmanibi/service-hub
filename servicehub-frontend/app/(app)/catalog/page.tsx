import type { Metadata } from "next";
import InstancesPageClient from "@/components/instances/InstancesPageClient";

export const metadata: Metadata = {
  title: "Catalogue — ServiceHub",
};

export default function CatalogPage() {
  return <InstancesPageClient />;
}
