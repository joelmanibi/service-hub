import type { Metadata } from "next";
import UsersPageClient from "@/components/users/UsersPageClient";

export const metadata: Metadata = {
  title: "Utilisateurs — ServiceHub",
};

export default function UsersPage() {
  return <UsersPageClient />;
}
