import styles from "./RecentServices.module.scss";

export type RecentServiceItem = {
  name: string;
  country: string;
  status: string | null;
  updatedAt: string;
};

type RecentServicesProps = {
  title?: string;
  items: RecentServiceItem[];
};

// Le statut vient du référentiel StatutInstance (module settings), en
// texte libre — pas un enum fixe. Cohérent avec DashboardStats : RUN =
// vert, BUILD = jaune ; tout autre code retombe sur un badge neutre.
const STATUS_VARIANT: Record<string, "success" | "warning"> = {
  RUN: "success",
  BUILD: "warning",
};

/**
 * Table des instances récemment modifiées — composants Table Boosted
 * uniquement. Badge coloré selon le statut (RUN = vert, BUILD = jaune,
 * tout autre code = neutre).
 */
export default function RecentServices({ title = "Instances récemment modifiées", items }: RecentServicesProps) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white">
        <h2 className="h6 mb-0">{title}</h2>
      </div>
      <div className="table-responsive">
        <table className={`table table-hover align-middle mb-0 ${styles.table}`}>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Pays</th>
              <th scope="col">État</th>
              <th scope="col">Date de modification</th>
            </tr>
          </thead>
          <tbody>
            {items.map((service) => {
              const variant = service.status ? (STATUS_VARIANT[service.status] ?? "secondary") : "secondary";

              return (
                <tr key={service.name}>
                  <td className="fw-semibold">{service.name}</td>
                  <td className="text-body-secondary">{service.country}</td>
                  <td>
                    <span className={`badge rounded-pill fw-semibold bg-${variant}-subtle text-${variant}`}>
                      {service.status ?? "—"}
                    </span>
                  </td>
                  <td className="text-body-secondary">{service.updatedAt}</td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-body-secondary py-4">
                  Aucune instance récente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
