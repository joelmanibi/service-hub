import type { ManagedInstance } from "@/services/instances.service";
import type { CatalogService } from "@/services/catalog.service";
import StatusDot from "@/components/common/StatusDot";
import styles from "./InstancesGrid.module.scss";

type InstancesGridProps = {
  instances: ManagedInstance[];
  services: CatalogService[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onView: (instance: ManagedInstance) => void;
  onEdit: (instance: ManagedInstance) => void;
  onDelete: (instance: ManagedInstance) => void;
};

/**
 * Vue en grille des instances (cartes Boosted), alternative à
 * InstancesTable pour la même donnée — bascule pilotée par ViewToggle
 * dans InstancesPageClient. Le backend ne renvoie que la clé étrangère
 * brute `serviceId` (pas d'objet `service` imbriqué) : le libellé est
 * résolu ici comme dans InstancesTable. Métadonnées présentées en liste
 * à icônes (plus lisible qu'une `dl` deux colonnes sur des cartes
 * étroites à 4 par ligne) ; actions séparées dans un card-footer pour
 * une lecture plus épurée. Bordure/rayon plats (Design System Orange,
 * non arrondi) — seule l'ombre au survol (InstancesGrid.module.scss)
 * apporte du relief.
 */
export default function InstancesGrid({
  instances,
  services,
  selectedIds,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
}: InstancesGridProps) {
  const serviceById = new Map(services.map((service) => [service.id, service.name]));

  if (instances.length === 0) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center text-body-secondary py-5">Aucune instance.</div>
      </div>
    );
  }

  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3">
      {instances.map((instance) => {
        const environments = instance.environmentNames.join(", ");
        const hostings = instance.hostingNames.join(", ");

        const isSelected = selectedIds.has(instance.id);

        return (
          <div className="col" key={instance.id}>
            <div className={`card border-0 shadow-sm h-100 ${styles.instanceCard} ${isSelected ? "border border-primary" : ""}`}>
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-start gap-2 mb-2">
                  <input
                    type="checkbox"
                    className="form-check-input mt-1 flex-shrink-0"
                    aria-label={`Sélectionner ${instance.name}`}
                    checked={isSelected}
                    onChange={() => onToggleSelect(instance.id)}
                  />
                  <div className="text-truncate flex-grow-1">
                    <h2 className="h6 fw-bold mb-0 text-truncate" title={instance.name}>
                      {instance.name}
                    </h2>
                    <span className="text-body-secondary small">{instance.code}</span>
                  </div>
                </div>
                <div className="mb-3">
                  {instance.statutInstanceName ? (
                    <StatusDot label={instance.statutInstanceName} />
                  ) : (
                    <span className="text-body-secondary">—</span>
                  )}
                </div>

                <ul className="list-unstyled small text-body-secondary d-flex flex-column gap-2 mb-0">
                  <li className="d-flex align-items-center gap-2">
                    <i className={`bi bi-building ${styles.metaIcon}`} aria-hidden="true" />
                    <span className="text-truncate" title={instance.clientName || undefined}>
                      {instance.clientName || "—"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <i className={`bi bi-diagram-3 ${styles.metaIcon}`} aria-hidden="true" />
                    <span className="text-truncate">{instance.podName || "—"}</span>
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <i className={`bi bi-hdd-network ${styles.metaIcon}`} aria-hidden="true" />
                    <span className="text-truncate">{serviceById.get(instance.serviceId) ?? "—"}</span>
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <i className={`bi bi-layers ${styles.metaIcon}`} aria-hidden="true" />
                    <span className="text-truncate" title={environments || undefined}>
                      {environments || "—"}
                    </span>
                  </li>
                  <li className="d-flex align-items-center gap-2">
                    <i className={`bi bi-server ${styles.metaIcon}`} aria-hidden="true" />
                    <span className="text-truncate" title={hostings || undefined}>
                      {hostings || "—"}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="card-footer bg-white d-flex justify-content-end gap-1">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
