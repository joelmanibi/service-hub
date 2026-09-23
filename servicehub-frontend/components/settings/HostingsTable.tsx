import type { Hosting } from "@/services/hostings.service";

type HostingsTableProps = {
  hostings: Hosting[];
  onEdit: (hosting: Hosting) => void;
  onDelete: (hosting: Hosting) => void;
};

/**
 * Table Bootstrap des hébergements (référentiel générique
 * name/code/description) + plateformes assignées (relation many-to-many
 * vers le référentiel `Platform`, table pivot hosting_platforms).
 */
export default function HostingsTable({ hostings, onEdit, onDelete }: HostingsTableProps) {
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
              <th scope="col" className="d-none d-lg-table-cell">
                Plateformes
              </th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {hostings.map((hosting) => (
              <tr key={hosting.id}>
                <td className="fw-semibold">{hosting.name}</td>
                <td>{hosting.code}</td>
                <td className="d-none d-md-table-cell">{hosting.description ?? "—"}</td>
                <td className="d-none d-lg-table-cell">
                  {hosting.platforms.length > 0 ? (
                    <div className="d-flex flex-wrap gap-1">
                      {hosting.platforms.map((platform) => (
                        <span className="badge text-bg-secondary" key={platform.id}>
                          {platform.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${hosting.name}`}
                      onClick={() => onEdit(hosting)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${hosting.name}`}
                      onClick={() => onDelete(hosting)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {hostings.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-body-secondary py-4">
                  Aucun hébergement.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
