import { notFound } from "next/navigation";
import { getPublicService, getPublicServiceInstances } from "@/lib/publicApi";
import InstanceCatalogView from "../../_components/InstanceCatalogView";

type ServiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = await params;
  const service = await getPublicService(id);

  if (!service) {
    notFound();
  }

  let instances: Awaited<ReturnType<typeof getPublicServiceInstances>> = [];
  let loadError = false;

  try {
    instances = await getPublicServiceInstances(id);
  } catch {
    loadError = true;
  }

  return <InstanceCatalogView service={service} instances={instances} loadError={loadError} />;
}
