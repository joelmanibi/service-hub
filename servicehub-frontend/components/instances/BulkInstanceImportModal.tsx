"use client";

import { useState, type ChangeEvent } from "react";
import ModalShell from "@/components/users/ModalShell";
import { parseCsv } from "@/lib/csv";
import { parseExcel } from "@/lib/excel";
import { createInstance, type ManagedInstance } from "@/services/instances.service";
import type { ManagedClient } from "@/components/clients/clientTypes";
import type { CatalogService } from "@/services/catalog.service";
import type { StatutInstance } from "@/services/statutInstances.service";
import type { Environment } from "@/services/environments.service";
import type { Hosting } from "@/services/hostings.service";
import type { Pod } from "@/services/pods.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ReferenceItem = { id: number; name: string };

type ParsedRow = {
  rowNumber: number;
  name: string;
  clientLabel: string;
  clientId: number | null;
  podLabel: string;
  podId: number | null;
  serviceLabel: string;
  serviceId: number | null;
  statutLabel: string;
  statutInstanceId: number | null;
  environmentLabels: string[];
  environmentIds: number[];
  hostingLabels: string[];
  hostingIds: number[];
  produitOceane: string;
  comments: string;
  error: string | null;
};

type RowResult = {
  rowNumber: number;
  name: string;
  status: "success" | "error";
  message: string;
};

type BulkInstanceImportModalProps = {
  clients: ManagedClient[];
  services: CatalogService[];
  statutInstances: StatutInstance[];
  environments: Environment[];
  hostings: Hosting[];
  pods: Pod[];
  onClose: () => void;
  onDone: (createdCount: number) => void;
};

const EXCEL_EXTENSIONS = [".xlsx", ".xls"];

const HEADER_ALIASES = {
  name: ["nom", "name"],
  client: ["client"],
  pod: ["pod"],
  service: ["service"],
  statut: ["statut", "état du service", "etat du service", "état", "etat"],
  environments: ["environnements", "environnement", "environments"],
  hostings: ["sites d'hébergement", "site d'hébergement", "hébergements", "hebergements", "hostings"],
  produitOceane: ["produit océane", "produit oceane"],
  comments: ["commentaires", "commentaire", "comments"],
};

const TEMPLATE_CSV =
  'nom,client,pod,service,statut,environnements,sites d\'hébergement,produit océane,commentaires\r\n' +
  'MAXIT OCI,Orange Cote d\'Ivoire,Pod A,MAXIT,EN SERVICE,Production;Pré-production,DC VITIB,MAXIT_OCI,"Exemple, avec virgule"\r\n';

function findColumnIndex(headerRow: string[], aliases: string[]): number {
  return headerRow.findIndex((cell) => aliases.includes(cell.trim().toLowerCase()));
}

function isExcelFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return EXCEL_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function findByName(items: ReferenceItem[], label: string): ReferenceItem | undefined {
  return items.find((item) => item.name.trim().toLowerCase() === label.trim().toLowerCase());
}

function resolveMultiValued(
  rawCell: string | undefined,
  items: ReferenceItem[]
): { labels: string[]; ids: number[]; unknownLabels: string[] } {
  const labels = (rawCell ?? "")
    .split(";")
    .map((label) => label.trim())
    .filter((label) => label !== "");

  const resolved = labels.map((label) => ({ label, item: findByName(items, label) }));

  return {
    labels,
    ids: resolved.map((entry) => entry.item?.id).filter((id): id is number => id !== undefined),
    unknownLabels: resolved.filter((entry) => !entry.item).map((entry) => entry.label),
  };
}

