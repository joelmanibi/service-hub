type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/**
 * Pagination Bootstrap générique, réutilisée par tous les tableaux de
 * l'application (Utilisateurs, Clients, Instances, Services, référentiels
 * Paramètres...). Ne s'affiche pas s'il n'y a qu'une seule page. Pas de
 * troncature (ellipsis) des numéros de page : les jeux de données de
 * l'application restent modestes, une liste complète de pages reste
 * lisible.
 */
export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className="d-flex justify-content-center mt-3">
      <ul className="pagination mb-0">
        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Page précédente"
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
        </li>

        {pages.map((pageNumber) => (
          <li
            key={pageNumber}
            className={`page-item ${pageNumber === page ? "active" : ""}`}
            aria-current={pageNumber === page ? "page" : undefined}
          >
            <button type="button" className="page-link" onClick={() => onPageChange(pageNumber)}>
              {pageNumber}
            </button>
          </li>
        ))}

        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Page suivante"
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
