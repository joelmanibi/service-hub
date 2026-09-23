import type { SupportLevel } from "@/services/supportLevels.service";

type SupportLevelsTableProps = {
  supportLevels: SupportLevel[];
  onEdit: (supportLevel: SupportLevel) => void;
  onDelete: (supportLevel: SupportLevel) => void;
};

/**
 * Table Bootstrap des niveaux de support (référentiel générique
 * name/code/description).
 */
export default function SupportLevelsTable({ supportLevels, onEdit, onDelete }: SupportLevelsTableProps) {
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
            {supportLevels.map((supportLevel) => (
              <tr key={supportLevel.id}>
                <td className="fw-semibold">{supportLevel.name}</td>
                <td>{supportLevel.code}</td>
                <td className="d-none d-md-table-cell">{supportLevel.description ?? "—"}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${supportLevel.name}`}
                      onClick={() => onEdit(supportLevel)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${supportLevel.name}`}
                      onClick={() => onDelete(supportLevel)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {supportLevels.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-body-secondary py-4">
                  Aucun niveau de support.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
