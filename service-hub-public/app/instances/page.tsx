import { getPublicInstances } from "@/lib/publicApi";
import InstanceCatalogView from "../_components/InstanceCatalogView";

export default async function InstancesPage() {
  let instances: Awaited<ReturnType<typeof getPublicInstances>> = [];
  let loadError = false;

  try {
    instances = await getPublicInstances();
  } catch {
    loadError = true;
  }

  return <InstanceCatalogView instances={instances} loadError={loadError} />;
}
