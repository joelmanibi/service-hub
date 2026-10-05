"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { searchInstancesByIpAction, type IpSearchResult } from "../_actions/ipSearch";
import styles from "./IpSearchModal.module.scss";

const SEARCH_DEBOUNCE_MS = 350;

// Met en évidence la partie de l'IP qui correspond à la recherche.
function HighlightedIp({ ip, query }: { ip: string; query: string }) {
  const index = ip.toLowerCase().indexOf(query.toLowerCase());
  if (!query || index === -1) return <>{ip}</>;
  return (
    <>
      {ip.slice(0, index)}
      <mark className={styles.highlight}>{ip.slice(index, index + query.length)}</mark>
      {ip.slice(index + query.length)}
    </>
  );
}

/**
 * Fenêtre de recherche d'instances par adresse IP (utilisateurs connectés
 * uniquement — ouverte depuis l'en-tête). Recherche sur l'inventaire des
 * composants : adresse complète ou partielle ; chaque résultat mène à la
 * fiche de l'instance.
 */
export default function IpSearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<IpSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const latestQuery = useRef("");

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const term = query.trim();
    latestQuery.current = term;

    const timeoutId = setTimeout(() => {
      if (term.length < 2) {
        setResult(null);
        setError(null);
        return;
      }
      startTransition(async () => {
        const response = await searchInstancesByIpAction(term);
        // Ignore une réponse arrivée après une saisie plus récente.
        if (latestQuery.current !== term) return;
        if (response.ok) {
          setResult(response.data);
          setError(null);
        } else {
          setResult(null);
          setError(response.error);
        }
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const term = query.trim();

  return (
    <>
      <div className={styles.backdrop} aria-hidden="true" onClick={onClose} />
      <div className={styles.wrapper} role="dialog" aria-modal="true" aria-labelledby="ip-search-title">
        <div className={`card border-0 shadow ${styles.dialog}`}>
          <div className="card-body pb-2">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h2 id="ip-search-title" className="h6 fw-semibold mb-0">
                <i className="bi bi-hdd-network me-2 text-primary" aria-hidden="true" />
                Rechercher une instance par adresse IP
              </h2>
              <button type="button" className="btn-close" aria-label="Fermer" onClick={onClose} />
            </div>
            <div className="input-group">
              <span className="input-group-text bg-white">
                {isPending ? (
                  <span className="spinner-border spinner-border-sm text-secondary" aria-hidden="true" />
                ) : (
                  <i className="bi bi-search" aria-hidden="true" />
                )}
              </span>
              <input
                ref={inputRef}
                type="search"
                inputMode="decimal"
                className={`form-control ${styles.searchInput}`}
                placeholder="ex. 10.25.2.62 ou 10.25.2"
                value={query}
                onChange={(event) => setQuery(event.target.value.replace(/\s+/g, ""))}
                aria-label="Adresse IP"
                autoComplete="off"
                maxLength={45}
              />
            </div>
            <p className="small text-body-secondary mt-2 mb-0">
              Adresse complète ou partielle (IPv4 ou IPv6), recherchée dans l&apos;inventaire des composants.
            </p>
          </div>

          <div className={styles.results}>
            {error && (
              <div className="alert alert-danger small mx-3 my-2" role="alert">
                {error}
              </div>
            )}

            {!error && term.length < 2 && (
              <p className="text-center text-body-secondary small py-4 mb-0">
                <i className="bi bi-keyboard me-1" aria-hidden="true" />
                Commencez à saisir une adresse IP.
              </p>
            )}

            {result && term.length >= 2 && (
              <>
                <div className="px-3 py-2 small text-body-secondary border-top">
                  {result.total === 0
                    ? `Aucune instance ne correspond à « ${result.query} ».`
                    : `${result.total} instance${result.total > 1 ? "s" : ""} trouvée${result.total > 1 ? "s" : ""}`}
                  {result.truncated && " — résultats limités, précisez l'adresse."}
                </div>
                {result.instances.map((instance) => {
                  const href = instance.service ? `/services/${instance.service.id}/instances/${instance.id}` : null;
                  const content = (
                    <>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <span className="fw-semibold">{instance.name}</span>
                        <span className="badge bg-body-tertiary text-body-secondary border font-monospace">
                          {instance.code}
                        </span>
                        {instance.exactMatch && <span className="badge text-bg-success">IP exacte</span>}
                        {instance.statutInstance && (
                          <span className="badge rounded-pill bg-body-tertiary text-body-secondary">
                            {instance.statutInstance.name}
                          </span>
                        )}
                      </div>
                      <div className="small text-body-secondary mb-2">
                        {[instance.service?.name, instance.client?.name, instance.pod ? `POD ${instance.pod.name}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      <ul className="list-unstyled mb-0">
                        {instance.matches.map((match, index) => (
                          <li key={`${match.ip}-${index}`} className="d-flex flex-wrap gap-2 small">
                            <span className={styles.ip}>
                              <HighlightedIp ip={match.ip} query={result.query} />
                            </span>
                            <span>{match.nomServeur}</span>
                            <span className="text-body-secondary">({match.composant})</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  );

                  return href ? (
                    <Link
                      key={instance.id}
                      href={href}
                      className={`${styles.result} ${instance.exactMatch ? styles.exact : ""}`}
                      onClick={onClose}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={instance.id} className={styles.result}>
                      {content}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
