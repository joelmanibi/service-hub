import type { CSSProperties } from "react";
import { ACCENT_CYCLE } from "@/lib/accentColor";
import styles from "./DistributionCard.module.scss";

export type DistributionItem = {
  key: string;
  label: string;
  value: number;
  leading?: string;
};

type DistributionCardProps = {
  title: string;
  items: DistributionItem[];
  emptyLabel?: string;
};

/**
 * Carte de répartition générique (barres proportionnelles) — remplace les
 * list-groups ad hoc (environnement, type de service) et unifie
 * CountryCard/HostingCard sous un seul composant visuel. Composants
 * Boosted uniquement, aucune librairie de graphiques.
 */
export default function DistributionCard({
  title,
  items,
  emptyLabel = "Aucune donnée disponible.",
}: DistributionCardProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white d-flex align-items-center justify-content-between">
        <h2 className="h6 mb-0">{title}</h2>
        {items.length > 0 && <span className="text-body-secondary small">{total}</span>}
      </div>

      {items.length === 0 ? (
        <div className="card-body text-body-secondary small">{emptyLabel}</div>
      ) : (
        <div className={`card-body ${styles.list}`}>
          {items.map((item, index) => {
            const percentage = Math.round((item.value / maxValue) * 100);
            const accent = ACCENT_CYCLE[index % ACCENT_CYCLE.length];
            const barStyle = {
              "--sh-bar-value": percentage,
              "--sh-bar-delay": `${index * 60}ms`,
            } as CSSProperties;

            return (
              <div className={styles.row} key={item.key}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-truncate">
                    {item.leading && (
                      <span aria-hidden="true" className="me-1">
                        {item.leading}
                      </span>
                    )}
                    {item.label}
                  </span>
                  <span className="fw-semibold ms-2">{item.value}</span>
                </div>
                <div
                  className={styles.track}
                  role="progressbar"
                  aria-label={item.label}
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className={`bg-${accent} ${styles.bar}`} style={barStyle} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
