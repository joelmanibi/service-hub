"use client";

import { useState, type ChangeEvent } from "react";
import ModalShell from "@/components/users/ModalShell";
import { parseCsv } from "@/lib/csv";
import { parseExcel } from "@/lib/excel";
import { createCatalogService } from "@/services/catalog.service";
import type { ServiceType } from "@/services/serviceTypes.service";
import type { CloudServiceModel } from "@/services/cloudServiceModels.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ParsedRow = {
  rowNumber: number;
  name: string;
  description: string;
  serviceTypeLabel: string;
  serviceTypeId: number | null;
  cloudServiceModelLabels: string[];
  cloudServiceModelIds: number[];
  error: string | null;
};

type RowResult = {
  rowNumber: number;
  name: string;
  status: "success" | "error";
  message: string;
};

type BulkServiceImportModalProps = {
  serviceTypes: ServiceType[];
  cloudServiceModels: CloudServiceModel[];
  onClose: () => void;
  onDone: (createdCount: number) => void;
};

const EXCEL_EXTENSIONS = [".xlsx", ".xls"];

const HEADER_ALIASES = {
  name: ["nom", "name"],
  serviceType: ["type de service", "type", "servicetype", "service type"],
  cloudServiceModel: ["modèle cloud", "modele cloud", "modèle de service cloud", "cloud service model", "cloud model"],
  description: ["description"],
};

const TEMPLATE_CSV =
  'nom,type de service,modèle cloud,description\r\n' +
  'MAXIT,Business App,IAAS;PAAS,"Exemple de description, avec une virgule si besoin"\r\n';

function findColumnIndex(headerRow: string[], aliases: string[]): number {
  return headerRow.findIndex((cell) => aliases.includes(cell.trim().toLowerCase()));
}

function isExcelFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return EXCEL_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

// Aligné sur les validators Joi du backend (modules/catalog/validator.js
// — createServiceSchema) : `code` généré côté backend, `serviceTypeId`
// et `cloudServiceModelIds` résolus ici par libellé (l'id brut n'est pas
// exploitable depuis un fichier préparé par un humain). Le modèle de
// service cloud est facultatif et multi-valué dans une même cellule
// (séparés par `;`, ex: "IAAS;PAAS") — un service peut relever de
// plusieurs modèles à la fois ; le type de service reste obligatoire,
// mono-valué, reconnu par nom.
function buildParsedRows(
  fileRows: string[][],
  serviceTypes: ServiceType[],
  cloudServiceModels: CloudServiceModel[]
): { rows: ParsedRow[]; formatError: string | null } {
  if (fileRows.length === 0) {
    return { rows: [], formatError: "Le fichier est vide." };
  }

  const [header, ...dataRows] = fileRows;
  const nameIndex = findColumnIndex(header, HEADER_ALIASES.name);
  const typeIndex = findColumnIndex(header, HEADER_ALIASES.serviceType);
  const cloudModelIndex = findColumnIndex(header, HEADER_ALIASES.cloudServiceModel);
  const descriptionIndex = findColumnIndex(header, HEADER_ALIASES.description);

  if (nameIndex === -1 || typeIndex === -1) {
    return {
      rows: [],
      formatError: 'Colonnes attendues introuvables : "nom" et "type de service" sont obligatoires.',
    };
  }

  if (dataRows.length === 0) {
    return { rows: [], formatError: "Le fichier ne contient aucune ligne de données." };
  }

  const rows: ParsedRow[] = dataRows.map((cells, index) => {
    const name = cells[nameIndex]?.trim() ?? "";
    const serviceTypeLabel = cells[typeIndex]?.trim() ?? "";
    const cloudServiceModelLabels =
      cloudModelIndex >= 0
        ? (cells[cloudModelIndex] ?? "")
            .split(";")
            .map((label) => label.trim())
            .filter((label) => label !== "")
        : [];
    const description = descriptionIndex >= 0 ? (cells[descriptionIndex]?.trim() ?? "") : "";

    const matchedType = serviceTypes.find(
      (type) => type.name.trim().toLowerCase() === serviceTypeLabel.toLowerCase()
    );
    const matchedCloudModels = cloudServiceModelLabels.map((label) => ({
      label,
      model: cloudServiceModels.find(
        (item) =>
          item.code.trim().toLowerCase() === label.toLowerCase() || item.name.trim().toLowerCase() === label.toLowerCase()
      ),
    }));
    const unknownCloudModelLabels = matchedCloudModels.filter((item) => !item.model).map((item) => item.label);

    let error: string | null = null;
    if (!name) {
      error = "Nom manquant.";
    } else if (!serviceTypeLabel) {
      error = "Type de service manquant.";
    } else if (!matchedType) {
      error = `Type de service inconnu : "${serviceTypeLabel}".`;
    } else if (unknownCloudModelLabels.length > 0) {
      error = `Modèle(s) de service cloud inconnu(s) : ${unknownCloudModelLabels.map((label) => `"${label}"`).join(", ")}.`;
    }

    return {
      rowNumber: index + 2, // +1 pour la ligne d'en-tête, +1 pour repasser en 1-based
      name,
      description,
      serviceTypeLabel,
      serviceTypeId: matchedType?.id ?? null,
      cloudServiceModelLabels,
      cloudServiceModelIds: matchedCloudModels
        .map((item) => item.model?.id)
        .filter((id): id is number => id !== undefined),
      error,
    };
  });

  return { rows, formatError: null };
}

