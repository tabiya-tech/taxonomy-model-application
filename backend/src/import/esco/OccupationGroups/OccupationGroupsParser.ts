import { IOccupationGroup, INewOccupationGroupSpec } from "esco/occupationGroup/OccupationGroup.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import { IOccupationGroupImportRow, OccupationGroupImportHeaders } from "esco/common/entityToCSV.types";
import { arrayFromString, uniqueArrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import errorLogger from "common/errorLogger/errorLogger";
import { getOccupationGroupTypeFromCSVObjectType } from "import/esco/common/getEntityTypeFromCSVObjectType";

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, OccupationGroupImportHeaders);
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessEntityBatchFunction<IOccupationGroup, INewOccupationGroupSpec>(
    "OccupationGroup",
    getRepositoryRegistry().OccupationGroup,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewOccupationGroupSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string
): TransformRowToSpecificationFunction<IOccupationGroupImportRow, INewOccupationGroupSpec> {
  return (row: IOccupationGroupImportRow): INewOccupationGroupSpec | null => {
    const { uniqueArray: uniqueAltLabels, duplicateCount } = uniqueArrayFromString(row.ALTLABELS);
    if (duplicateCount) {
      errorLogger.logWarning(
        `Warning while importing OccupationGroup row with id:'${row.ID}'. AltLabels contain ${duplicateCount} duplicates.`
      );
    }

    // warning if the preferred label is not in the alt labels
    if (row.PREFERREDLABEL && !uniqueAltLabels.includes(row.PREFERREDLABEL)) {
      errorLogger.logWarning(
        `Warning while importing Occupation Group row with id:'${row.ID}'. Preferred label '${row.PREFERREDLABEL}' is not in the alt labels.`
      );
    }

    const groupType = getOccupationGroupTypeFromCSVObjectType(row.GROUPTYPE);

    if (groupType === null) {
      //check that the occupationType exists
      errorLogger.logWarning(`Failed to import Occupation row with id:'${row.ID}'. OccupationType not found/invalid.`);
      return null;
    }

    return {
      originUri: row.ORIGINURI,
      modelId: modelId,
      UUIDHistory: arrayFromString(row.UUIDHISTORY),
      code: row.CODE,
      groupType: groupType,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: uniqueAltLabels,
      description: row.DESCRIPTION,
      importId: row.ID,
    };
  };
}

// function to parse from url
export async function parseOccupationGroupsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("OccupationGroup");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "OccupationGroup", batchRowProcessor);
}

export async function parseOccupationGroupsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const occupationGroupsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("OccupationGroup");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IOccupationGroupImportRow>(
    "OccupationGroup",
    occupationGroupsCSVFileStream,
    batchRowProcessor
  );
}
