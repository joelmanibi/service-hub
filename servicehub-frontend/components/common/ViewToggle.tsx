export type ViewMode = "list" | "grid";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

/**
 * Bascule liste/grille générique (groupe de boutons Boosted), réutilisable
 * par toute page proposant les deux modes d'affichage pour un même
 * tableau de données.
 */
export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="btn-group" role="group" aria-label="Mode d'affichage">
      <button
        type="button"
        className={`btn btn-outline-secondary ${value === "list" ? "active" : ""}`}
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
      >
        <i className="bi bi-list-ul" aria-hidden="true" />
        <span className="visually-hidden">Affichage en liste</span>
      </button>
      <button
        type="button"
        className={`btn btn-outline-secondary ${value === "grid" ? "active" : ""}`}
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
      >
        <i className="bi bi-grid-3x3-gap" aria-hidden="true" />
        <span className="visually-hidden">Affichage en grille</span>
      </button>
    </div>
  );
}
