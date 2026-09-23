import ExcelJS from "exceljs";

/**
 * Lecture d'un classeur Excel (.xlsx/.xls) — première feuille uniquement
 * — en tableau de lignes de chaînes, pour rejoindre exactement la forme
 * produite par lib/csv.ts (parseCsv) : l'import en masse (module
 * catalog) traite ensuite les deux formats de façon identique.
 */

function cellValueToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    // Texte enrichi (rich text) ou résultat de formule.
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }
    if ("result" in value) {
      return String((value as { result: unknown }).result ?? "");
    }
    return "";
  }

  return String(value);
}

export async function parseExcel(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const rows: string[][] = [];

  worksheet.eachRow((row) => {
    const values = row.values as ExcelJS.CellValue[];
    const cells: string[] = [];

    for (let i = 1; i < values.length; i += 1) {
      cells.push(cellValueToString(values[i]).trim());
    }

    rows.push(cells);
  });

  return rows.filter((cells) => cells.some((cell) => cell !== ""));
}
