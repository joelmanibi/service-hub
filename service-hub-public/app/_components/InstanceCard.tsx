import type { PublicInstance } from "@/lib/publicApi";

type InstanceCardProps = {
  instance: PublicInstance;
};

// Le statut vient du référentiel StatutInstance (module settings), en
// texte libre — pas un enum fixe. Comparaison insensible à la casse et
// aux accents pour rester robuste aux variantes de saisie ("En Service",
// "en service", ...). Toute autre valeur retombe sur le point neutre.
function getStatusDotVariant(statusName: string): "success" | "danger" | "secondary" {
  const normalized = statusName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

  if (normalized === "en service") return "success";
  if (normalized === "decommissionne") return "danger";
  return "secondary";
}

/**
 * Carte d'instance (résumé anonymisé — cf. lib/publicApi.ts) : nom,
 * statut, environnements et hébergements. Jamais de Client, de Pod, de
 * Composant/Inventaire ni de niveau de support, non projetés par
 * l'API publique.
 */
export default function InstanceCard({ instance }: InstanceCardProps) {
  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
          <span
            aria-hidden="true"
            className="rounded-3 d-inline-flex align-items-center justify-content-center text-bg-secondary"
            style={{ width: "3rem", height: "3rem" }}
          >
            <i className="bi bi-hdd-network fs-5" aria-hidden="true" />
          </span>

          {instance.statutInstance && (
            <span className="d-inline-flex align-items-center gap-2 text-nowrap">
              <span
                className={`rounded-circle bg-${getStatusDotVariant(instance.statutInstance.name)}`}
                style={{ width: "0.55rem", height: "0.55rem", flex: "0 0 auto" }}
                aria-hidden="true"
              />
              <span className="small text-body-secondary">{instance.statutInstance.name}</span>
            </span>
          )}
        </div>

        <h3 className="h6 fw-bold mb-2">{instance.name}</h3>

        <div className="mt-auto d-flex flex-column gap-1 small text-body-secondary">
          {instance.country && (
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-geo-alt" aria-hidden="true" />
              <span className="text-truncate">{instance.country.name}</span>
            </div>
          )}
          {instance.environments.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-layers" aria-hidden="true" />
              <span className="text-truncate">{instance.environments.map((item) => item.name).join(", ")}</span>
            </div>
          )}
          {instance.hostings.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-server" aria-hidden="true" />
              <span className="text-truncate">{instance.hostings.map((item) => item.name).join(", ")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
