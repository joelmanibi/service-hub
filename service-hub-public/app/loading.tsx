import Header from "./_components/Header";

/**
 * Squelette affiché par Next.js pendant le chargement serveur de la
 * page (`getPublicServices()` dans page.tsx) — aucun état de chargement
 * n'existait auparavant (rendu bloquant). Purement visuel, via les
 * utilitaires `.placeholder`/`.placeholder-glow` déjà fournis par
 * Boosted, sans nouvelle librairie.
 */
export default function Loading() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-fill bg-body-tertiary py-4 px-3 px-lg-5" aria-busy="true" aria-label="Chargement du catalogue">
        <div className="placeholder-glow mb-4" style={{ maxWidth: "40rem" }}>
          <span className="placeholder col-6 rounded" style={{ height: "2rem", display: "block" }} />
        </div>

        <div className="placeholder-glow mb-4">
          <span className="placeholder col-12 rounded" style={{ height: "3rem", display: "block" }} />
        </div>

        <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="col" key={index}>
              <div className="card h-100 border-0 shadow-sm placeholder-glow">
                <div className="card-body">
                  <span className="placeholder col-4 rounded mb-3" style={{ height: "1.25rem", display: "block" }} />
                  <span className="placeholder col-8 rounded mb-3" style={{ height: "1.25rem", display: "block" }} />
                  <span className="placeholder col-12 rounded mb-2" style={{ display: "block" }} />
                  <span className="placeholder col-10 rounded" style={{ display: "block" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