/**
 * Modale d'import en masse de services (Bootstrap Modal), à partir d'un
 * fichier CSV ou Excel (.xlsx/.xls — lib/excel.ts, via `exceljs`, dont
 * la première feuille est ramenée à la même forme que lib/csv.ts pour un
 * traitement identique ensuite). Le fichier est analysé et validé
 * entièrement côté client — aucun endpoint dédié côté backend : chaque
 * ligne valide est créée en appelant `createCatalogService`
 * (POST /catalog/services, déjà protégé ADMIN/VALIDATOR), en parallèle
 * via `Promise.allSettled` pour que l'échec d'une ligne n'empêche pas la
 * création des autres. `onDone` est appelé une fois le rapport affiché
 * et fermé par l'utilisateur, avec le nombre de services effectivement
 * créés (le parent recharge la liste si > 0).
 */
export default function BulkServiceImportModal({
  serviceTypes,
  cloudServiceModels,
  onClose,
  onDone,
}: BulkServiceImportModalProps) {
  const titleId = "bulk-service-import-modal-title";
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
      serviceTypes,
      cloudServiceModels
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
    link.download = "modele-import-services.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setIsSubmitting(true);

    const settled = await Promise.allSettled(
      validRows.map((row) =>
        createCatalogService({
          name: row.name,
          serviceTypeId: row.serviceTypeId as number,
          description: row.description || undefined,
          cloudServiceModelIds: row.cloudServiceModelIds,
        })
      )
    );

    const rowResults: RowResult[] = settled.map((outcome, index) => {
      const row = validRows[index];

      if (outcome.status === "fulfilled") {
        return { rowNumber: row.rowNumber, name: outcome.value.name, status: "success", message: "Créé." };
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
      title="Importer des services en masse"
      onClose={onClose}
      size="lg"
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
                ? `Créer ${validRows.length} service${validRows.length > 1 ? "s" : ""}`
                : "Créer"}
            </button>
          </>
        )
      }
    >
      {results ? (
        <>
          <p className="mb-3">
            {results.filter((result) => result.status === "success").length} service(s) créé(s),{" "}
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
            Le fichier (CSV ou Excel) doit contenir les colonnes <strong>nom</strong> et{" "}
            <strong>type de service</strong> (le nom du type doit correspondre exactement à un type existant),
            et facultativement <strong>modèle cloud</strong> (un ou plusieurs codes IAAS/PAAS/SAAS/FAAS/CAAS —
            ou noms complets — séparés par <code>;</code>) et <strong>description</strong>.
          </p>

          <button type="button" className="btn btn-link p-0 mb-3" onClick={handleDownloadTemplate}>
            <i className="bi bi-download me-1" aria-hidden="true" />
            Télécharger un modèle CSV
          </button>

          <div className="mb-3">
            <label htmlFor="bulk-import-file" className="form-label">
              Fichier CSV ou Excel
            </label>
            <input
              id="bulk-import-file"
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
                      <th scope="col">Type de service</th>
                      <th scope="col">Modèle cloud</th>
                      <th scope="col">Description</th>
                      <th scope="col">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowNumber} className={row.error ? "table-danger" : undefined}>
                        <td>{row.rowNumber}</td>
                        <td>{row.name || "—"}</td>
                        <td>{row.serviceTypeLabel || "—"}</td>
                        <td>{row.cloudServiceModelLabels.length > 0 ? row.cloudServiceModelLabels.join(", ") : "—"}</td>
                        <td className="text-truncate" style={{ maxWidth: "10rem" }}>
                          {row.description || "—"}
                        </td>
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