// Aligné sur les validators Joi du backend (modules/instance/validator.js
// — createInstanceSchema) : `code` généré côté backend, les clés
// étrangères (client/pod/service/statut) et les relations
// (environnements/hébergements, multi-valuées dans une même cellule,
// séparées par `;`) résolues ici par nom — l'id brut n'est pas
// exploitable depuis un fichier préparé par un humain. Composants et
// niveaux de support, trop imbriqués pour une ligne de tableur, ne sont
// pas pris en charge ici — à ajouter ensuite via la fiche d'édition.
function buildParsedRows(
  fileRows: string[][],
  clients: ManagedClient[],
  pods: Pod[],
  services: CatalogService[],
  statutInstances: StatutInstance[],
  environments: Environment[],
  hostings: Hosting[]
): { rows: ParsedRow[]; formatError: string | null } {
  if (fileRows.length === 0) {
    return { rows: [], formatError: "Le fichier est vide." };
  }

  const [header, ...dataRows] = fileRows;
  const nameIndex = findColumnIndex(header, HEADER_ALIASES.name);
  const clientIndex = findColumnIndex(header, HEADER_ALIASES.client);
  const podIndex = findColumnIndex(header, HEADER_ALIASES.pod);
  const serviceIndex = findColumnIndex(header, HEADER_ALIASES.service);
  const statutIndex = findColumnIndex(header, HEADER_ALIASES.statut);
  const environmentsIndex = findColumnIndex(header, HEADER_ALIASES.environments);
  const hostingsIndex = findColumnIndex(header, HEADER_ALIASES.hostings);
  const produitOceaneIndex = findColumnIndex(header, HEADER_ALIASES.produitOceane);
  const commentsIndex = findColumnIndex(header, HEADER_ALIASES.comments);

  if (nameIndex === -1 || clientIndex === -1 || podIndex === -1 || serviceIndex === -1 || statutIndex === -1) {
    return {
      rows: [],
      formatError:
        'Colonnes attendues introuvables : "nom", "client", "pod", "service" et "statut" sont obligatoires.',
    };
  }

  if (dataRows.length === 0) {
    return { rows: [], formatError: "Le fichier ne contient aucune ligne de données." };
  }

  const rows: ParsedRow[] = dataRows.map((cells, index) => {
    const name = cells[nameIndex]?.trim() ?? "";
    const clientLabel = cells[clientIndex]?.trim() ?? "";
    const podLabel = cells[podIndex]?.trim() ?? "";
    const serviceLabel = cells[serviceIndex]?.trim() ?? "";
    const statutLabel = cells[statutIndex]?.trim() ?? "";
    const produitOceane = produitOceaneIndex >= 0 ? (cells[produitOceaneIndex]?.trim() ?? "") : "";
    const comments = commentsIndex >= 0 ? (cells[commentsIndex]?.trim() ?? "") : "";

    const matchedClient = findByName(clients, clientLabel);
    const matchedPod = findByName(pods, podLabel);
    const matchedService = findByName(services, serviceLabel);
    const matchedStatut = findByName(statutInstances, statutLabel);

    const environmentsResolved = resolveMultiValued(
      environmentsIndex >= 0 ? cells[environmentsIndex] : undefined,
      environments
    );
    const hostingsResolved = resolveMultiValued(hostingsIndex >= 0 ? cells[hostingsIndex] : undefined, hostings);

    let error: string | null = null;
    if (!name) {
      error = "Nom manquant.";
    } else if (!clientLabel) {
      error = "Client manquant.";
    } else if (!matchedClient) {
      error = `Client inconnu : "${clientLabel}".`;
    } else if (!podLabel) {
      error = "Pod manquant.";
    } else if (!matchedPod) {
      error = `Pod inconnu : "${podLabel}".`;
    } else if (!serviceLabel) {
      error = "Service manquant.";
    } else if (!matchedService) {
      error = `Service inconnu : "${serviceLabel}".`;
    } else if (!statutLabel) {
      error = "Statut manquant.";
    } else if (!matchedStatut) {
      error = `Statut inconnu : "${statutLabel}".`;
    } else if (environmentsResolved.unknownLabels.length > 0) {
      error = `Environnement(s) inconnu(s) : ${environmentsResolved.unknownLabels.map((label) => `"${label}"`).join(", ")}.`;
    } else if (hostingsResolved.unknownLabels.length > 0) {
      error = `Site(s) d'hébergement inconnu(s) : ${hostingsResolved.unknownLabels.map((label) => `"${label}"`).join(", ")}.`;
    }

    return {
      rowNumber: index + 2, // +1 pour la ligne d'en-tête, +1 pour repasser en 1-based
      name,
      clientLabel,
      clientId: matchedClient?.id ?? null,
      podLabel,
      podId: matchedPod?.id ?? null,
      serviceLabel,
      serviceId: matchedService?.id ?? null,
      statutLabel,
      statutInstanceId: matchedStatut?.id ?? null,
      environmentLabels: environmentsResolved.labels,
      environmentIds: environmentsResolved.ids,
      hostingLabels: hostingsResolved.labels,
      hostingIds: hostingsResolved.ids,
      produitOceane,
      comments,
      error,
    };
  });

  return { rows, formatError: null };
}

