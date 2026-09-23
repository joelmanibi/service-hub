import { getPublicServices } from "@/lib/publicApi";
import CatalogView from "./_components/CatalogView";

export default async function Home() {
  let services: Awaited<ReturnType<typeof getPublicServices>> = [];
  let loadError = false;

  try {
    services = await getPublicServices();
  } catch {
    loadError = true;
  }

  return <CatalogView services={services} loadError={loadError} />;
}
