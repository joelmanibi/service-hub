import styles from "./ActiveFilters.module.scss";

export type ActiveFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

type ActiveFiltersProps = {
  chips: ActiveFilterChip[];
};

/**
 * Résumé visuel des filtres actifs sous forme de puces amovibles —
 * purement présentationnel : chaque puce rappelle le même handler de
 * bascule qui a servi à activer ce filtre (CatalogView), aucune
 * logique propre ici.
 */
export default function ActiveFilters({ chips }: ActiveFiltersProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
      <span className="small fw-semibold text-body-secondary">Filtres actifs :</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          className={`btn btn-sm rounded-pill bg-body-tertiary text-body-secondary border-0 d-inline-flex align-items-center gap-1 ${styles.chip}`}
          onClick={chip.onRemove}
          aria-label={`Retirer le filtre ${chip.label}`}
        >
          {chip.label}
          <i className="bi bi-x" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
