import type { TypeClient } from "@/services/typeClients.service";

type TypeClientsTableProps = {
  typeClients: TypeClient[];
  onEdit: (typeClient: TypeClient) => void;
  onDelete: (typeClient: TypeClient) => void;
};

/**
 * Table Bootstrap des types de client (référentiel générique
 * name/code/description).
 */
export default function TypeClientsTable({ typeClients, onEdit, onDelete }: TypeClientsTableProps) {
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
            {typeClients.map((typeClient) => (
              <tr key={typeClient.id}>
                <td className="fw-semibold">{typeClient.name}</td>
                <td>{typeClient.code}</td>
                <td className="d-none d-md-table-cell">{typeClient.description ?? "—"}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${typeClient.name}`}
                      onClick={() => onEdit(typeClient)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${typeClient.name}`}
                      onClick={() => onDelete(typeClient)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {typeClients.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-body-secondary py-4">
                  Aucun type de client.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
