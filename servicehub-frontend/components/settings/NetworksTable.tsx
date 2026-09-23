import type { Network } from "@/services/networks.service";

type NetworksTableProps = {
  networks: Network[];
  onEdit: (network: Network) => void;
  onDelete: (network: Network) => void;
};

/**
 * Table Bootstrap des réseaux (référentiel générique
 * name/code/description — dépendances réseau d'une Instance).
 */
export default function NetworksTable({ networks, onEdit, onDelete }: NetworksTableProps) {
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
            {networks.map((network) => (
              <tr key={network.id}>
                <td className="fw-semibold">{network.name}</td>
                <td>{network.code}</td>
                <td className="d-none d-md-table-cell">{network.description ?? "—"}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${network.name}`}
                      onClick={() => onEdit(network)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${network.name}`}
                      onClick={() => onDelete(network)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {networks.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-body-secondary py-4">
                  Aucun réseau.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
