"use client";

import { useState } from "react";

export type FilterOption = {
  label: string;
  count: number;
};

type FilterSectionProps = {
  title: string;
  idPrefix: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (label: string) => void;
  defaultOpen?: boolean;
};

/**
 * Section de filtre dépliante (case à cocher + compteur), pour la
 * colonne latérale du catalogue et de la page détail d'un service.
 * Pilotée par l'état React, sans dépendance au JS de Boosted. Ne
 * s'affiche pas s'il n'y a aucune option (rien à filtrer).
 */
export default function FilterSection({
  title,
  idPrefix,
  options,
  selected,
  onToggle,
  defaultOpen = false,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (options.length === 0) {
    return null;
  }

  const listId = `${idPrefix}-filter-list`;

  return (
    <div className="mb-3">
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none text-body d-flex align-items-center gap-2 mb-2"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={listId}
      >
        <span className="small fw-semibold text-body-secondary text-uppercase">{title}</span>
        <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <ul id={listId} className="list-unstyled d-flex flex-column gap-2 mb-0">
          {options.map((option) => {
            const inputId = `${idPrefix}-${option.label}`;

            return (
              <li key={option.label}>
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <div className="form-check mb-0">
                    <input
                      id={inputId}
                      type="checkbox"
                      className="form-check-input"
                      checked={selected.includes(option.label)}
                      onChange={() => onToggle(option.label)}
                    />
                    <label className="form-check-label" htmlFor={inputId}>
                      {option.label}
                    </label>
                  </div>
                  <span className="badge rounded-pill text-bg-secondary">{option.count}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
