import type { ServiceType } from "@/services/serviceTypes.service";

type ServiceTypesTableProps = {
  serviceTypes: ServiceType[];
  onEdit: (serviceType: ServiceType) => void;
  onDelete: (serviceType: ServiceType) => void;
};

/**
 * Table Bootstrap des types de service (référentiel générique
 * name/code/description).
 */
export default function ServiceTypesTable({ serviceTypes, onEdit, onDelete }: ServiceTypesTableProps) {
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
            {serviceTypes.map((serviceType) => (
              <tr key={serviceType.id}>
                <td className="fw-semibold">{serviceType.name}</td>
                <td>{serviceType.code}</td>
                <td className="d-none d-md-table-cell">{serviceType.description ?? "—"}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${serviceType.name}`}
                      onClick={() => onEdit(serviceType)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${serviceType.name}`}
                      onClick={() => onDelete(serviceType)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {serviceTypes.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-body-secondary py-4">
                  Aucun type de service.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
