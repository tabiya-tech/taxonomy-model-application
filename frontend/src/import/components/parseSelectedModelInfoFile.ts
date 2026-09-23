import Papa from "papaparse";
import LanguageAPISpecs from "api-specifications/language";

interface CsvRow {
  UUIDHISTORY?: string;
  DESCRIPTION?: string;
  LANGUAGES?: string;
}

export type ModelInfoDetails = {
  UUIDHistory: string[];
  description: string;
  /** The short codes of the languages the model carries data in, empty when the file does not declare any */
  availableLanguages: string[];
};

/**
 * Parses the new line separated short codes of the LANGUAGES column, e.g. "en\nfr" into ["en", "fr"].
 * The short codes are trimmed, lower cased and deduplicated, and the empty lines are dropped.
 * @throws an error when a short code is not a language of the registry
 */
const parseLanguages = (languages: string | undefined): string[] => {
  const shortCodes = (languages ?? "")
    .split("\n")
    .map((shortCode) => shortCode.trim().toLowerCase())
    .filter((shortCode) => shortCode.length > 0);
  const uniqueShortCodes = Array.from(new Set(shortCodes));
  const unsupportedShortCodes = uniqueShortCodes.filter(
    (shortCode) => !LanguageAPISpecs.Helpers.isSupportedLanguage(shortCode)
  );
  if (unsupportedShortCodes.length > 0) {
    throw new Error(`LANGUAGES column contains unsupported languages: ${unsupportedShortCodes.join(", ")}`);
  }
  return uniqueShortCodes;
};

const parseSelectedModelInfoFile = (file: File): Promise<ModelInfoDetails> => {
  return new Promise((resolve, reject) => {
    // Check if the file is a CSV
    if (file.type !== "text/csv" && file.type !== "application/vnd.ms-excel") {
      reject(new Error("File is not a CSV"));
      return;
    }

    Papa.parse<CsvRow>(file, {
      complete: (result) => {
        const records = result.data;

        // Check if the UUIDHistory column is found and not empty
        if (records.length === 0 || !records[0].UUIDHISTORY) {
          reject(new Error("UUIDHISTORY column not found or empty in the first row"));
          return;
        }

        // Split the UUIDHistory string into an array of UUIDs
        const uuidHistory: string[] = records[0].UUIDHISTORY.split("\n");
        const description = records[0].DESCRIPTION || "";

        let availableLanguages: string[];
        try {
          availableLanguages = parseLanguages(records[0].LANGUAGES);
        } catch (e) {
          reject(e);
          return;
        }

        resolve({
          UUIDHistory: uuidHistory,
          description: description,
          availableLanguages: availableLanguages,
        });
      },
      error: (error) => reject(new Error("Error parsing the file: " + error.message)),
      header: true,
      skipEmptyLines: "greedy", // Skips empty lines
      // preview: 1, // Only parse the first row of actual data, ignoring the header
    });
  });
};

export default parseSelectedModelInfoFile;
