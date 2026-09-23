"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  // Libellé d'une option représentant la valeur "" (ex: "Tous", "Aucun",
  // "Sélectionner..."), affichée en tête de liste — omise, aucune option
  // ne représente l'absence de sélection (l'utilisateur doit en choisir une).
  emptyOptionLabel?: string;
  noResultsLabel?: string;
  isInvalid?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Select à recherche instantanée (combobox) : remplace un `<select>`
 * natif Boosted dès que la liste d'options devient longue (le Service du
 * catalogue en particulier dépasse la centaine d'entrées — cf.
 * InstanceFormModal.tsx). Recherche "contient" (comme GlobalSearch),
 * insensible à la casse. À l'ouverture (focus/clic), la saisie repart
 * de zéro et affiche toutes les options — pas de pré-remplissage avec le
 * libellé sélectionné, pour garder le composant simple et prévisible.
 * `value`/`onChange` suivent la même forme qu'un `<select>` contrôlé
 * (chaîne, "" pour aucune sélection) : s'intègre à react-hook-form via
 * `Controller` (le champ n'est pas un <select> natif, `register` seul ne
 * suffit pas) exactement là où un `<select>` simple utilisait
 * `{...register(name)}`.
 */
export default function SearchableSelect({
  id,
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Rechercher...",
  emptyOptionLabel,
  noResultsLabel = "Aucun résultat",
  isInvalid = false,
  disabled = false,
  ariaLabel,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const allOptions = useMemo<SearchableSelectOption[]>(
    () => (emptyOptionLabel !== undefined ? [{ value: "", label: emptyOptionLabel }, ...options] : options),
    [options, emptyOptionLabel]
  );

  const filteredOptions = useMemo(() => {
    if (query === "") return allOptions;
    const needle = normalize(query);
    return allOptions.filter((option) => normalize(option.label).includes(needle));
  }, [allOptions, query]);

  const selectedOption = allOptions.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return;

    function handleDocumentMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [isOpen]);

  const open = () => {
    if (disabled) return;
    setQuery("");
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const selectOption = (option: SearchableSelectOption) => {
    onChange(option.value);
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "Enter") {
        event.preventDefault();
        open();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option) selectOption(option);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="position-relative" ref={containerRef}>
      <div className="input-group">
        <input
          id={id}
          type="text"
          role="combobox"
          className={`form-control${isInvalid ? " is-invalid" : ""}`}
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={isInvalid ? "true" : "false"}
          aria-label={ariaLabel}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={isOpen ? query : (selectedOption?.label ?? "")}
          onFocus={open}
          onClick={open}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setIsOpen(false);
            setQuery("");
            onBlur?.();
          }}
        />
        <span className="input-group-text bg-white">
          <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true" />
        </span>
      </div>

      {isOpen && (
        <ul
          id={listId}
          role="listbox"
          className="dropdown-menu show w-100 shadow-sm p-0"
          style={{ maxHeight: "16rem", overflowY: "auto" }}
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-body-secondary small">{noResultsLabel}</li>
          ) : (
            filteredOptions.map((option, index) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  className={`dropdown-item${index === highlightedIndex ? " active" : ""}${
                    option.value === value ? " fw-semibold" : ""
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
