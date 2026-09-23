"use client";

import { useEffect, useRef, useState } from "react";

type GlobalSearchProps = {
  id?: string;
  placeholder?: string;
  debounceMs?: number;
  onSearch?: (value: string) => void;
  className?: string;
};

/**
 * Barre de recherche globale réutilisable (utilisée par Topbar, mais
 * indépendante de son contexte : dimensionnement délégué au parent via
 * `className`). La saisie est debouncée avant d'appeler `onSearch` —
 * aucune requête API n'est effectuée ici, uniquement le déclenchement
 * différé, prêt à être branché plus tard (services/*).
 */
export default function GlobalSearch({
  id = "global-search",
  placeholder = "Rechercher un service, une instance, un pays...",
  debounceMs = 300,
  onSearch,
  className = "",
}: GlobalSearchProps) {
  const [value, setValue] = useState("");
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchRef.current?.(value);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, debounceMs]);

  return (
    <form
      className={className}
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <label htmlFor={id} className="visually-hidden">
        Rechercher
      </label>
      <div className="input-group">
        <span className="input-group-text bg-white border-end-0">
          <i className="bi bi-search" aria-hidden="true" />
        </span>
        <input
          id={id}
          type="search"
          className="form-control border-start-0"
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
    </form>
  );
}
