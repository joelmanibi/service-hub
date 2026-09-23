import type { ManagedInstance } from "@/services/instances.service";
import type { CatalogService } from "@/services/catalog.service";
import StatusDot from "@/components/common/StatusDot";

type InstancesTableProps = {
  instances: ManagedInstance[];
  services: CatalogService[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onView: (instance: ManagedInstance) => void;
  onEdit: (instance: ManagedInstance) => void;
  onDelete: (instance: ManagedInstance) => void;
};

/**
 * Table Bootstrap des instances. Le backend ne renvoie que la clé
 * étrangère brute `serviceId` (pas d'objet `service` imbriqué) : le
 * libellé est résolu ici à partir du référentiel catalog/services chargé
 * par InstancesPageClient. Client, pod, statut, environnements et
 * hébergements sont déjà résolus par services/instances.service.ts. La
 * case à cocher d'en-tête sélectionne/désélectionne uniquement les
 * instances de la page courante (cf. InstancesPageClient).
 */
export default function InstancesTable({
  instances,
  services,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDelete,
}: InstancesTableProps) {
  const serviceById = new Map(services.map((service) => [service.id, service.name]));
  const allSelected = instances.length > 0 && instances.every((instance) => selectedIds.has(instance.id));

  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col" style={{ width: "2.5rem" }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  aria-label="Sélectionner toutes les instances de cette page"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th scope="col">Code</th>
              <th scope="col">Nom</th>
              <th scope="col">Client</th>
              <th scope="col">Pod</th>
              <th scope="col">Service</th>
              <th scope="col">Statut</th>
              <th scope="col" className="d-none d-lg-table-cell">
                Environnements
              </th>
              <th scope="col" className="d-none d-lg-table-cell">
                Sites d&apos;hébergement
              </th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {instances.map((instance) => (
              <tr key={instance.id} className={selectedIds.has(instance.id) ? "table-active" : undefined}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    aria-label={`Sélectionner ${instance.name}`}
                    checked={selectedIds.has(instance.id)}
                    onChange={() => onToggleSelect(instance.id)}
                  />
                </td>
                <td>{instance.code}</td>
                <td className="fw-semibold">{instance.name}</td>
                <td>{instance.clientName || "—"}</td>
                <td>{instance.podName || "—"}</td>
                <td>{serviceById.get(instance.serviceId) ?? "—"}</td>
                <td>
                  {instance.statutInstanceName ? <StatusDot label={instance.statutInstanceName} /> : "—"}
                </td>
                <td className="d-none d-lg-table-cell">
                  {instance.environmentNames.length > 0 ? instance.environmentNames.join(", ") : "—"}
                </td>
                <td className="d-none d-lg-table-cell">
                  {instance.hostingNames.length > 0 ? instance.hostingNames.join(", ") : "—"}
                </td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Voir la fiche de ${instance.name}`}
                      onClick={() => onView(instance)}
                    >
                      <i className="bi bi-eye" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${instance.name}`}
                      onClick={() => onEdit(instance)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${instance.name}`}
                      onClick={() => onDelete(instance)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {instances.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center text-body-secondary py-4">
                  Aucune instance.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
