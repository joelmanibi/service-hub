/**
 * Export CSV générique (déclenche un téléchargement navigateur) —
 * pendant en écriture de lib/csv.ts#parseCsv (lecture, import en masse).
 * Mêmes règles RFC 4180 : une cellule contenant `,`, `"` ou un retour à
 * la ligne est entre guillemets, les guillemets internes doublés.
 */
function escapeCsvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(header: string[], rows: string[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, header: string[], rows: string[][]): void {
  // BOM UTF-8 : Excel (Windows) n'auto-détecte pas l'UTF-8 sans lui et
  // affiche les accents mal encodés sinon.
  const blob = new Blob(["﻿" + toCsv(header, rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
