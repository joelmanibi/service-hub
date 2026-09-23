import { getServiceLogoUrl, type CatalogService } from "@/services/catalog.service";
import type { ServiceType } from "@/services/serviceTypes.service";

type ServicesTableProps = {
  services: CatalogService[];
  serviceTypes: ServiceType[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (service: CatalogService) => void;
  onDelete: (service: CatalogService) => void;
};

/**
 * Table Bootstrap des services du catalogue. Le backend ne renvoie que
 * la clé étrangère brute (serviceTypeId) : son libellé est résolu ici à
 * partir du référentiel chargé par CatalogPageClient. `cloudServiceModels`
 * (relation many-to-many) arrive en revanche déjà résolus (nom/code)
 * directement sur chaque service. La case à cocher d'en-tête sélectionne/
 * désélectionne uniquement les services de la page courante (la sélection
 * ne persiste pas d'une page à l'autre — cf. CatalogPageClient).
 */
export default function ServicesTable({
  services,
  serviceTypes,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}: ServicesTableProps) {
  const serviceTypeById = new Map(serviceTypes.map((item) => [item.id, item.name]));
  const allSelected = services.length > 0 && services.every((service) => selectedIds.has(service.id));

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
                  aria-label="Sélectionner tous les services de cette page"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th scope="col" aria-label="Logo" />
              <th scope="col">Code</th>
              <th scope="col">Nom</th>
              <th scope="col">Type de service</th>
              <th scope="col" className="d-none d-lg-table-cell">
                Modèle cloud
              </th>
              <th scope="col" className="d-none d-md-table-cell">
                Description
              </th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className={selectedIds.has(service.id) ? "table-active" : undefined}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    aria-label={`Sélectionner ${service.name}`}
                    checked={selectedIds.has(service.id)}
                    onChange={() => onToggleSelect(service.id)}
                  />
                </td>
                <td>
                  {getServiceLogoUrl(service.logoUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- logo utilisateur hors domaines Next Image configurés
                    <img
                      src={getServiceLogoUrl(service.logoUrl) ?? undefined}
                      alt=""
                      className="rounded border"
                      style={{ width: "2rem", height: "2rem", objectFit: "contain" }}
                    />
                  ) : (
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded border text-body-secondary"
                      style={{ width: "2rem", height: "2rem" }}
                    >
                      <i className="bi bi-image" aria-hidden="true" />
                    </span>
                  )}
                </td>
                <td>{service.code}</td>
                <td className="fw-semibold">{service.name}</td>
                <td>{serviceTypeById.get(service.serviceTypeId) ?? "—"}</td>
                <td className="d-none d-lg-table-cell">
                  {service.cloudServiceModels.length > 0 ? (
                    <div className="d-flex flex-wrap gap-1">
                      {service.cloudServiceModels.map((cloudServiceModel) => (
                        <span key={cloudServiceModel.id} className="badge rounded-pill text-bg-secondary">
                          {cloudServiceModel.code}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="d-none d-md-table-cell">{service.description ?? "—"}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      aria-label={`Modifier ${service.name}`}
                      onClick={() => onEdit(service)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-sm text-danger"
                      aria-label={`Supprimer ${service.name}`}
                      onClick={() => onDelete(service)}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {services.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-body-secondary py-4">
                  Aucun service.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
