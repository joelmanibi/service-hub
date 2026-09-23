import apiClient from "@/lib/axios";

/**
 * Service Dashboard (module dashboard côté backend — GET /dashboard,
 * ADMIN/VALIDATOR/USER). Agrège les KPI réels du catalogue en un seul
 * appel ; cette couche ne fait que formater les horodatages bruts
 * (ISO) renvoyés par le backend en texte affichable (heure, date
 * relative "Aujourd'hui"/"Hier"), sans logique métier.
 */

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DashboardStatsData {
  totalServices: number;
  totalInstances: number;
  runCount: number;
  buildCount: number;
}

export interface EnvironmentDistributionItem {
  label: string;
  code: string;
  count: number;
}

export interface ServiceTypeDistributionItem {
  label: string;
  count: number;
}

export interface CountryDistributionItem {
  code: string;
  name: string;
  count: number;
}

export interface HostingDistributionItem {
  name: string;
  count: number;
}

export interface RecentInstanceItem {
  name: string;
  country: string;
  status: string | null;
  updatedAt: string;
}

export interface ActivityItem {
  time: string;
  text: string;
  icon: string;
}

interface RawRecentInstance {
  name: string;
  country: string | null;
  status: string | null;
  updatedAt: string;
}

interface RawActivityItem {
  time: string;
  text: string;
  icon: string;
}

interface RawOverview {
  stats: DashboardStatsData;
  environmentDistribution: EnvironmentDistributionItem[];
  serviceTypeDistribution: ServiceTypeDistributionItem[];
  countryDistribution: CountryDistributionItem[];
  hostingDistribution: HostingDistributionItem[];
  recentInstances: RawRecentInstance[];
  recentActivity: RawActivityItem[];
}

export interface DashboardOverview {
  stats: DashboardStatsData;
  environmentDistribution: EnvironmentDistributionItem[];
  serviceTypeDistribution: ServiceTypeDistributionItem[];
  countryDistribution: CountryDistributionItem[];
  hostingDistribution: HostingDistributionItem[];
  recentInstances: RecentInstanceItem[];
  recentActivity: ActivityItem[];
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return "Aujourd'hui";
  if (isSameDay(date, yesterday)) return "Hier";

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function toOverview(raw: RawOverview): DashboardOverview {
  return {
    stats: raw.stats,
    environmentDistribution: raw.environmentDistribution,
    serviceTypeDistribution: raw.serviceTypeDistribution,
    countryDistribution: raw.countryDistribution,
    hostingDistribution: raw.hostingDistribution,
    recentInstances: raw.recentInstances.map((item) => ({
      name: item.name,
      country: item.country ?? "Non renseigné",
      status: item.status,
      updatedAt: formatRelativeDate(item.updatedAt),
    })),
    recentActivity: raw.recentActivity.map((item) => ({
      time: formatTime(item.time),
      text: item.text,
      icon: item.icon,
    })),
  };
}

// GET /dashboard
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const { data } = await apiClient.get<ApiEnvelope<RawOverview>>("/dashboard");
  return toOverview(data.data);
}
