import { notFound } from "next/navigation";
import { getPublicServiceInstance, getPublicServiceInstanceSensitive, type SensitiveResult } from "@/lib/publicApi";
import { getSession } from "@/lib/session";
import InstanceDetailView from "../../../../_components/InstanceDetailView";

type InstanceDetailPageProps = {
  params: Promise<{ id: string; instanceId: string }>;
};

export default async function InstanceDetailPage({ params }: InstanceDetailPageProps) {
  const { id, instanceId } = await params;
  const [instance, session] = await Promise.all([getPublicServiceInstance(id, instanceId), getSession()]);

  if (!instance) {
    notFound();
  }

  // Informations sensibles récupérées côté serveur, uniquement avec une
  // session valide : sans connexion, elles ne figurent pas dans la page.
  const sensitive: SensitiveResult | null = session
    ? await getPublicServiceInstanceSensitive(id, instanceId, session.accessToken)
    : null;

  return <InstanceDetailView instance={instance} sensitive={sensitive} />;
}
