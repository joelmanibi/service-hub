import type { CloudServiceModel } from "@/services/cloudServiceModels.service";

type CloudServiceModelsTableProps = {
  cloudServiceModels: CloudServiceModel[];
  onEdit: (cloudServiceModel: CloudServiceModel) => void;
  onDelete: (cloudServiceModel: CloudServiceModel) => void;
};

/**
 * Table Bootstrap des modèles de service cloud (référentiel générique
 * name/code/description — IaaS/PaaS/SaaS/FaaS/CaaS).
 */
export default function CloudServiceModelsTable({
  cloudServiceModels,
  onEdit,
  onDelete,
}: CloudServiceModelsTableProps) {
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
            {cloudServiceModels.map((cloudServiceModel) => (
              <tr key={cloudServiceModel.id}>
                <td className="fw-semibold">{cloudServiceModel.name}</td>
                <td>{cloudServiceModel.code}</td>
                <td className="d-none d-md-table-cell">{cloudServiceModel.description ?? "—"}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${cloudServiceModel.name}`}
                      onClick={() => onEdit(cloudServiceModel)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${cloudServiceModel.name}`}
                      onClick={() => onDelete(cloudServiceModel)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {cloudServiceModels.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-body-secondary py-4">
                  Aucun modèle de service cloud.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