/**
 * Modale d'import en masse d'instances (Bootstrap Modal), à partir d'un
 * fichier CSV ou Excel (.xlsx/.xls) — même principe que
 * BulkServiceImportModal (module catalog) : analyse et validation
 * entièrement côté client, aucun endpoint dédié côté backend, chaque
 * ligne valide est créée en appelant `createInstance` (POST /instances,
 * déjà protégé ADMIN/VALIDATOR) en parallèle via `Promise.allSettled`.
 * Composants et niveaux de support (trop imbriqués pour une ligne de
 * tableur) ne sont pas pris en charge — à compléter ensuite via la fiche
 * d'édition de l'instance. `onDone` est appelé une fois le rapport
 * affiché et fermé par l'utilisateur, avec le nombre d'instances
 * effectivement créées (le parent recharge la liste si > 0).
 */
export default function BulkInstanceImportModal({
  clients,
  services,
  statutInstances,
  environments,
  hostings,
  pods,
  onClose,
  onDone,
}: BulkInstanceImportModalProps) {
  const titleId = "bulk-instance-import-modal-title";
  const [formatError, setFormatError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);

  const validRows = rows.filter((row) => !row.error);
  const invalidRows = rows.filter((row) => row.error);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setResults(null);
    setRows([]);
    setFormatError(null);

    if (!file) return;

    let fileRows: string[][];
    try {
      fileRows = isExcelFile(file) ? await parseExcel(file) : parseCsv(await file.text());
    } catch {
      setFormatError("Impossible de lire ce fichier — vérifiez qu'il s'agit bien d'un CSV ou d'un Excel valide.");
      return;
    }

    const { rows: parsedRows, formatError: parseError } = buildParsedRows(
      fileRows,
      clients,
      pods,
      services,
      statutInstances,
      environments,
      hostings
    );

    if (parseError) {
      setFormatError(parseError);
      return;
    }

    setRows(parsedRows);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modele-import-instances.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setIsSubmitting(true);

    const settled = await Promise.allSettled(
      validRows.map((row) =>
        createInstance({
          name: row.name,
          clientId: row.clientId as number,
          podId: row.podId as number,
          serviceId: row.serviceId as number,
          statutInstanceId: row.statutInstanceId as number,
          comments: row.comments || undefined,
          produitOceane: row.produitOceane || undefined,
          environmentIds: row.environmentIds,
          hostingIds: row.hostingIds,
        })
      )
    );

    const rowResults: RowResult[] = settled.map((outcome, index) => {
      const row = validRows[index];

      if (outcome.status === "fulfilled") {
        const created = outcome.value as ManagedInstance;
        return { rowNumber: row.rowNumber, name: created.name, status: "success", message: "Créée." };
      }

      return {
        rowNumber: row.rowNumber,
        name: row.name,
        status: "error",
        message: getApiErrorMessage(outcome.reason),
      };
    });

    setResults(rowResults);
    setIsSubmitting(false);
  };

  const handleFinish = () => {
    onDone(results?.filter((result) => result.status === "success").length ?? 0);
  };

  return (
    <ModalShell
      titleId={titleId}
      title="Importer des instances en masse"
      onClose={onClose}
      size="xl"
      scrollable
      footer={
        results ? (
          <button type="button" className="btn btn-primary" onClick={handleFinish}>
            Terminé
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={validRows.length === 0 || isSubmitting}
              onClick={handleImport}
            >
              {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {validRows.length > 0
                ? `Créer ${validRows.length} instance${validRows.length > 1 ? "s" : ""}`
                : "Créer"}
            </button>
          </>
        )
      }
    >
      {results ? (
        <>
          <p className="mb-3">
            {results.filter((result) => result.status === "success").length} instance(s) créée(s),{" "}
            {results.filter((result) => result.status === "error").length} échec(s).
          </p>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Ligne</th>
                  <th scope="col">Nom</th>
                  <th scope="col">Résultat</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.rowNumber}>
                    <td>{result.rowNumber}</td>
                    <td>{result.name}</td>
                    <td>
                      {result.status === "success" ? (
                        <span className="text-success">
                          <i className="bi bi-check-circle me-1" aria-hidden="true" />
                          {result.message}
                        </span>
                      ) : (
                        <span className="text-danger">
                          <i className="bi bi-x-circle me-1" aria-hidden="true" />
                          {result.message}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <p className="text-body-secondary">
            Le fichier (CSV ou Excel) doit contenir les colonnes <strong>nom</strong>, <strong>client</strong>,{" "}
            <strong>pod</strong>, <strong>service</strong> et <strong>statut</strong> (chaque libellé doit
            correspondre exactement à un élément existant), et facultativement{" "}
            <strong>environnements</strong> / <strong>sites d&apos;hébergement</strong> (plusieurs valeurs
            séparées par <code>;</code>), <strong>produit océane</strong> et <strong>commentaires</strong>. Les
            composants et niveaux de support ne sont pas importables ici — à ajouter ensuite via l&apos;édition
            de l&apos;instance.
          </p>

          <button type="button" className="btn btn-link p-0 mb-3" onClick={handleDownloadTemplate}>
            <i className="bi bi-download me-1" aria-hidden="true" />
            Télécharger un modèle CSV
          </button>

          <div className="mb-3">
            <label htmlFor="bulk-instance-import-file" className="form-label">
              Fichier CSV ou Excel
            </label>
            <input
              id="bulk-instance-import-file"
              type="file"
              accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="form-control"
              onChange={handleFileChange}
            />
          </div>

          {formatError && (
            <div className="alert alert-danger" role="alert">
              {formatError}
            </div>
          )}

          {rows.length > 0 && (
            <>
              <p className="mb-2">
                <span className="text-success fw-semibold">{validRows.length} ligne(s) valide(s)</span>
                {invalidRows.length > 0 && (
                  <span className="text-danger fw-semibold ms-3">{invalidRows.length} ligne(s) invalide(s)</span>
                )}
              </p>

              <div className="table-responsive" style={{ maxHeight: "18rem", overflowY: "auto" }}>
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Ligne</th>
                      <th scope="col">Nom</th>
                      <th scope="col">Client</th>
                      <th scope="col">Pod</th>
                      <th scope="col">Service</th>
                      <th scope="col">Statut</th>
                      <th scope="col">Environnements</th>
                      <th scope="col">Hébergements</th>
                      <th scope="col">Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowNumber} className={row.error ? "table-danger" : undefined}>
                        <td>{row.rowNumber}</td>
                        <td>{row.name || "—"}</td>
                        <td>{row.clientLabel || "—"}</td>
                        <td>{row.podLabel || "—"}</td>
                        <td>{row.serviceLabel || "—"}</td>
                        <td>{row.statutLabel || "—"}</td>
                        <td>{row.environmentLabels.length > 0 ? row.environmentLabels.join(", ") : "—"}</td>
                        <td>{row.hostingLabels.length > 0 ? row.hostingLabels.join(", ") : "—"}</td>
                        <td>
                          {row.error ? (
                            <span className="text-danger small">{row.error}</span>
                          ) : (
                            <span className="text-success">
                              <i className="bi bi-check-circle" aria-hidden="true" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </ModalShell>
  );
}
