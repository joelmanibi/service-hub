"use client";

import { useState, type ChangeEvent } from "react";
import ExcelJS from "exceljs";
import ModalShell from "./ModalShell";
import type { ManagedUser, Role } from "./mockUsers";
import { ROLE_LABELS } from "./mockUsers";
import { parseCsvFile } from "@/lib/csv";
import { parseExcel } from "@/lib/excel";
import { createUser } from "@/services/users.service";
import type { Pod } from "@/services/pods.service";
import { getApiErrorMessage } from "@/lib/apiError";

type ParsedRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  login: string;
  loginGenerated: boolean;
  role: Role;
  podLabels: string[];
  podIds: number[];
  error: string | null;
};

type RowResult = {
  rowNumber: number;
  name: string;
  status: "success" | "error";
  message: string;
};

type BulkUserImportModalProps = {
  pods: Pod[];
  onClose: () => void;
  onDone: (createdCount: number) => void;
};

const EXCEL_EXTENSIONS = [".xlsx", ".xls"];
const REFERENCE_SHEET_NAME = "Valeurs autorisées";
const TEMPLATE_MAX_ROWS = 500;
// Créations envoyées par lots : évite une rafale de centaines de requêtes
// simultanées sur le backend pour un gros fichier.
const BATCH_SIZE = 5;

