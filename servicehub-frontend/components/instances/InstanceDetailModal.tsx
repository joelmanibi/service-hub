"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import ModalShell from "@/components/users/ModalShell";
import StatusDot from "@/components/common/StatusDot";
import { getInstanceArchitectureImageUrl, type ManagedInstance } from "@/services/instances.service";
import type { CatalogService } from "@/services/catalog.service";
import { accentFromSeed } from "@/lib/accentColor";
import styles from "./InstanceDetailModal.module.scss";

type InstanceDetailModalProps = {
  instance: ManagedInstance;
  services: CatalogService[];
  onClose: () => void;
};

function SheetSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/**
 * Fiche d'identité d'une instance (lecture seule, imprimable) — ouverte
 * via l'icône œil de InstancesTable/InstancesGrid. Structurée comme un
 * document officiel : bandeau de marque (logo ServiceHub) en tête, puis
 * un bloc identité (avatar/nom/code/statut) accolé aux sections de
 * détail — même répartition de l'information qu'une carte d'identité
 * (photo + informations clés) suivie d'un dossier complet. Le backend ne
 * renvoie que la clé étrangère brute `serviceId` : le libellé est résolu
 * ici comme dans InstancesTable/InstancesGrid.
 *
 * Impression : le contenu (hors chrome du modal) porte la classe globale
 * .sh-print-sheet (app/globals.css) — handlePrint bascule <body> en mode
 * impression le temps de window.print() pour n'imprimer que la fiche.
 */
export default function InstanceDetailModal({ instance, services, onClose }: InstanceDetailModalProps) {
  const titleId = "instance-detail-modal-title";
  const serviceName = services.find((service) => service.id === instance.serviceId)?.name ?? "—";
  const accent = accentFromSeed(instance.code || instance.name);
  const architectureImageUrl = getInstanceArchitectureImageUrl(instance.architectureImageUrl);
  const printedAt = new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    const stopPrinting = () => {
      document.body.classList.remove("sh-printing");
      window.removeEventListener("afterprint", stopPrinting);
    };

    document.body.classList.add("sh-printing");
    window.addEventListener("afterprint", stopPrinting);
    window.print();
  };

  return (
    <ModalShell
      titleId={titleId}
      title={instance.name}
      onClose={onClose}
      size="xl"
      scrollable
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Fermer
          </button>
          <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={handlePrint}>
            <i className="bi bi-printer" aria-hidden="true" />
            Imprimer
          </button>
        </>
      }
    >
      <div className={`sh-print-sheet ${styles.sheet}`}>
        <header className={styles.letterhead}>
          <div className="d-flex align-items-center gap-2">
            <Image src="/orange-logo.svg" alt="Orange" width={28} height={28} />
            <div>
              <span className={`fw-bold ${styles.brand}`}>ServiceHub</span>
              <span className={`d-block text-body-secondary ${styles.brandSubtitle}`}>Fiche d&apos;instance</span>
            </div>
          </div>
          <span className="small text-body-secondary d-none d-print-block">Éditée le {printedAt}</span>
        </header>

        <div className={styles.layout}>
          <aside className={styles.identityCard}>
            <span
              className={`rounded-circle d-inline-flex align-items-center justify-content-center fw-bold bg-${accent}-subtle text-${accent} ${styles.avatar}`}
              aria-hidden="true"
            >
              {initialsOf(instance.name)}
            </span>

            <h2 className={styles.identityName}>{instance.name}</h2>
            <span className={`font-monospace text-body-secondary ${styles.identityCode}`}>{instance.code}</span>

            {instance.statutInstanceName ? (
              <StatusDot label={instance.statutInstanceName} />
            ) : (
              <span className="text-body-secondary">—</span>
            )}

            <div className={styles.identityMeta}>
              <i className="bi bi-hdd-network" aria-hidden="true" />
              <span className="text-truncate">{serviceName}</span>
            </div>
          </aside>

          <div className={styles.details}>
            <SheetSection title="Identification">
              <div className={styles.fieldGrid}>
                <Field label="Client" value={instance.clientName || "—"} />
                <Field label="Pod" value={instance.podName || "—"} />
                <Field label="Produit Océane" value={instance.produitOceane || "—"} />
              </div>
            </SheetSection>

            <SheetSection title="Déploiement">
              <div className={styles.fieldGrid}>
                <Field
                  label="Environnements"
                  value={instance.environmentNames.length > 0 ? instance.environmentNames.join(", ") : "—"}
                />
                <Field
                  label="Sites d'hébergement"
                  value={instance.hostingNames.length > 0 ? instance.hostingNames.join(", ") : "—"}
                />
                <Field
                  label="Dépendances réseau"
                  value={instance.networkNames.length > 0 ? instance.networkNames.join(", ") : "—"}
                />
              </div>
            </SheetSection>

            {architectureImageUrl && (
              <SheetSection title="Schéma d'architecture">
                <img
                  src={architectureImageUrl}
                  alt="Schéma d'architecture de l'instance"
                  className={`img-fluid rounded border ${styles.architectureImage}`}
                />
              </SheetSection>
            )}

            <SheetSection title="Composants">
              {instance.composants.length > 0 ? (
                <div className={styles.componentList}>
                  {instance.composants.map((composant) => (
                    <div className={styles.componentCard} key={composant.id}>
                      <div className="d-flex align-items-baseline justify-content-between gap-2">
                        <span className="fw-semibold">{composant.name}</span>
                        {composant.platformName && (
                          <span className="badge rounded-pill bg-info-subtle text-info-emphasis">
                            {composant.platformName}
                          </span>
                        )}
                      </div>
                      {composant.description && (
                        <p className="text-body-secondary small mb-0 mt-1">{composant.description}</p>
                      )}
                      {composant.inventaires.length > 0 && (
                        <div className={styles.tagRow}>
                          {composant.inventaires.map((inventaire) => (
                            <span className={styles.tag} key={inventaire.id}>
                              {inventaire.nomServeur} <span className="text-body-secondary">({inventaire.ip})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-secondary small mb-0">Aucun composant renseigné.</p>
              )}
            </SheetSection>

            <SheetSection title="Niveaux de support">
              {instance.supportLevels.length > 0 ? (
                <div className="table-responsive">
                  <table className={`table align-middle mb-0 ${styles.table}`}>
                    <thead>
                      <tr>
                        <th scope="col">Niveau</th>
                        <th scope="col">Responsable</th>
                        <th scope="col">Téléphone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instance.supportLevels.map((supportLevel) => (
                        <tr key={supportLevel.id}>
                          <td className="fw-semibold">{supportLevel.supportLevelName || "—"}</td>
                          <td>{supportLevel.responsable || "—"}</td>
                          <td>{supportLevel.telephone || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-body-secondary small mb-0">Aucun niveau de support assigné.</p>
              )}
            </SheetSection>

            <SheetSection title="Commentaires">
              {instance.comments ? (
                <p className={`mb-0 ${styles.comments}`}>{instance.comments}</p>
              ) : (
                <p className="text-body-secondary small mb-0">Aucun commentaire.</p>
              )}
            </SheetSection>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
