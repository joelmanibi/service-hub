import type { Country } from "@/services/countries.service";

type CountriesTableProps = {
  countries: Country[];
  onEdit: (country: Country) => void;
  onDelete: (country: Country) => void;
};

/**
 * Table Bootstrap des pays (référentiel générique name/code/description).
 */
export default function CountriesTable({ countries, onEdit, onDelete }: CountriesTableProps) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Code</th>
              <th scope="col" className="d-none d-md-table-cell">
                Description
              </th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <tr key={country.id}>
                <td className="fw-semibold">{country.name}</td>
                <td>{country.code}</td>
                <td className="d-none d-md-table-cell">{country.description ?? "—"}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${country.name}`}
                      onClick={() => onEdit(country)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${country.name}`}
                      onClick={() => onDelete(country)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {countries.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-body-secondary py-4">
                  Aucun pays.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
