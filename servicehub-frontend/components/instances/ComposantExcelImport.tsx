"use client";

import { useState, type ChangeEvent } from "react";
import ExcelJS from "exceljs";
import { parseCsvFile } from "@/lib/csv";
import { parseExcel } from "@/lib/excel";
import type { InstanceFormValues } from "./InstanceFormModal";

type ComposantValue = NonNullable<InstanceFormValues["composants"]>[number];

export type ImportablePlatform = {
  id: number;
  name: string;
  hostingName: string;
};

type ComposantExcelImportProps = {
  // Plateformes des hébergements cochés pour l'instance — les seules
  // qu'un composant peut référencer (même règle que la saisie manuelle).
  platforms: ImportablePlatform[];
  getCurrentComposants: () => ComposantValue[];
  onApply: (composants: ComposantValue[]) => void;
};

type ImportMode = "merge" | "replace";

type RowError = { rowNumber: number; message: string };

type Analysis = {
  composants: ComposantValue[];
  validRows: number;
  errors: RowError[];
  composantsAdded: number;
  inventairesAdded: number;
  inventairesSkipped: number;
};

const EXCEL_EXTENSIONS = [".xlsx", ".xls"];
const REFERENCE_SHEET_NAME = "Plateformes";
const TEMPLATE_MAX_ROWS = 500;

const HEADER_ALIASES = {
  composant: ["composant", "nom du composant", "composants"],
  description: ["description", "description du composant"],
  plateforme: ["plateforme", "platform"],
  ip: ["ip", "adresse ip", "@ip"],
  nomServeur: ["nom serveur", "nom du serveur", "nom de serveur", "serveur", "hostname"],
} as const;

const IPV4_PATTERN = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_PATTERN = /^[0-9a-f:.]+$/i;

function isValidIp(value: string): boolean {
  return IPV4_PATTERN.test(value) || (value.includes(":") && IPV6_PATTERN.test(value));
}

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function isExcelFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return EXCEL_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

