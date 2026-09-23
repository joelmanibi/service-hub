import type { ManagedClient, ReferenceItem } from "./clientTypes";

type ClientsTableProps = {
  clients: ManagedClient[];
  typeClients: ReferenceItem[];
  countries: ReferenceItem[];
  onEdit: (client: ManagedClient) => void;
  onDelete: (client: ManagedClient) => void;
};

/**
 * Table Bootstrap des clients. Le backend ne renvoie que les clés
 * étrangères brutes (typeClientId, countryId) : les libellés sont
 * résolus ici à partir des référentiels chargés par ClientsPageClient
 * (évite un aller-retour API supplémentaire par ligne).
 */
export default function ClientsTable({ clients, typeClients, countries, onEdit, onDelete }: ClientsTableProps) {
  const typeClientById = new Map(typeClients.map((item) => [item.id, item.name]));
  const countryById = new Map(countries.map((item) => [item.id, item.name]));

  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Code</th>
              <th scope="col">Type de client</th>
              <th scope="col" className="d-none d-md-table-cell">
                Pays
              </th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="fw-semibold">{client.name}</td>
                <td>{client.code}</td>
                <td>{typeClientById.get(client.typeClientId) ?? "—"}</td>
                <td className="d-none d-md-table-cell">
                  {client.countryId ? (countryById.get(client.countryId) ?? "—") : "—"}
                </td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${client.name}`}
                      onClick={() => onEdit(client)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${client.name}`}
                      onClick={() => onDelete(client)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-body-secondary py-4">
                  Aucun client.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
