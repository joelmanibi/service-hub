import StatCard, { type StatCardAccent, type StatCardBadge } from "./StatCard";

export type StatDefinition = {
  icon: string;
  title: string;
  value: number;
  description: string;
  accent: StatCardAccent;
  badge?: StatCardBadge;
};

type DashboardStatsProps = {
  stats: StatDefinition[];
};

/**
 * Quatre cartes de statistiques clés du catalogue (StatCard). Bascule
 * mobile (1 colonne) → desktop (4 colonnes) au breakpoint lg, aligné sur
 * celui de la Sidebar/Topbar pour une transition cohérente dans toute
 * l'application.
 */
export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="row row-cols-1 row-cols-lg-4 g-3">
      {stats.map((stat) => (
        <div className="col" key={stat.title}>
          <StatCard {...stat} />
        </div>
      ))}
    </div>
  );
}
