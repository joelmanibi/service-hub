"use client";

import { useState } from "react";
import TypeClientsPanel from "./TypeClientsPanel";
import CountriesPanel from "./CountriesPanel";
import ServiceTypesPanel from "./ServiceTypesPanel";
import HostingsPanel from "./HostingsPanel";
import PodsPanel from "./PodsPanel";
import SupportLevelsPanel from "./SupportLevelsPanel";
import CloudServiceModelsPanel from "./CloudServiceModelsPanel";
import NetworksPanel from "./NetworksPanel";

const TABS = [
  { id: "type-clients", label: "Types de client" },
  { id: "countries", label: "Pays" },
  { id: "service-types", label: "Types de service" },
  { id: "cloud-service-models", label: "Modèles de service cloud" },
  { id: "hostings", label: "Hébergements" },
  { id: "networks", label: "Réseaux" },
  { id: "pods", label: "Pods" },
  { id: "support-levels", label: "Niveaux de support" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Page Paramètres : onglets pilotés par état React (pas par le JS Boosted
 * data-bs-toggle="tab", pour rester cohérent avec ModalShell — évite les
 * conflits entre une instance JS Bootstrap et le rendu conditionnel
 * React). Structure prête à accueillir les autres référentiels du module
 * settings (statuts, criticités, technologies...) sans redesign.
 */
export default function SettingsPageClient() {
  const [activeTab, setActiveTab] = useState<TabId>("type-clients");

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Paramètres</h1>
        <p className="text-body-secondary mb-0">Référentiels utilisés par l&apos;application.</p>
      </div>

      <ul className="nav nav-tabs mb-4">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              type="button"
              className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === "type-clients" && <TypeClientsPanel />}
      {activeTab === "countries" && <CountriesPanel />}
      {activeTab === "service-types" && <ServiceTypesPanel />}
      {activeTab === "cloud-service-models" && <CloudServiceModelsPanel />}
      {activeTab === "hostings" && <HostingsPanel />}
      {activeTab === "networks" && <NetworksPanel />}
      {activeTab === "pods" && <PodsPanel />}
      {activeTab === "support-levels" && <SupportLevelsPanel />}
    </div>
  );
}
