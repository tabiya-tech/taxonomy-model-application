import fs from "fs";
import readline from "node:readline";
import { parse as parseCsvLineSync } from "csv-parse/sync";
import LanguageAPISpecs from "api-specifications/language";
import { processStream } from "import/stream/processStream";
import { RowProcessor } from "import/parse/RowProcessor.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { BatchProcessor, ProcessBatchFunction } from "import/batch/BatchProcessor";
import { ITranslationUpdateOperation } from "esco/common/bulkTranslationUpdate";
import { EntityMergeConfig, EntityMergeReport } from "./types";
import { buildExistingEntityMap, computeRowUpdate, makeHeadersValidator, CSV_ID_COLUMN_NAME } from "./csvRowMerge";

const TRANSLATION_UPDATE_BATCH_SIZE = 500;

type CsvRow = Record<string, string | undefined>;

// processStream()'s header validation only runs from inside its row loop, so a CSV with a header but zero data
// rows never triggers it at all. Reading the header line ourselves, upfront, catches a wrong file/language
// regardless of whether the file has any data rows to stream.
async function readCsvHeaderRow(csvFilePath: string): Promise<string[]> {
  const fileReadStream = fs.createReadStream(csvFilePath);
  const lineReader = readline.createInterface({ input: fileReadStream, crlfDelay: Infinity });
  try {
    for await (const line of lineReader) {
      const [headerRow] = parseCsvLineSync(line) as string[][];
      return (headerRow ?? []).map((column) => column.toUpperCase());
    }
    return [];
  } finally {
    lineReader.close();
    fileReadStream.destroy();
  }
}

export async function mergeEntityLanguage(
  config: EntityMergeConfig,
  params: {
    modelId: string;
    csvFilePath: string;
    language: LanguageAPISpecs.Types.ILanguageConfig;
    dryRun: boolean;
  }
): Promise<EntityMergeReport> {
  const existingEntitiesByImportId = await buildExistingEntityMap(config.findAllWithTranslations, params.modelId);

  const report: EntityMergeReport = {
    entityName: config.entityName,
    totalRows: 0,
    matched: 0,
    unmatched: 0,
    unmatchedImportIds: [],
    changed: 0,
    unchanged: 0,
    writeFailures: 0,
    warnings: [],
  };
  let rowsQueuedForWrite = 0;

  const applyTranslationUpdateBatch: ProcessBatchFunction<ITranslationUpdateOperation> = async (batch) => {
    const bulkWriteResult = await config.bulkSetTranslatedFields(params.modelId, batch);
    return {
      rowsProcessed: batch.length,
      rowsSuccess: bulkWriteResult.matchedCount,
      rowsFailed: batch.length - bulkWriteResult.matchedCount,
    };
  };
  const translationUpdateBatchProcessor = new BatchProcessor<ITranslationUpdateOperation>(
    TRANSLATION_UPDATE_BATCH_SIZE,
    applyTranslationUpdateBatch
  );

  const validateHeaders = makeHeadersValidator(config, params.language);
  const headerRow = await readCsvHeaderRow(params.csvFilePath);
  const headersAreValid = await validateHeaders(headerRow);
  if (!headersAreValid) {
    throw new Error(
      `${config.entityName}: CSV headers failed validation for file ${params.csvFilePath}; see the logged errors above for which columns were expected`
    );
  }

  const rowProcessor: RowProcessor<CsvRow> = {
    // Already validated above, independent of whether the file turns out to have any data rows.
    validateHeaders: async () => true,
    processRow: async (csvRow: CsvRow) => {
      report.totalRows++;
      const importId = csvRow[CSV_ID_COLUMN_NAME];
      const existingEntity = importId ? existingEntitiesByImportId.get(importId) : undefined;
      if (!existingEntity) {
        report.unmatched++;
        if (importId) report.unmatchedImportIds.push(importId);
        return;
      }
      report.matched++;
      const { translationsToSetByDotNotationPath, warnings } = computeRowUpdate(
        csvRow,
        existingEntity,
        config,
        params.language
      );
      report.warnings.push(...warnings);
      if (Object.keys(translationsToSetByDotNotationPath).length === 0) {
        report.unchanged++;
        return;
      }
      report.changed++;
      if (!params.dryRun) {
        rowsQueuedForWrite++;
        await translationUpdateBatchProcessor.add({
          importId: importId!,
          setFields: translationsToSetByDotNotationPath,
        });
      }
    },
    completed: async (): Promise<RowsProcessedStats> => {
      await translationUpdateBatchProcessor.flush();
      return {
        rowsProcessed: report.totalRows,
        rowsSuccess: report.matched,
        rowsFailed: report.unmatched,
      };
    },
  };

  const csvFileReadStream = fs.createReadStream(params.csvFilePath);
  await processStream<CsvRow>(config.entityName, csvFileReadStream, rowProcessor);

  // BatchProcessor logs batch errors but does not reject, so queued rows may never be written.
  // Compare queued rows to rows confirmed successful to detect silent write failures.
  const confirmedWriteCount = translationUpdateBatchProcessor.getStats().rowsSuccess;
  report.writeFailures = rowsQueuedForWrite - confirmedWriteCount;

  return report;
}
