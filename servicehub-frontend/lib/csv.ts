/**
 * Analyseur CSV minimal (RFC 4180 : champs entre guillemets, séparateurs
 * et retours à la ligne échappés, guillemets doublés `""`). Volontairement
 * sans dépendance externe — l'import en masse (catalogue de services,
 * instances, hébergements) reste un besoin ponctuel qui ne justifie pas
 * une librairie dédiée. Les lignes entièrement vides sont ignorées.
 */
export function parseCsv(text: string, delimiter: string = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows
    .map((cells) => cells.map((cell) => cell.trim()))
    .filter((cells) => cells.some((cell) => cell !== ""));
}

// Excel (locale FR) enregistre le CSV avec `;` — la virgule y est déjà
// le séparateur décimal. Détecté sur la première ligne (l'en-tête),
// jamais supposé fixe : un fichier venu d'ailleurs peut toujours utiliser
// la virgule standard.
export function detectCsvDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\r|\n/, 1)[0] ?? "";
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

// Excel (Windows, locale FR) enregistre par défaut en ANSI (Windows-1252),
// pas en UTF-8, sauf choix explicite de "CSV UTF-8" — `file.text()` décode
// toujours en UTF-8 et transforme alors les caractères accentués en `�`.
// Repli heuristique : si le décodage UTF-8 produit des caractères de
// remplacement, retenter en Windows-1252 (couvre le cas très courant du
// CSV "standard" exporté par Excel FR).
async function readCsvText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const utf8Text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

  if (!utf8Text.includes("�")) {
    return utf8Text;
  }

  return new TextDecoder("windows-1252").decode(buffer);
}

// Point d'entrée recommandé pour lire un fichier CSV uploadé : gère
// l'encodage et le séparateur automatiquement (cf. readCsvText /
// detectCsvDelimiter ci-dessus) avant de déléguer à parseCsv.
export async function parseCsvFile(file: File): Promise<string[][]> {
  const text = await readCsvText(file);
  return parseCsv(text, detectCsvDelimiter(text));
}
