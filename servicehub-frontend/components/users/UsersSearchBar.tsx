"use client";

import { useEffect, useRef, useState } from "react";

const SEARCH_DEBOUNCE_MS = 300;

type UsersSearchBarProps = {
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
};

/**
 * Barre de recherche de la page Utilisateurs (prénom, nom, nom complet,
 * email, login, téléphone — cf. `search` de GET /users côté backend). La
 * saisie s'affiche immédiatement mais n'est transmise au parent qu'après
 * une courte pause (debounce), pour ne pas appeler l'API à chaque frappe.
 * Même principe que la recherche des instances (InstancesFilterPanel).
 */
export default function UsersSearchBar({ onSearchChange, isSearching = false }: UsersSearchBarProps) {
  const [value, setValue] = useState("");
  const onSearchChangeRef = useRef(onSearchChange);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    const timeoutId = setTimeout(() => onSearchChangeRef.current(value.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div className="flex-grow-1" style={{ minWidth: "16rem", maxWidth: "36rem" }}>
      <label htmlFor="users-search" className="visually-hidden">
        Rechercher un utilisateur
      </label>
      <div className="input-group">
        <span className="input-group-text bg-white border-end-0">
          {isSearching ? (
            <span className="spinner-border spinner-border-sm text-secondary" aria-hidden="true" />
          ) : (
            <i className="bi bi-search" aria-hidden="true" />
          )}
        </span>
        <input
          id="users-search"
          type="search"
          className="form-control border-start-0"
          placeholder="Rechercher un utilisateur (nom, email, login, téléphone)..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setValue("");
          }}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="btn btn-outline-secondary"
            aria-label="Effacer la recherche"
            onClick={() => setValue("")}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
