import Link from "next/link";
import type { PublicInstance } from "@/lib/publicApi";
import { MetaRow } from "./ServiceCard";
import { getStatusDotVariant } from "./instanceStatus";
import styles from "./ServiceCard.module.scss";

type InstanceCardProps = {
  instance: PublicInstance;
  // Affiche le service de l'instance (page "Instances", tous services
  // confondus) — redondant sur la page d'un service.
  showService?: boolean;
};

/**
 * Carte d'instance (résumé anonymisé — cf. lib/publicApi.ts), dans le
 * même gabarit visuel que ServiceCard : icône + statut en en-tête, nom,
 * puis métadonnées (Pod, Pays, Environnement, Hébergement). Cliquable
 * (lien étiré sur le titre) vers la fiche détaillée de l'instance
 * (`/services/[id]/instances/[instanceId]`).
 */
export default function InstanceCard({ instance, showService = false }: InstanceCardProps) {
  const href = instance.service ? `/services/${instance.service.id}/instances/${instance.id}` : null;

  return (
    <div className={`card h-100 border-0 shadow-sm ${styles.card}`}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center gap-2 mb-3">
          <span
            aria-hidden="true"
            className={`rounded-2 d-inline-flex align-items-center justify-content-center text-bg-dark ${styles.logo}`}
          >
            <i className="bi bi-hdd-network fs-5" aria-hidden="true" />
          </span>

          {instance.statutInstance && (
            <span className="badge rounded-pill bg-body-tertiary text-body-secondary text-nowrap ms-auto d-inline-flex align-items-center gap-1">
              <span
                className={`rounded-circle bg-${getStatusDotVariant(instance.statutInstance.name)}`}
                style={{ width: "0.5rem", height: "0.5rem", flex: "0 0 auto" }}
                aria-hidden="true"
              />
              {instance.statutInstance.name}
            </span>
          )}
        </div>

        <h2 className={`fw-semibold mb-2 ${styles.cardTitle}`}>
          {href ? (
            <Link href={href} className="stretched-link text-reset text-decoration-none">
              {instance.name}
            </Link>
          ) : (
            instance.name
          )}
        </h2>

        <hr className="my-2" />

        <div className="d-flex flex-column gap-2 mb-2">
          {showService && (
            <MetaRow icon="bi-grid" label="Service" items={instance.service ? [instance.service] : []} />
          )}
          <MetaRow icon="bi-collection" label="Pod" items={instance.pod ? [instance.pod] : []} />
          <MetaRow icon="bi-geo-alt" label="Pays" items={instance.country ? [instance.country] : []} />
          <MetaRow icon="bi-layers" label="Environnement" items={instance.environments} />
          <MetaRow icon="bi-server" label="Hébergement" items={instance.hostings} />
          <MetaRow icon="bi-cpu" label="Plateforme" items={instance.platforms} />
        </div>

        <hr className="my-2" />

        <span className="text-primary small fw-semibold d-inline-flex align-items-center gap-1 mt-auto align-self-end">
          Voir la fiche
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
