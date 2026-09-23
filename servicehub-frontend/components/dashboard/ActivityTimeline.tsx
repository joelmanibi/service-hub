import styles from "./ActivityTimeline.module.scss";

export type ActivityItem = {
  time: string;
  text: string;
  icon: string;
};

type ActivityTimelineProps = {
  title?: string;
  items: ActivityItem[];
};

/**
 * Timeline sobre de l'activité récente. Icônes Bootstrap Icons
 * uniquement, aucune librairie externe : la ligne verticale et les
 * repères sont construits avec des classes Boosted (flex, rounded-circle,
 * border) et un CSS Module minimal pour la largeur/couleur de la ligne.
 */
export default function ActivityTimeline({ title = "Activité récente", items }: ActivityTimelineProps) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header bg-white">
        <h2 className="h6 mb-0">{title}</h2>
      </div>
      <div className="card-body">
        {items.length === 0 && <p className="text-body-secondary small mb-0">Aucune activité récente.</p>}
        <ol className="list-unstyled mb-0">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li className="d-flex" key={`${item.time}-${item.text}`}>
                <div
                  className={`d-flex flex-column align-items-center ${styles.markerColumn}`}
                >
                  <span className="rounded-circle bg-body-tertiary d-inline-flex align-items-center justify-content-center p-2">
                    <i
                      className={`bi ${item.icon} text-body-secondary`}
                      aria-hidden="true"
                    />
                  </span>
                  {!isLast && <div className={`flex-grow-1 ${styles.line}`} />}
                </div>

                <div className={`ms-3 ${isLast ? "" : "pb-4"}`}>
                  <span className="text-body-secondary small d-block">
                    {item.time}
                  </span>
                  <span>{item.text}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
