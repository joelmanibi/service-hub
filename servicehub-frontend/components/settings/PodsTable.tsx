import type { Pod } from "@/services/pods.service";

type PodsTableProps = {
  pods: Pod[];
  onEdit: (pod: Pod) => void;
  onDelete: (pod: Pod) => void;
};

/**
 * Table Bootstrap des pods (référentiel générique name/code/description).
 */
export default function PodsTable({ pods, onEdit, onDelete }: PodsTableProps) {
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
            {pods.map((pod) => (
              <tr key={pod.id}>
                <td className="fw-semibold">{pod.name}</td>
                <td>{pod.code}</td>
                <td className="d-none d-md-table-cell">{pod.description ?? "—"}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${pod.name}`}
                      onClick={() => onEdit(pod)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${pod.name}`}
                      onClick={() => onDelete(pod)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {pods.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-body-secondary py-4">
                  Aucun pod.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
