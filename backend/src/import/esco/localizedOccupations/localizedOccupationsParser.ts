import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import {
  IExtendedLocalizedOccupation,
  INewLocalizedOccupationSpec,
} from "esco/localizedOccupation/localizedOccupation.types";
import { getOccupationTypeFromRow } from "import/esco/common/getOccupationTypeFromRow";
import errorLogger from "common/errorLogger/errorLogger";
import { ILocalizedOccupationImportRow, localizedOccupationImportHeaders } from "esco/common/entityToCSV.types";
import { OccupationType } from "esco/common/objectTypes";

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, localizedOccupationImportHeaders);
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessEntityBatchFunction<IExtendedLocalizedOccupation, INewLocalizedOccupationSpec>(
    "LocalizedOccupation",
    getRepositoryRegistry().localizedOccupation,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewLocalizedOccupationSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string,
  importIdToDBIdMap: Map<string, string>
): TransformRowToSpecificationFunction<ILocalizedOccupationImportRow, INewLocalizedOccupationSpec> {
  return (row: ILocalizedOccupationImportRow) => {
    const occupationType = getOccupationTypeFromRow(row);
    if (occupationType !== OccupationType.LOCALIZED) {
      //check that the occupationType exists
      errorLogger.logWarning(
        `Failed to import Localized Occupation row with id:'${row.ID}'. OccupationType not found/invalid.`
      );
      return null;
    }
    const localizesOccupationId = importIdToDBIdMap.get(row.LOCALIZESOCCUPATIONID);
    if (!localizesOccupationId) {
      //check that the localizesOccupationId exists
      errorLogger.logWarning(
        `Failed to import Localized Occupation row with id:'${row.ID}'. LocalizesOccupationId not found/invalid.`
      );
      return null;
    }

    return {
      altLabels: row.ALTLABELS ? row.ALTLABELS.split("\n") : [],
      modelId,
      description: row.DESCRIPTION,
      occupationType,
      localizesOccupationId,
      importId: row.ID,
      UUIDHistory: row.UUIDHISTORY ? row.UUIDHISTORY.split("\n") : [],
    };
  };
}

// function to parse from url
export async function parseLocalizedOccupationsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("LocalizedOccupation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);

  return await processDownloadStream(url, "LocalizedOccupation", batchRowProcessor);
}

export async function parseLocalizedOccupationsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const LocalizedOccupationsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("LocalizedOccupation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<ILocalizedOccupationImportRow>(
    "LocalizedOccupation",
    LocalizedOccupationsCSVFileStream,
    batchRowProcessor
  );
}
