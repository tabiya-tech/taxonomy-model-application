import fs from "fs";
import { parse } from "csv-parse/sync";
import LanguageAPISpecs from "api-specifications/language";
import { GEMINI_API_BASE_URL } from "../src/embeddings/models/gemini/geminiService";

/**
 * A CLI helper that prepares the labelled query sets of the multilingual embeddings evaluation
 * (test/integration/embeddings/multilingualEmbeddings.integration.test.ts).
 *
 * It reads a CSV file of job ads labelled with ESCO occupations (with the columns ID, title, synthetic_query and
 * esco_code), and translates the title and the first person experience description (synthetic_query) of each ad from
 * English to the given language with Gemini. The result is written as JSON, keeping the English texts next to their translations.
 *
 * The labelled job ads are not part of this repository, and neither must the output be: do not commit it.
 *
 * Running it again with the same output translates only what the output is missing, so an interrupted run resumes,
 * and running it with another --language adds that language to the output.
 *
 * Usage:
 *   GEMINI_API_KEY=... yarn ts-node -r tsconfig-paths/register ./scripts/translateEmbeddingsEvalQueries.ts \
 *     --input <labelled-job-ads.csv> --output <labelled-queries.json> [--language fr] [--model gemini-3.8-flash]
 */

/**
 * A labelled job ad, with its texts by language dbKeyName.
 */
export interface ILabelledQueryRow {
  id: string;
  // The ESCO code of the occupation the ad is labelled with.
  goldCode: string;
  title: Partial<Record<string, string>>;
  experience: Partial<Record<string, string>>;
}

interface ILabelledJobAdCSVRow {
  ID: string;
  title: string;
  synthetic_query: string;
  esco_code: string;
}

// The number of job ads translated per request (each has 2 texts).
const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 3;

function parseArgs(argv: string[]): {
  input: string;
  output: string;
  language: LanguageAPISpecs.Types.ILanguageConfig;
  model: string;
} {
  const values: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith("--") || argv[i + 1] === undefined) {
      throw new Error(`Invalid argument ${argv[i]}`);
    }
    values[argv[i].slice(2)] = argv[i + 1];
  }
  if (!values.input || !values.output) {
    throw new Error("Missing required argument --input <csv> or --output <json>");
  }
  const dbKeyName = values.language ?? "fr";
  const language = LanguageAPISpecs.Constants.Languages.find((l) => l.dbKeyName === dbKeyName);
  if (!language || language.dbKeyName === "en") {
    throw new Error(`Invalid --language '${dbKeyName}'. Must be a registered language other than the source English`);
  }
  return { input: values.input, output: values.output, language, model: values.model ?? "gemini-3.8-flash" };
}

/**
 * Translates the given English texts to the given language with Gemini, returning one translation per text, in order.
 */
async function translate(texts: string[], languageName: string, model: string, apiKey: string): Promise<string[]> {
  const prompt =
    `Translate each of the following English texts to ${languageName}. They are job titles and descriptions of ` +
    `work experience, written by job seekers. Translate them the way a native ${languageName} speaker would write ` +
    `them, keeping their meaning and register. Keep any [REDACTED] marker as it is. ` +
    `Answer with a JSON array holding exactly one translation per text, in the same order.\n\n` +
    JSON.stringify(texts);

  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_BASE_URL}/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: { type: "ARRAY", items: { type: "STRING" } },
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`Gemini responded with status ${response.status}: ${await response.text()}`);
      }
      const payload = await response.json();
      const translations: unknown = JSON.parse(payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "null");
      if (!Array.isArray(translations) || translations.length !== texts.length) {
        throw new Error(`Gemini returned ${JSON.stringify(translations)?.slice(0, 200)} for ${texts.length} texts`);
      }
      return translations.map(String);
    } catch (e: unknown) {
      if (attempt >= MAX_ATTEMPTS) {
        throw e;
      }
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
    }
  }
}

async function main(): Promise<void> {
  const { input, output, language, model } = parseArgs(process.argv.slice(2));
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const csvRows: ILabelledJobAdCSVRow[] = parse(fs.readFileSync(input), { columns: true, skip_empty_lines: true });
  const existingRows: ILabelledQueryRow[] = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, "utf-8")) : [];
  const existingRowsById = new Map(existingRows.map((row) => [row.id, row]));
  const rows: ILabelledQueryRow[] = csvRows.map((csvRow) => {
    const existingRow = existingRowsById.get(csvRow.ID);
    return {
      id: csvRow.ID,
      goldCode: csvRow.esco_code,
      title: { ...existingRow?.title, en: csvRow.title },
      experience: { ...existingRow?.experience, en: csvRow.synthetic_query },
    };
  });

  const key = language.dbKeyName;
  const untranslatedRows = rows.filter((row) => !row.title[key] || !row.experience[key]);
  console.info(`Translating ${untranslatedRows.length} of ${rows.length} job ad(s) to ${language.name}.`);
  for (let i = 0; i < untranslatedRows.length; i += BATCH_SIZE) {
    const batch = untranslatedRows.slice(i, i + BATCH_SIZE);
    const texts = batch.flatMap((row) => [row.title.en as string, row.experience.en as string]);
    const translations = await translate(texts, language.name, model, apiKey);
    batch.forEach((row, index) => {
      row.title[key] = translations[2 * index];
      row.experience[key] = translations[2 * index + 1];
    });
    // write after every batch, so that an interrupted run resumes from there
    fs.writeFileSync(output, JSON.stringify(rows, null, 2));
    console.info(`  ${Math.min(i + BATCH_SIZE, untranslatedRows.length)}/${untranslatedRows.length}`);
  }
  fs.writeFileSync(output, JSON.stringify(rows, null, 2));
}

// Only run when invoked directly (not when imported by a test).
if (require.main === module) {
  main()
    .then(() => {
      console.info("Translation completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Translation failed:", error);
      process.exit(1);
    });
}
