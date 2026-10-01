import type { ReactNode } from "react";
import Link from "next/link";
import type {
  PublicInstanceComposant,
  PublicInstanceDetail,
  PublicInstanceSupportLevel,
  PublicReferenceItem,
  SensitiveResult,
} from "@/lib/publicApi";
import { API_ORIGIN } from "@/lib/publicApi";
import Header from "./Header";
import LockedContent from "./LockedContent";
import { getStatusDotVariant } from "./instanceStatus";
import styles from "./InstanceDetailView.module.scss";

type InstanceDetailViewProps = {
  instance: PublicInstanceDetail;
  // null : visiteur non connecté. Sinon, résultat de la lecture des
  // informations sensibles avec la session courante.
  sensitive: SensitiveResult | null;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function Empty({ children = "Non renseigné" }: { children?: ReactNode }) {
  return <span className="fst-italic text-body-tertiary fw-normal">{children}</span>;
}

type SectionCardProps = {
  icon: string;
  title: string;
  count?: number;
  children: ReactNode;
};

function SectionCard({ icon, title, count, children }: SectionCardProps) {
  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className={`rounded-2 d-inline-flex align-items-center justify-content-center ${styles.sectionIcon}`}>
            <i className={`bi ${icon}`} aria-hidden="true" />
          </span>
          <h2 className={`fw-semibold mb-0 ${styles.sectionTitle}`}>{title}</h2>
          {count !== undefined && (
            <span className="badge rounded-pill bg-body-tertiary text-body-secondary">{count}</span>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

type FactProps = {
  icon: string;
  label: string;
  value: ReactNode;
  media?: ReactNode;
};

function Fact({ icon, label, value, media }: FactProps) {
  return (
    <div className={`d-flex align-items-center gap-3 ${styles.fact}`}>
      {media ?? (
        <span
          className={`rounded-2 d-inline-flex align-items-center justify-content-center text-body-secondary ${styles.factIcon}`}
          aria-hidden="true"
        >
          <i className={`bi ${icon}`} />
        </span>
      )}
      <div style={{ minWidth: 0 }}>
        <div className={`text-uppercase fw-semibold text-body-secondary ${styles.factLabel}`}>{label}</div>
        <div className="fw-semibold text-truncate">{value}</div>
      </div>
    </div>
  );
}

function ChipList({ items }: { items: PublicReferenceItem[] }) {
  if (items.length === 0) {
    return <Empty />;
  }

  return (
    <div className="d-flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item.id} className={`badge rounded-pill ${styles.chip}`}>
          {item.name}
        </span>
      ))}
    </div>
  );
}

type DeploymentRowProps = {
  icon: string;
  label: string;
  items: PublicReferenceItem[];
};

function DeploymentRow({ icon, label, items }: DeploymentRowProps) {
  return (
    <div className="d-flex flex-column flex-sm-row gap-2 py-3">
      <div className={`d-flex align-items-center gap-2 small text-body-secondary ${styles.rowLabel}`}>
        <i className={`bi ${icon}`} aria-hidden="true" />
        {label}
      </div>
      <div className="flex-fill">
        <ChipList items={items} />
      </div>
    </div>
  );
}

function ComposantList({ composants }: { composants: PublicInstanceComposant[] }) {
  if (composants.length === 0) {
    return (
      <p className="small mb-0">
        <Empty>Aucun composant déclaré pour cette instance.</Empty>
      </p>
    );
  }

  return (
    <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
      {composants.map((composant) => (
        <li key={composant.id} className={styles.composant}>
          <div className="d-flex align-items-start gap-3">
            <span
              className={`rounded-2 d-inline-flex align-items-center justify-content-center text-body-secondary ${styles.composantIcon}`}
              aria-hidden="true"
            >
              <i className="bi bi-box" />
            </span>
            <div className="flex-fill" style={{ minWidth: 0 }}>
              <div className="fw-semibold">{composant.name}</div>
              <div className="small text-body-secondary">
                {composant.description || <Empty>Aucune description</Empty>}
              </div>
            </div>
            {composant.platform && (
              <span className={`badge rounded-pill text-nowrap d-inline-flex align-items-center gap-1 ${styles.chip}`}>
                <i className="bi bi-cpu" aria-hidden="true" />
                {composant.platform.name}
              </span>
            )}
          </div>

          {composant.inventaires.length > 0 && (
            <div className={`table-responsive mt-3 ${styles.inventaire}`}>
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col" className="small text-body-secondary fw-semibold">
                      Adresse IP
                    </th>
                    <th scope="col" className="small text-body-secondary fw-semibold">
                      Nom du serveur
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {composant.inventaires.map((inventaire) => (
                    <tr key={inventaire.id}>
                      <td className={`small ${styles.code}`}>{inventaire.ip}</td>
                      <td className="small">{inventaire.nomServeur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function SupportList({ supportLevels }: { supportLevels: PublicInstanceSupportLevel[] }) {
  if (supportLevels.length === 0) {
    return (
      <p className="small mb-0">
        <Empty>Aucun niveau de support défini.</Empty>
      </p>
    );
  }

  return (
    <ul className="list-unstyled mb-0">
      {supportLevels.map((assignment) => (
        <li key={assignment.id} className={`py-3 ${styles.supportItem}`}>
          <div className="fw-semibold mb-2">{assignment.supportLevel?.name ?? <Empty />}</div>
          <div className="d-flex align-items-center gap-2 small text-body-secondary mb-1">
            <i className="bi bi-person" aria-hidden="true" />
            {assignment.responsable || <Empty />}
          </div>
          <div className="d-flex align-items-center gap-2 small">
            <i className="bi bi-telephone text-body-secondary" aria-hidden="true" />
            {assignment.telephone ? (
              <a href={`tel:${assignment.telephone.replace(/\s+/g, "")}`} className="fw-semibold">
                {assignment.telephone}
              </a>
            ) : (
              <Empty />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function SensitiveUnavailable() {
  return (
    <p className="small text-body-secondary mb-0">
      <i className="bi bi-exclamation-triangle me-1" aria-hidden="true" />
      Informations momentanément indisponibles. Merci de réessayer plus tard.
    </p>
  );
}

/**
 * Fiche détaillée d'une instance (site public) : fil d'Ariane, bandeau
 * d'identité (nom, code, statut, faits clés), puis contenu principal
 * (déploiement, composants, schéma d'architecture, commentaires) et
 * colonne latérale (support, informations). Le client, les composants
 * (avec leur inventaire IP/serveurs) et les contacts de support ne sont
 * affichés qu'à un utilisateur connecté (`sensitive`) ; sinon, ces
 * sections sont verrouillées et invitent à se connecter.
 */
export default function InstanceDetailView({ instance, sensitive }: InstanceDetailViewProps) {
  const { service } = instance;
  const data = sensitive?.status === "ok" ? sensitive.data : null;
  const isLocked = !sensitive || sensitive.status === "unauthorized";
  const sessionExpired = sensitive?.status === "unauthorized";

  const renderSensitive = (content: (value: NonNullable<typeof data>) => ReactNode, description: string) => {
    if (data) return content(data);
    if (isLocked) return <LockedContent description={description} sessionExpired={sessionExpired} />;
    return <SensitiveUnavailable />;
  };
  const serviceHref = `/services/${service.id}`;
  const serviceLogoSrc = service.logoUrl ? `${API_ORIGIN}${service.logoUrl}` : null;
  const architectureSrc = instance.architectureImageUrl ? `${API_ORIGIN}${instance.architectureImageUrl}` : null;

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-fill bg-body-tertiary py-4 px-3 px-lg-5">
        <nav aria-label="Fil d'Ariane" className="mb-3">
          <ol className={`breadcrumb mb-0 ${styles.breadcrumb}`}>
            <li className="breadcrumb-item">
              <Link href="/">Catalogue</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href={serviceHref}>{service.name}</Link>
            </li>
            <li className="breadcrumb-item active text-truncate" aria-current="page">
              {instance.name}
            </li>
          </ol>
        </nav>

        <section className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row align-items-md-center gap-3 mb-4">
              <span
                className={`rounded-3 d-inline-flex align-items-center justify-content-center text-bg-dark ${styles.heroIcon}`}
                aria-hidden="true"
              >
                <i className="bi bi-hdd-network" />
              </span>

              <div className="flex-fill" style={{ minWidth: 0 }}>
                <h1 className={`fw-semibold mb-2 ${styles.heroTitle}`}>{instance.name}</h1>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className={`badge bg-body-tertiary text-body-secondary border ${styles.code}`}>
                    {instance.code}
                  </span>
                  {instance.statutInstance && (
                    <span className="badge rounded-pill bg-body-tertiary text-body d-inline-flex align-items-center gap-2 border">
                      <span
                        className={`rounded-circle bg-${getStatusDotVariant(instance.statutInstance.name)}`}
                        style={{ width: "0.5rem", height: "0.5rem" }}
                        aria-hidden="true"
                      />
                      {instance.statutInstance.name}
                    </span>
                  )}
                  {service.serviceType && (
                    <span className="badge rounded-pill bg-body-tertiary text-body-secondary">
                      {service.serviceType.name}
                    </span>
                  )}
                </div>
              </div>

              <Link
                href={serviceHref}
                className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2 align-self-start align-self-md-center"
              >
                <i className="bi bi-arrow-left" aria-hidden="true" />
                Toutes les instances
              </Link>
            </div>

            <div className={styles.factsGrid}>
              <Fact
                icon="bi-grid"
                label="Service"
                value={
                  <Link href={serviceHref} className="text-reset">
                    {service.name}
                  </Link>
                }
                media={
                  serviceLogoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element -- logo externe servi par le backend, hors domaines statiques connus de next/image
                    <img src={serviceLogoSrc} alt="" className={`rounded-2 ${styles.serviceLogo}`} />
                  ) : undefined
                }
              />
              <Fact
                icon="bi-building"
                label="Client"
                value={
                  data ? (
                    (data.client?.name ?? <Empty />)
                  ) : isLocked ? (
                    <LockedContent description="" compact />
                  ) : (
                    <Empty>Indisponible</Empty>
                  )
                }
              />
              <Fact icon="bi-geo-alt" label="Pays" value={instance.country?.name ?? <Empty />} />
              <Fact icon="bi-collection" label="Pod" value={instance.pod?.name ?? <Empty />} />
            </div>
          </div>
        </section>

        <div className={styles.layout}>
          <div className="d-flex flex-column gap-4" style={{ minWidth: 0 }}>
            <SectionCard icon="bi-diagram-3" title="Déploiement">
              <div className="d-flex flex-column">
                <DeploymentRow icon="bi-layers" label="Environnements" items={instance.environments} />
                <hr className="my-0" />
                <DeploymentRow icon="bi-server" label="Hébergements" items={instance.hostings} />
                <hr className="my-0" />
                <DeploymentRow icon="bi-hdd-network" label="Réseaux" items={instance.networks} />
              </div>
            </SectionCard>

            <SectionCard icon="bi-boxes" title="Composants & inventaire" count={data?.composants.length}>
              {renderSensitive(
                (value) => (
                  <ComposantList composants={value.composants} />
                ),
                "Connectez-vous pour afficher les composants de l'instance, leurs plateformes et leur inventaire (adresses IP, serveurs)."
              )}
            </SectionCard>

            <SectionCard icon="bi-bounding-box" title="Schéma d'architecture">
              {architectureSrc ? (
                <>
                  <div className={styles.architectureFrame}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- image externe servie par le backend, hors domaines statiques connus de next/image */}
                    <img
                      src={architectureSrc}
                      alt={`Schéma d'architecture de ${instance.name}`}
                      className={styles.architectureImage}
                    />
                  </div>
                  <div className="text-end mt-2">
                    <a
                      href={architectureSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="small fw-semibold d-inline-flex align-items-center gap-1"
                    >
                      Ouvrir en taille réelle
                      <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                    </a>
                  </div>
                </>
              ) : (
                <p className="small mb-0">
                  <Empty>Aucun schéma d&apos;architecture disponible.</Empty>
                </p>
              )}
            </SectionCard>

            <SectionCard icon="bi-chat-left-text" title="Commentaires">
              {instance.comments ? (
                <p className={`mb-0 text-body-secondary ${styles.comments}`}>{instance.comments}</p>
              ) : (
                <p className="small mb-0">
                  <Empty>Aucun commentaire.</Empty>
                </p>
              )}
            </SectionCard>
          </div>

          <aside className={`d-flex flex-column gap-4 ${styles.aside}`}>
            <SectionCard icon="bi-headset" title="Support" count={data?.supportLevels.length}>
              {renderSensitive(
                (value) => (
                  <SupportList supportLevels={value.supportLevels} />
                ),
                "Connectez-vous pour afficher les niveaux de support et leurs contacts."
              )}
            </SectionCard>

            <SectionCard icon="bi-info-circle" title="Informations">
              <dl className={`d-flex flex-column gap-2 small mb-0 ${styles.infoList}`}>
                <div className="d-flex justify-content-between gap-3">
                  <dt>Code</dt>
                  <dd className={styles.code}>{instance.code}</dd>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <dt>Produit Océane</dt>
                  <dd>{instance.produitOceane || <Empty />}</dd>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <dt>Créée le</dt>
                  <dd>{formatDate(instance.createdAt)}</dd>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <dt>Mise à jour le</dt>
                  <dd>{formatDate(instance.updatedAt)}</dd>
                </div>
              </dl>
            </SectionCard>
          </aside>
        </div>
      </main>
    </div>
  );
}