// Modèle .xlsx : une ligne = un serveur (IP + nom) d'un composant ;
// plusieurs lignes portant le même composant sont regroupées. Liste
// déroulante sur la colonne Plateforme (plateformes des hébergements
// cochés dans le formulaire).
async function buildTemplate(platforms: ImportablePlatform[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Composants");
  sheet.columns = [
    { header: "Composant", key: "composant", width: 26 },
    { header: "Description", key: "description", width: 34 },
    { header: "Plateforme", key: "plateforme", width: 22 },
    { header: "IP", key: "ip", width: 18 },
    { header: "Nom serveur", key: "nomServeur", width: 24 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF7900" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const examplePlatform = platforms[0]?.name ?? "";
  sheet.addRow({
    composant: "Serveur applicatif",
    description: "Exemple — à remplacer ou supprimer",
    plateforme: examplePlatform,
    ip: "10.0.0.11",
    nomServeur: "srv-app-01",
  });
  sheet.addRow({ composant: "Serveur applicatif", ip: "10.0.0.12", nomServeur: "srv-app-02" });
  sheet.addRow({ composant: "Base de données", ip: "10.0.0.21", nomServeur: "srv-db-01" });
  [2, 3, 4].forEach((rowNumber) => {
    sheet.getRow(rowNumber).font = { italic: true, color: { argb: "FF808080" } };
  });

  const refSheet = workbook.addWorksheet(REFERENCE_SHEET_NAME);
  refSheet.columns = [
    { header: "Plateforme", key: "name", width: 24 },
    { header: "Hébergement", key: "hostingName", width: 26 },
  ];
  refSheet.getRow(1).font = { bold: true };
  platforms.forEach((platform) => refSheet.addRow({ name: platform.name, hostingName: platform.hostingName }));

  if (platforms.length > 0) {
    for (let row = 2; row <= TEMPLATE_MAX_ROWS; row += 1) {
      sheet.getCell(`C${row}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`'${REFERENCE_SHEET_NAME}'!$A$2:$A$${platforms.length + 1}`],
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// Analyse le fichier et calcule la nouvelle liste de composants du
// formulaire : en mode "merge", à partir des composants déjà saisis (un
// composant de même nom est complété, un serveur déjà présent — même IP +
// même nom — est ignoré) ; en mode "replace", à partir d'une liste vide.
function analyze(
  fileRows: string[][],
  platforms: ImportablePlatform[],
  currentComposants: ComposantValue[],
  mode: ImportMode
): { analysis: Analysis | null; formatError: string | null } {
  if (fileRows.length === 0) return { analysis: null, formatError: "Le fichier est vide." };

  const [header, ...dataRows] = fileRows;
  const columnIndex = (aliases: readonly string[]) =>
    header.findIndex((cell) => aliases.includes(cell.trim().toLowerCase()));
  const indexes = {
    composant: columnIndex(HEADER_ALIASES.composant),
    description: columnIndex(HEADER_ALIASES.description),
    plateforme: columnIndex(HEADER_ALIASES.plateforme),
    ip: columnIndex(HEADER_ALIASES.ip),
    nomServeur: columnIndex(HEADER_ALIASES.nomServeur),
  };

  if (indexes.composant === -1) {
    return { analysis: null, formatError: 'Colonne "Composant" introuvable dans le fichier.' };
  }
  if (dataRows.length === 0) {
    return { analysis: null, formatError: "Le fichier ne contient aucune ligne de données." };
  }

  const cell = (cells: string[], index: number) => (index >= 0 ? (cells[index] ?? "").trim() : "");

  const composants: ComposantValue[] =
    mode === "merge"
      ? currentComposants.map((composant) => ({ ...composant, inventaires: [...(composant.inventaires ?? [])] }))
      : [];
  const byName = new Map(composants.map((composant) => [normalize(composant.name), composant]));

  const analysis: Analysis = {
    composants,
    validRows: 0,
    errors: [],
    composantsAdded: 0,
    inventairesAdded: 0,
    inventairesSkipped: 0,
  };

  dataRows.forEach((cells, index) => {
    const rowNumber = index + 2;
    const name = cell(cells, indexes.composant);
    const description = cell(cells, indexes.description);
    const platformLabel = cell(cells, indexes.plateforme);
    const ip = cell(cells, indexes.ip);
    const nomServeur = cell(cells, indexes.nomServeur);
    const fail = (message: string) => analysis.errors.push({ rowNumber, message });

    if (!name) return fail("Composant manquant.");
    if (name.length > 150) return fail("Nom de composant trop long (150 caractères max).");
    if (description.length > 255) return fail("Description trop longue (255 caractères max).");
    if (Boolean(ip) !== Boolean(nomServeur)) {
      return fail("Renseignez l'IP et le nom de serveur, ou aucun des deux.");
    }
    if (ip && !isValidIp(ip)) return fail(`Adresse IP invalide : "${ip}".`);
    if (ip.length > 45) return fail("IP trop longue (45 caractères max).");
    if (nomServeur.length > 150) return fail("Nom de serveur trop long (150 caractères max).");

    let platformId: string | undefined;
    if (platformLabel) {
      const matches = platforms.filter((platform) => normalize(platform.name) === normalize(platformLabel));
      if (matches.length === 0) {
        return fail(
          `Plateforme "${platformLabel}" introuvable parmi les hébergements cochés de l'instance.`
        );
      }
      if (matches.length > 1) {
        return fail(`Plateforme "${platformLabel}" ambiguë : elle existe sur plusieurs hébergements cochés.`);
      }
      platformId = String(matches[0].id);
    }

    analysis.validRows += 1;

    let composant = byName.get(normalize(name));
    if (!composant) {
      composant = { name, description, platformId: platformId ?? "", inventaires: [] };
      composants.push(composant);
      byName.set(normalize(name), composant);
      analysis.composantsAdded += 1;
    } else {
      if (description) composant.description = description;
      if (platformId) composant.platformId = platformId;
    }

    if (ip) {
      const inventaires = composant.inventaires ?? [];
      const exists = inventaires.some(
        (inventaire) => inventaire.ip === ip && normalize(inventaire.nomServeur) === normalize(nomServeur)
      );
      if (exists) {
        analysis.inventairesSkipped += 1;
      } else {
        composant.inventaires = [...inventaires, { ip, nomServeur }];
        analysis.inventairesAdded += 1;
      }
    }
  });

  return { analysis, formatError: null };
}

/**
 * Import des composants et inventaires depuis un fichier Excel/CSV, DANS le
 * formulaire d'instance (création ou modification) — jamais en dehors :
 * le fichier est analysé côté navigateur et remplit la liste
 * `composants` du formulaire, que l'utilisateur peut ensuite relire et
 * corriger. Rien n'est envoyé au backend avant l'enregistrement de
 * l'instance (même payload `composants` que la saisie manuelle).
 */
export default function ComposantExcelImport({ platforms, getCurrentComposants, onApply }: ComposantExcelImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [fileRows, setFileRows] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [isBuildingTemplate, setIsBuildingTemplate] = useState(false);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

  // Recalculée à chaque rendu : suit le mode choisi et les plateformes
  // disponibles (si l'utilisateur coche un hébergement entre-temps).
  const { analysis, formatError: analysisError } = fileRows
    ? analyze(fileRows, platforms, getCurrentComposants(), mode)
    : { analysis: null, formatError: null };
  const error = formatError ?? analysisError;

  const resetFile = () => {
    setFileRows(null);
    setFileName(null);
    setFormatError(null);
  };

  const handleDownloadTemplate = async () => {
    setIsBuildingTemplate(true);
    try {
      const blob = await buildTemplate(platforms);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "modele-composants.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsBuildingTemplate(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    resetFile();
    setAppliedMessage(null);
    if (!file) return;

    setFileName(file.name);
    try {
      setFileRows(isExcelFile(file) ? await parseExcel(file) : await parseCsvFile(file));
    } catch {
      setFormatError("Impossible de lire ce fichier — vérifiez qu'il s'agit bien d'un Excel ou d'un CSV valide.");
    }
    event.target.value = "";
  };

  const handleApply = () => {
    if (!analysis) return;
    onApply(analysis.composants);
    setAppliedMessage(
      `${analysis.composantsAdded} composant(s) et ${analysis.inventairesAdded} inventaire(s) ajoutés au formulaire. Vérifiez-les ci-dessous, puis enregistrez l'instance.`
    );
    resetFile();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <>
        {appliedMessage && (
          <div className="alert alert-success alert-dismissible small py-2 mb-2" role="status">
            <i className="bi bi-check-circle me-2" aria-hidden="true" />
            {appliedMessage}
            <button
              type="button"
              className="btn-close btn-sm"
              aria-label="Fermer"
              onClick={() => setAppliedMessage(null)}
            />
          </div>
        )}
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setIsOpen(true)}>
          <i className="bi bi-file-earmark-excel me-1" aria-hidden="true" />
          Importer depuis Excel
        </button>
      </>
    );
  }

  return (
    <div className="border rounded-3 p-3 mb-3 bg-body-tertiary">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="fw-semibold">
          <i className="bi bi-file-earmark-excel me-2" aria-hidden="true" />
          Importer des composants depuis Excel
        </span>
        <button
          type="button"
          className="btn-close btn-sm"
          aria-label="Fermer l'import"
          onClick={() => {
            resetFile();
            setIsOpen(false);
          }}
        />
      </div>

      <p className="small text-body-secondary mb-2">
        Une ligne par serveur (IP + nom de serveur). Répétez le nom du composant pour lui ajouter plusieurs serveurs ;
        laissez IP et nom de serveur vides pour un composant seul. Les composants sont ajoutés au formulaire :
        rien n&apos;est enregistré tant que l&apos;instance n&apos;est pas enregistrée.
      </p>

      {platforms.length === 0 && (
        <p className="small text-warning-emphasis mb-2">
          <i className="bi bi-info-circle me-1" aria-hidden="true" />
          Aucune plateforme disponible : cochez d&apos;abord les hébergements de l&apos;instance (étape 1) pour
          pouvoir renseigner la colonne Plateforme.
        </p>
      )}

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={handleDownloadTemplate}
          disabled={isBuildingTemplate}
        >
          {isBuildingTemplate ? (
            <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />
          ) : (
            <i className="bi bi-download me-1" aria-hidden="true" />
          )}
          Télécharger le modèle
        </button>
        <label className="btn btn-sm btn-outline-primary mb-0">
          <i className="bi bi-upload me-1" aria-hidden="true" />
          {fileName ? "Changer de fichier" : "Choisir un fichier"}
          <input
            type="file"
            hidden
            accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileChange}
          />
        </label>
        {fileName && <span className="small text-body-secondary text-truncate">{fileName}</span>}
      </div>

      <div className="d-flex flex-wrap gap-3 mb-2 small">
        <div className="form-check mb-0">
          <input
            id="composant-import-mode-merge"
            className="form-check-input"
            type="radio"
            name="composant-import-mode"
            checked={mode === "merge"}
            onChange={() => setMode("merge")}
          />
          <label className="form-check-label" htmlFor="composant-import-mode-merge">
            Ajouter aux composants actuels
          </label>
        </div>
        <div className="form-check mb-0">
          <input
            id="composant-import-mode-replace"
            className="form-check-input"
            type="radio"
            name="composant-import-mode"
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
          />
          <label className="form-check-label" htmlFor="composant-import-mode-replace">
            Remplacer les composants actuels
          </label>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger small py-2 mb-2" role="alert">
          {error}
        </div>
      )}

      {analysis && (
        <>
          <div className="d-flex flex-wrap gap-2 mb-2 small">
            <span className="badge rounded-pill text-bg-success">{analysis.validRows} ligne(s) valide(s)</span>
            {analysis.errors.length > 0 && (
              <span className="badge rounded-pill text-bg-danger">{analysis.errors.length} ligne(s) en erreur</span>
            )}
            <span className="badge rounded-pill bg-body-secondary text-body">
              +{analysis.composantsAdded} composant(s)
            </span>
            <span className="badge rounded-pill bg-body-secondary text-body">
              +{analysis.inventairesAdded} inventaire(s)
            </span>
            {analysis.inventairesSkipped > 0 && (
              <span className="badge rounded-pill bg-body-secondary text-body-secondary">
                {analysis.inventairesSkipped} doublon(s) ignoré(s)
              </span>
            )}
          </div>

          {analysis.errors.length > 0 && (
            <ul className="list-unstyled small text-danger mb-2" style={{ maxHeight: "8rem", overflowY: "auto" }}>
              {analysis.errors.map((rowError) => (
                <li key={rowError.rowNumber}>
                  <i className="bi bi-x-circle me-1" aria-hidden="true" />
                  Ligne {rowError.rowNumber} : {rowError.message}
                </li>
              ))}
            </ul>
          )}

          {mode === "replace" && (
            <p className="small text-warning-emphasis mb-2">
              <i className="bi bi-exclamation-triangle me-1" aria-hidden="true" />
              Les composants actuellement saisis seront remplacés par ceux du fichier.
            </p>
          )}

          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={analysis.validRows === 0}
            onClick={handleApply}
          >
            <i className="bi bi-check2 me-1" aria-hidden="true" />
            Ajouter au formulaire
            {analysis.errors.length > 0 ? " (lignes valides uniquement)" : ""}
          </button>
        </>
      )}
    </div>
  );
}
