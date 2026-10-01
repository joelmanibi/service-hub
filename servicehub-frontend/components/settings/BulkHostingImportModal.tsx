"use client";

import { useState, type ChangeEvent } from "react";
import ModalShell from "@/components/users/ModalShell";
import { parseCsvFile } from "@/lib/csv";
import { parseExcel } from "@/lib/excel";
import { createHosting } from "@/services/hostings.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ParsedRow = {
  rowNumber: number;
  name: string;
  code: string;
  description: string;
  platformLabels: string[];
  error: string | null;
};

type RowResult = {
  rowNumber: number;
  name: string;
  status: "success" | "error";
  message: string;
};

type BulkHostingImportModalProps = {
  onClose: () => void;
  onDone: (createdCount: number) => void;
};

const EXCEL_EXTENSIONS = [".xlsx", ".xls"];

const HEADER_ALIASES = {
  name: ["nom", "name"],
  code: ["code"],
  platforms: ["plateformes", "plateforme", "platforms", "platform"],
  description: ["description"],
};

const TEMPLATE_CSV =
  'nom,code,plateformes,description\r\n' +
  'Datacenter Abidjan,DC-ABJ,VMware;Kubernetes,"Site principal, Abidjan"\r\n';

function findColumnIndex(headerRow: string[], aliases: string[]): number {
  return headerRow.findIndex((cell) => aliases.includes(cell.trim().toLowerCase()));
}

function isExcelFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return EXCEL_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

// Aligné sur les validators Joi du backend (modules/settings/validator.js
// — createHostingSchema) : `name`/`code` obligatoires, `platforms` est un
// tableau de `{ name }` sans `id` (toujours une création, jamais un diff
// — cf. modules/settings/service.js#syncPlatforms). Contrairement au type
// de service ou au modèle cloud, la Plateforme n'est pas un référentiel
// partagé : aucune correspondance à chercher dans une liste existante,
// les libellés de la cellule sont directement les noms des nouvelles
// plateformes à créer pour cet hébergement.
function buildParsedRows(fileRows: string[][]): { rows: ParsedRow[]; formatError: string | null } {
  if (fileRows.length === 0) {
    return { rows: [], formatError: "Le fichier est vide." };
  }

  const [header, ...dataRows] = fileRows;
  const nameIndex = findColumnIndex(header, HEADER_ALIASES.name);
  const codeIndex = findColumnIndex(header, HEADER_ALIASES.code);
  const platformsIndex = findColumnIndex(header, HEADER_ALIASES.platforms);
  const descriptionIndex = findColumnIndex(header, HEADER_ALIASES.description);

  if (nameIndex === -1 || codeIndex === -1) {
    return {
      rows: [],
      formatError: 'Colonnes attendues introuvables : "nom" et "code" sont obligatoires.',
    };
  }

  if (dataRows.length === 0) {
    return { rows: [], formatError: "Le fichier ne contient aucune ligne de données." };
  }

  const rows: ParsedRow[] = dataRows.map((cells, index) => {
    const name = cells[nameIndex]?.trim() ?? "";
    const code = cells[codeIndex]?.trim() ?? "";
    const platformLabels =
      platformsIndex >= 0
        ? (cells[platformsIndex] ?? "")
            .split(";")
            .map((label) => label.trim())
            .filter((label) => label !== "")
        : [];
    const description = descriptionIndex >= 0 ? (cells[descriptionIndex]?.trim() ?? "") : "";

    let error: string | null = null;
    if (!name) {
      error = "Nom manquant.";
    } else if (!code) {
      error = "Code manquant.";
    }

    return {
      rowNumber: index + 2, // +1 pour la ligne d'en-tête, +1 pour repasser en 1-based
      name,
      code,
      description,
      platformLabels,
      error,
    };
  });

  return { rows, formatError: null };
}

/**
 * Modale d'import en masse de Hébergements (Bootstrap Modal), avec leurs
 * Plateformes associées, à partir d'un fichier CSV ou Excel — même
 * approche que BulkServiceImportModal/BulkInstanceImportModal : analyse
 * et validation entièrement côté client, aucun endpoint dédié côté
 * backend. Chaque ligne valide est créée en appelant `createHosting`
 * (POST /settings/hostings, déjà protégé ADMIN/VALIDATOR) avec ses
 * plateformes imbriquées dans le même payload, en parallèle via
 * `Promise.allSettled` pour que l'échec d'une ligne n'empêche pas la
 * création des autres.
 */
export default function BulkHostingImportModal({ onClose, onDone }: BulkHostingImportModalProps) {
  const titleId = "bulk-hosting-import-modal-title";
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
      fileRows = isExcelFile(file) ? await parseExcel(file) : await parseCsvFile(file);
    } catch {
      setFormatError("Impossible de lire ce fichier — vérifiez qu'il s'agit bien d'un CSV ou d'un Excel valide.");
      return;
    }

    const { rows: parsedRows, formatError: parseError } = buildParsedRows(fileRows);

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
    link.download = "modele-import-hebergements.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setIsSubmitting(true);

    const settled = await Promise.allSettled(
      validRows.map((row) =>
        createHosting({
          name: row.name,
          code: row.code,
          description: row.description || undefined,
          platforms: row.platformLabels.map((label) => ({ name: label })),
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
      title="Importer des hébergements en masse"
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
                ? `Créer ${validRows.length} hébergement${validRows.length > 1 ? "s" : ""}`
                : "Créer"}
            </button>
          </>
        )
      }
    >
      {results ? (
        <>
          <p className="mb-3">
            {results.filter((result) => result.status === "success").length} hébergement(s) créé(s),{" "}
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
            Le fichier (CSV ou Excel) doit contenir les colonnes <strong>nom</strong> et <strong>code</strong>, et
            facultativement <strong>plateformes</strong> (une ou plusieurs, séparées par <code>;</code> — ex :
            &laquo;&nbsp;VMware;Kubernetes&nbsp;&raquo; — créées directement pour cet hébergement, aucune plateforme
            existante n&apos;est réutilisée) et <strong>description</strong>.
          </p>

          <button type="button" className="btn btn-link p-0 mb-3" onClick={handleDownloadTemplate}>
            <i className="bi bi-download me-1" aria-hidden="true" />
            Télécharger un modèle CSV
          </button>

          <div className="mb-3">
            <label htmlFor="bulk-hosting-import-file" className="form-label">
              Fichier CSV ou Excel
            </label>
            <input
              id="bulk-hosting-import-file"
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
                      <th scope="col">Code</th>
                      <th scope="col">Plateformes</th>
                      <th scope="col">Description</th>
                      <th scope="col">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowNumber} className={row.error ? "table-danger" : undefined}>
                        <td>{row.rowNumber}</td>
                        <td>{row.name || "—"}</td>
                        <td>{row.code || "—"}</td>
                        <td>{row.platformLabels.length > 0 ? row.platformLabels.join(", ") : "—"}</td>
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