const ROLE_VALUES: Role[] = ["ADMIN", "VALIDATOR", "USER"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HEADER_ALIASES = {
  firstName: ["prénom", "prenom", "first name", "firstname"],
  lastName: ["nom", "last name", "lastname"],
  email: ["email", "e-mail", "mail"],
  phone: ["téléphone", "telephone", "tél", "tel", "phone"],
  login: ["login", "identifiant"],
  role: ["rôle", "role"],
  pods: ["pods", "pod"],
} as const;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// Rôle accepté sous sa forme technique (ADMIN) ou son libellé
// (Administrateur) ; vide = Utilisateur.
function resolveRole(label: string): Role | null {
  if (!label.trim()) return "USER";
  const key = normalize(label);
  return ROLE_VALUES.find((role) => normalize(role) === key || normalize(ROLE_LABELS[role]) === key) ?? null;
}

function isExcelFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return EXCEL_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

// Modèle .xlsx : feuille "Utilisateurs" (une ligne par compte) + feuille
// "Valeurs autorisées" (rôles et pods existants). Liste déroulante sur la
// colonne Rôle ; la colonne Pods accepte plusieurs codes séparés par `;`
// (une liste déroulante Excel n'autorise qu'une valeur par cellule).
async function buildTemplate(pods: Pod[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Utilisateurs");
  sheet.columns = [
    { header: "Prénom", key: "firstName", width: 18 },
    { header: "Nom", key: "lastName", width: 18 },
    { header: "Email", key: "email", width: 32 },
    { header: "Téléphone", key: "phone", width: 18 },
    { header: "Login", key: "login", width: 20 },
    { header: "Rôle", key: "role", width: 16 },
    { header: "Pods", key: "pods", width: 22 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF7900" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  sheet.addRow({
    firstName: "Awa",
    lastName: "Koné",
    email: "awa.kone@example.com",
    phone: "+225 07 00 00 00 00",
    login: "awa.kone",
    role: ROLE_LABELS.USER,
    pods: pods
      .slice(0, 2)
      .map((pod) => pod.code)
      .join("; "),
  });
  sheet.getRow(2).font = { italic: true, color: { argb: "FF808080" } };

  const refSheet = workbook.addWorksheet(REFERENCE_SHEET_NAME);
  refSheet.columns = [
    { header: "Rôle", key: "role", width: 18 },
    { header: "", key: "spacer", width: 4 },
    { header: "Code pod", key: "podCode", width: 14 },
    { header: "Nom du pod", key: "podName", width: 26 },
  ];
  refSheet.getRow(1).font = { bold: true };
  const refRows = Math.max(ROLE_VALUES.length, pods.length);
  for (let index = 0; index < refRows; index += 1) {
    refSheet.addRow({
      role: ROLE_VALUES[index] ? ROLE_LABELS[ROLE_VALUES[index]] : undefined,
      podCode: pods[index]?.code,
      podName: pods[index]?.name,
    });
  }

  for (let row = 2; row <= TEMPLATE_MAX_ROWS; row += 1) {
    sheet.getCell(`F${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`'${REFERENCE_SHEET_NAME}'!$A$2:$A$${ROLE_VALUES.length + 1}`],
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function buildRows(fileRows: string[][], pods: Pod[]): { rows: ParsedRow[]; formatError: string | null } {
  if (fileRows.length === 0) return { rows: [], formatError: "Le fichier est vide." };

  const [header, ...dataRows] = fileRows;
  const columnIndex = (aliases: readonly string[]) =>
    header.findIndex((cell) => aliases.map(normalize).includes(normalize(cell)));
  const indexes = {
    firstName: columnIndex(HEADER_ALIASES.firstName),
    lastName: columnIndex(HEADER_ALIASES.lastName),
    email: columnIndex(HEADER_ALIASES.email),
    phone: columnIndex(HEADER_ALIASES.phone),
    login: columnIndex(HEADER_ALIASES.login),
    role: columnIndex(HEADER_ALIASES.role),
    pods: columnIndex(HEADER_ALIASES.pods),
  };

  if (indexes.firstName === -1 || indexes.lastName === -1 || indexes.email === -1) {
    return { rows: [], formatError: 'Colonnes attendues introuvables : "Prénom", "Nom" et "Email" sont obligatoires.' };
  }
  if (dataRows.length === 0) return { rows: [], formatError: "Le fichier ne contient aucune ligne de données." };

  const cell = (cells: string[], index: number) => (index >= 0 ? (cells[index] ?? "").trim() : "");
  const seenEmails = new Map<string, number>();
  const seenLogins = new Map<string, number>();

  const rows = dataRows.map((cells, index): ParsedRow => {
    const rowNumber = index + 2;
    const firstName = cell(cells, indexes.firstName);
    const lastName = cell(cells, indexes.lastName);
    const email = cell(cells, indexes.email);
    const phone = cell(cells, indexes.phone);
    const rawLogin = cell(cells, indexes.login);
    // Login facultatif dans le fichier : déduit de l'email (partie avant @).
    const login = rawLogin || (email.includes("@") ? email.split("@")[0] : "");
    const roleLabel = cell(cells, indexes.role);
    const role = resolveRole(roleLabel);
    const podLabels = cell(cells, indexes.pods)
      .split(/[;,]/)
      .map((label) => label.trim())
      .filter(Boolean);
    const resolvedPods = podLabels.map((label) => ({
      label,
      pod: pods.find((pod) => normalize(pod.code) === normalize(label) || normalize(pod.name) === normalize(label)),
    }));
    const unknownPods = resolvedPods.filter((entry) => !entry.pod).map((entry) => entry.label);

    let error: string | null = null;
    if (!firstName) error = "Prénom manquant.";
    else if (!lastName) error = "Nom manquant.";
    else if (!email) error = "Email manquant.";
    else if (!EMAIL_PATTERN.test(email)) error = `Email invalide : "${email}".`;
    else if (firstName.length > 100 || lastName.length > 100) error = "Prénom ou nom trop long (100 caractères max).";
    else if (phone.length > 30) error = "Téléphone trop long (30 caractères max).";
    else if (!login) error = "Login manquant.";
    else if (login.length > 60) error = "Login trop long (60 caractères max).";
    else if (!role) error = `Rôle inconnu : "${roleLabel}" (Administrateur, Validateur ou Utilisateur).`;
    else if (unknownPods.length > 0) error = `Pod(s) inconnu(s) : ${unknownPods.map((label) => `"${label}"`).join(", ")}.`;
    else if (seenEmails.has(normalize(email))) error = `Email en double (déjà ligne ${seenEmails.get(normalize(email))}).`;
    else if (seenLogins.has(normalize(login))) error = `Login en double (déjà ligne ${seenLogins.get(normalize(login))}).`;

    if (!error) {
      seenEmails.set(normalize(email), rowNumber);
      seenLogins.set(normalize(login), rowNumber);
    }

    return {
      rowNumber,
      firstName,
      lastName,
      email,
      phone,
      login,
      loginGenerated: !rawLogin && Boolean(login),
      role: role ?? "USER",
      podLabels: resolvedPods.map((entry) => entry.pod?.code ?? entry.label),
      podIds: Array.from(new Set(resolvedPods.flatMap((entry) => (entry.pod ? [entry.pod.id] : [])))),
      error,
    };
  });

  return { rows, formatError: null };
}

/**
 * Création d'utilisateurs en masse depuis un fichier Excel (.xlsx) ou CSV :
 * une ligne par compte (prénom, nom, email, téléphone, login, rôle, pods).
 * Analyse et validation côté navigateur (champs obligatoires, email, rôle,
 * pods existants, doublons dans le fichier), aperçu ligne par ligne, puis
 * création des lignes valides via POST /users (mêmes règles que la
 * création unitaire — un email ou login déjà utilisé est signalé dans le
 * rapport). Login facultatif : déduit de l'email s'il est absent.
 */
export default function BulkUserImportModal({ pods, onClose, onDone }: BulkUserImportModalProps) {
  const titleId = "bulk-user-import-modal-title";
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [isBuildingTemplate, setIsBuildingTemplate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowResult[] | null>(null);

  const validRows = rows.filter((row) => !row.error);
  const invalidRows = rows.filter((row) => row.error);

  const handleDownloadTemplate = async () => {
    setIsBuildingTemplate(true);
    try {
      const blob = await buildTemplate(pods);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "modele-import-utilisateurs.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsBuildingTemplate(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setRows([]);
    setFormatError(null);
    setResults(null);
    setFileName(file?.name ?? null);
    if (!file) return;

    try {
      const fileRows = isExcelFile(file) ? await parseExcel(file) : await parseCsvFile(file);
      const { rows: parsedRows, formatError: parseError } = buildRows(fileRows, pods);
      if (parseError) {
        setFormatError(parseError);
        return;
      }
      setRows(parsedRows);
    } catch {
      setFormatError("Impossible de lire ce fichier — vérifiez qu'il s'agit bien d'un Excel ou d'un CSV valide.");
    }
  };

  const handleImport = async () => {
    setIsSubmitting(true);
    setProgress(0);
    const rowResults: RowResult[] = [];

    for (let start = 0; start < validRows.length; start += BATCH_SIZE) {
      const batch = validRows.slice(start, start + BATCH_SIZE);
      const settled = await Promise.allSettled(
        batch.map((row) =>
          createUser({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone || undefined,
            login: row.login,
            role: row.role,
            podIds: row.podIds,
          })
        )
      );

      settled.forEach((outcome, index) => {
        const row = batch[index];
        const name = `${row.firstName} ${row.lastName}`;
        if (outcome.status === "fulfilled") {
          const created = outcome.value as ManagedUser;
          rowResults.push({ rowNumber: row.rowNumber, name, status: "success", message: `Créé (login ${created.login}).` });
        } else {
          rowResults.push({ rowNumber: row.rowNumber, name, status: "error", message: getApiErrorMessage(outcome.reason) });
        }
      });
      setProgress(Math.min(validRows.length, start + batch.length));
    }

    setResults(rowResults);
    setIsSubmitting(false);
  };

  const successCount = results?.filter((result) => result.status === "success").length ?? 0;

  return (
    <ModalShell
      titleId={titleId}
      title="Importer des utilisateurs en masse"
      onClose={isSubmitting ? () => undefined : onClose}
      size="xl"
      scrollable
      footer={
        results ? (
          <button type="button" className="btn btn-primary" onClick={() => onDone(successCount)}>
            Terminé
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={validRows.length === 0 || isSubmitting}
              onClick={handleImport}
            >
              {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {isSubmitting
                ? `Création… ${progress}/${validRows.length}`
                : validRows.length > 0
                  ? `Créer ${validRows.length} utilisateur${validRows.length > 1 ? "s" : ""}`
                  : "Créer"}
            </button>
          </>
        )
      }
    >
      {results ? (
        <>
          <div className={`alert ${successCount === results.length ? "alert-success" : "alert-warning"}`} role="status">
            {successCount} utilisateur(s) créé(s), {results.length - successCount} échec(s).
          </div>
          <div className="table-responsive" style={{ maxHeight: "24rem", overflowY: "auto" }}>
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                <tr>
                  <th scope="col">Ligne</th>
                  <th scope="col">Utilisateur</th>
                  <th scope="col">Résultat</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.rowNumber} className={result.status === "error" ? "table-danger" : undefined}>
                    <td>{result.rowNumber}</td>
                    <td>{result.name}</td>
                    <td className={result.status === "success" ? "text-success" : "text-danger"}>
                      <i
                        className={`bi ${result.status === "success" ? "bi-check-circle" : "bi-x-circle"} me-1`}
                        aria-hidden="true"
                      />
                      {result.message}
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
            Une ligne par utilisateur. Colonnes obligatoires : <strong>Prénom</strong>, <strong>Nom</strong>,{" "}
            <strong>Email</strong>. Facultatives : <strong>Téléphone</strong>, <strong>Login</strong> (déduit de
            l&apos;email s&apos;il est vide), <strong>Rôle</strong> (Utilisateur par défaut) et <strong>Pods</strong>{" "}
            (un ou plusieurs codes séparés par <code>;</code>). Les comptes créés se connectent par code envoyé à leur
            email.
          </p>

          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleDownloadTemplate}
              disabled={isBuildingTemplate}
            >
              {isBuildingTemplate ? (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              ) : (
                <i className="bi bi-file-earmark-excel me-2" aria-hidden="true" />
              )}
              Télécharger le modèle Excel
            </button>
            <span className="small text-body-secondary">
              La 2<sup>e</sup> feuille liste les rôles et les pods disponibles.
            </span>
          </div>

          <div className="mb-3">
            <label htmlFor="bulk-user-import-file" className="form-label">
              Fichier Excel ou CSV
            </label>
            <input
              id="bulk-user-import-file"
              type="file"
              accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="form-control"
              onChange={handleFileChange}
              disabled={isSubmitting}
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
                {fileName && <span className="text-body-secondary me-3">{fileName}</span>}
                <span className="text-success fw-semibold">{validRows.length} ligne(s) valide(s)</span>
                {invalidRows.length > 0 && (
                  <span className="text-danger fw-semibold ms-3">
                    {invalidRows.length} ligne(s) invalide(s) — ignorée(s)
                  </span>
                )}
              </p>

              <div className="table-responsive border rounded-3" style={{ maxHeight: "22rem", overflowY: "auto" }}>
                <table className="table table-sm align-middle mb-0">
                  <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                    <tr>
                      <th scope="col">Ligne</th>
                      <th scope="col">Nom</th>
                      <th scope="col">Email</th>
                      <th scope="col">Login</th>
                      <th scope="col">Rôle</th>
                      <th scope="col">Pods</th>
                      <th scope="col">Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowNumber} className={row.error ? "table-danger" : undefined}>
                        <td>{row.rowNumber}</td>
                        <td>
                          {row.firstName || "—"} {row.lastName}
                        </td>
                        <td className="small">{row.email || "—"}</td>
                        <td className="small">
                          {row.login || "—"}
                          {row.loginGenerated && (
                            <span className="d-block text-body-secondary" style={{ fontSize: "0.75rem" }}>
                              déduit de l&apos;email
                            </span>
                          )}
                        </td>
                        <td className="small">{ROLE_LABELS[row.role]}</td>
                        <td className="small">{row.podLabels.length > 0 ? row.podLabels.join(", ") : "—"}</td>
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
