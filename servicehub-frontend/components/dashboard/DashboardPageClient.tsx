"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardStats from "./DashboardStats";
import type { StatDefinition } from "./DashboardStats";
import DistributionCard from "./DistributionCard";
import RecentServices from "./RecentServices";
import ActivityTimeline from "./ActivityTimeline";
import { getDashboardOverview, type DashboardOverview } from "@/services/dashboard.service";
import { countryFlagEmoji } from "@/lib/countryFlag";
import { getApiErrorMessage } from "@/lib/apiError";

/**
 * Orchestrateur client de la page Dashboard : charge les KPI réels
 * (services/dashboard.service.ts, GET /dashboard) au montage et construit
 * les props attendues par chaque carte à partir de la réponse agrégée.
 */
export default function DashboardPageClient() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await getDashboardOverview();
      setOverview(result);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Impossible de charger le tableau de bord."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="container-fluid">
        <DashboardHeader />

        <div className="row row-cols-1 row-cols-lg-4 g-3 mb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="col" key={index}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body placeholder-glow">
                  <span
                    className="placeholder rounded-circle d-inline-block mb-3"
                    style={{ width: "3rem", height: "3rem" }}
                  />
                  <span className="placeholder col-7 d-block mb-2" />
                  <span className="placeholder col-4 d-block mb-2" style={{ height: "1.5rem" }} />
                  <span className="placeholder col-9 d-block" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm placeholder-glow">
              <div className="card-body">
                <span className="placeholder col-3 d-block mb-4" />
                {Array.from({ length: 4 }).map((_, index) => (
                  <span key={index} className="placeholder col-12 d-block mb-3" style={{ height: "1.1rem" }} />
                ))}
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm h-100 placeholder-glow">
              <div className="card-body">
                <span className="placeholder col-6 d-block mb-4" />
                {Array.from({ length: 3 }).map((_, index) => (
                  <span key={index} className="placeholder col-12 d-block mb-3" style={{ height: "2.5rem" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !overview) {
    return (
      <div className="container-fluid">
        <DashboardHeader />
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
          <span>{loadError ?? "Impossible de charger le tableau de bord."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={loadData}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const stats: StatDefinition[] = [
    {
      icon: "bi-grid",
      title: "Total Services",
      value: overview.stats.totalServices,
      description: "Services référencés au catalogue",
      accent: "primary",
    },
    {
      icon: "bi-check-circle",
      title: "RUN",
      value: overview.stats.runCount,
      description: "Instances actives en production",
      accent: "success",
      badge: { label: "RUN", variant: "success" },
    },
    {
      icon: "bi-tools",
      title: "BUILD",
      value: overview.stats.buildCount,
      description: "Instances en cours de déploiement",
      accent: "warning",
      badge: { label: "BUILD", variant: "warning" },
    },
    {
      icon: "bi-hdd-network",
      title: "Instances",
      value: overview.stats.totalInstances,
      description: "Total des instances déployées",
      accent: "info",
    },
  ];

  const environmentItems = overview.environmentDistribution.map((env) => ({
    key: env.code,
    label: `${env.label} (${env.code})`,
    value: env.count,
  }));

  const serviceTypeItems = overview.serviceTypeDistribution.map((type) => ({
    key: type.label,
    label: type.label,
    value: type.count,
  }));

  const countryItems = overview.countryDistribution.map((item) => ({
    key: item.code,
    label: item.name,
    value: item.count,
    leading: countryFlagEmoji(item.code),
  }));

  const hostingItems = overview.hostingDistribution.map((item) => ({
    key: item.name,
    label: item.name,
    value: item.count,
  }));

  return (
    <div className="container-fluid">
      <DashboardHeader />

      {/* Ligne 1 — 4 cartes KPI (StatCard) */}
      <div className="mb-4 sh-rise-in">
        <DashboardStats stats={stats} />
      </div>

      {/* Ligne 2 — deux colonnes */}
      <div className="row g-3 mb-4 sh-rise-in" style={{ animationDelay: "60ms" }}>
        <div className="col-12 col-lg-8">
          <DistributionCard title="Instances par environnement" items={environmentItems} />
        </div>

        <div className="col-12 col-lg-4">
          <ActivityTimeline items={overview.recentActivity} />
        </div>
      </div>

      {/* Ligne 3 — deux colonnes */}
      <div className="row g-3 mb-4 sh-rise-in" style={{ animationDelay: "120ms" }}>
        <div className="col-12 col-lg-6">
          <DistributionCard title="Services par type" items={serviceTypeItems} />
        </div>

        <div className="col-12 col-lg-6">
          <DistributionCard title="Instances par pays" items={countryItems} />
        </div>
      </div>

      {/* Ligne 4 — table (instances récemment modifiées) + statistiques (hébergement), deux colonnes */}
      <div className="row g-3 sh-rise-in" style={{ animationDelay: "180ms" }}>
        <div className="col-12 col-lg-8">
          <RecentServices items={overview.recentInstances} />
        </div>

        <div className="col-12 col-lg-4">
          <DistributionCard title="Répartition par hébergement" items={hostingItems} />
        </div>
      </div>
    </div>
  );
}
