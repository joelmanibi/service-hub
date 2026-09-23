import styles from "./StatCard.module.scss";

export type StatCardAccent =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "secondary";

export type StatCardBadge = {
  label: string;
  variant: StatCardAccent;
};

type StatCardProps = {
  icon: string;
  title: string;
  value: string | number;
  description: string;
  accent?: StatCardAccent;
  badge?: StatCardBadge;
};

/**
 * Carte de statistique clé réutilisable (icône, titre, valeur, courte
 * description, badge optionnel) — composants Boosted uniquement.
 */
export default function StatCard({
  icon,
  title,
  value,
  description,
  accent = "primary",
  badge,
}: StatCardProps) {
  return (
    <div className={`card border-0 shadow-sm h-100 ${styles.statCard}`}>
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <span
            className={`rounded-circle d-inline-flex p-3 bg-${accent}-subtle text-${accent}`}
          >
            <i className={`bi ${icon} fs-4`} aria-hidden="true" />
          </span>

          {badge && (
            <span className={`badge text-bg-${badge.variant} rounded-pill`}>
              {badge.label}
            </span>
          )}
        </div>

        <p className={`text-body-secondary small mb-1 ${styles.label}`}>{title}</p>
        <p className={`h3 fw-bold mb-1 ${styles.value}`}>{value}</p>
        <p className="text-body-secondary small mb-0">{description}</p>
      </div>
    </div>
  );
}
