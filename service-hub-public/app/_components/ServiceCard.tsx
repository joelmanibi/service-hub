import Link from "next/link";
import type { PublicReferenceItem, PublicService } from "@/lib/publicApi";
import { API_ORIGIN } from "@/lib/publicApi";
import styles from "./ServiceCard.module.scss";

type ServiceCardProps = {
  service: PublicService;
};

// Un service peut porter plusieurs Clients/Plateformes/Hébergements
// (dédupliqués depuis ses Instances — cf. lib/publicApi.ts). Jamais de
// valeur inventée : liste réelle jointe, ou "—" si aucune donnée.
function formatMetaValue(items: PublicReferenceItem[]): string {
  return items.length > 0 ? items.map((item) => item.name).join(", ") : "—";
}

// Repli quand le service n'a pas de logo (service.logoUrl absent) —
// initiale(s) dérivées du nom réel, jamais une valeur inventée.
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

// Couleur de fond de l'avatar (repli sans logo) déterministe par
// service — même service = même couleur à chaque rendu, pas un vrai
// tirage aléatoire. "primary"/orange exclu (réservé au CTA "Voir le
// service", une seule couleur forte par carte) et "secondary" exclu
// (vaut #000 dans ce thème Boosted, cf. correctif précédent).
const AVATAR_VARIANTS = ["success", "info", "danger", "warning", "dark"] as const;

function avatarVariantFromSeed(seed: string): (typeof AVATAR_VARIANTS)[number] {
  const sum = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_VARIANTS[sum % AVATAR_VARIANTS.length];
}

type MetaRowProps = {
  icon: string;
  label: string;
  items: PublicReferenceItem[];
};

function MetaRow({ icon, label, items }: MetaRowProps) {
  const value = formatMetaValue(items);

  return (
    <div className="d-flex align-items-center gap-2 small">
      <i className={`bi ${icon} text-body-secondary`} aria-hidden="true" />
      <span className="text-body-secondary" style={{ minWidth: "6rem" }}>
        {label}
      </span>
      <span className="text-truncate fw-medium" title={value !== "—" ? value : undefined}>
        {value}
      </span>
    </div>
  );
}

/**
 * Fiche synthétique d'un service : logo (si disponible) + type en
 * en-tête, nom, description, puis les métadonnées réellement
 * disponibles (Client, Plateforme, Hébergement — dérivées des
 * Instances du service). Seule la présentation change : mêmes champs
 * de `PublicService`, même route de destination (`/services/[id]`) via
 * le lien étiré sur le titre.
 */
export default function ServiceCard({ service }: ServiceCardProps) {
  const logoSrc = service.logoUrl ? `${API_ORIGIN}${service.logoUrl}` : null;
  const avatarVariant = avatarVariantFromSeed(service.code || service.name);

  return (
    <div className={`card h-100 border-0 shadow-sm ${styles.card}`}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center gap-2 mb-3">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo externe servi par le backend, hors domaines statiques connus de next/image
            <img src={logoSrc} alt="" className={`rounded-2 ${styles.logo}`} />
          ) : (
            <span
              aria-hidden="true"
              className={`rounded-2 d-inline-flex align-items-center justify-content-center fw-semibold text-bg-${avatarVariant} ${styles.logo} ${styles.avatar}`}
            >
              {initialsOf(service.name)}
            </span>
          )}

          {service.serviceType && (
            <span className="badge rounded-pill bg-body-tertiary text-body-secondary text-nowrap ms-auto">
              {service.serviceType.name}
            </span>
          )}
        </div>

        <h2 className={`fw-semibold mb-2 ${styles.cardTitle}`}>
          <Link href={`/services/${service.id}`} className="stretched-link text-reset text-decoration-none">
            {service.name}
          </Link>
        </h2>

        <p className={`small mb-3 ${styles.description} ${service.description ? "text-body-secondary" : "fst-italic text-body-tertiary"}`}>
          {service.description || "Aucune description disponible pour ce service."}
        </p>

        <hr className="my-2" />

        <div className="d-flex flex-column gap-2 mb-2">
          <MetaRow icon="bi-building" label="Client" items={service.clients} />
          <MetaRow icon="bi-diagram-3" label="Plateforme" items={service.platforms} />
          <MetaRow icon="bi-server" label="Hébergement" items={service.hostings} />
        </div>

        <hr className="my-2" />

        <span className="text-primary small fw-semibold d-inline-flex align-items-center gap-1 mt-auto align-self-end">
          Voir le service
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
