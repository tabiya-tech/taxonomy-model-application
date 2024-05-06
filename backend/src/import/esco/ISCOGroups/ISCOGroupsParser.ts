import { IISCOGroup, INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import { IISCOGroupImportRow, ISCOGroupImportHeaders } from "esco/common/entityToCSV.types";
import { arrayFromString, uniqueArrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import errorLogger from "common/errorLogger/errorLogger";

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, ISCOGroupImportHeaders);
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessEntityBatchFunction<IISCOGroup, INewISCOGroupSpec>(
    "ISCOGroup",
    getRepositoryRegistry().ISCOGroup,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewISCOGroupSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string
): TransformRowToSpecificationFunction<IISCOGroupImportRow, INewISCOGroupSpec> {
  return (row: IISCOGroupImportRow): INewISCOGroupSpec => {
    const { uniqueArray: uniqueAltLabels, duplicateCount } = uniqueArrayFromString(row.ALTLABELS);
    if (duplicateCount) {
      errorLogger.logWarning(
        `Warning while importing ISCOGroup row with id:'${row.ID}'. AltLabels contain ${duplicateCount} duplicates.`
      );
    }
    return {
      originUri: row.ORIGINURI,
      modelId: modelId,
      UUIDHistory: arrayFromString(row.UUIDHISTORY),
      code: row.CODE,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: uniqueAltLabels,
      description: row.DESCRIPTION,
      importId: row.ID,
    };
  };
}

// function to parse from url
export async function parseISCOGroupsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("ISCOGroup");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "ISCOGroup", batchRowProcessor);
}

export async function parseISCOGroupsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const iscoGroupsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("ISCOGroup");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IISCOGroupImportRow>("ISCOGroup", iscoGroupsCSVFileStream, batchRowProcessor);
}
