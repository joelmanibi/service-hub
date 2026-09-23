import type { Metadata } from "next";
import DashboardPageClient from "@/components/dashboard/DashboardPageClient";

export const metadata: Metadata = {
  title: "Dashboard — ServiceHub",
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
