import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { INewOccupationSpec, IOccupation } from "esco/occupations/occupation.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import errorLogger from "common/errorLogger/errorLogger";
import { RegExESCOOccupationCode, RegExICATUSOccupationCode, RegExLocalOccupationCode } from "esco/common/modelSchema";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationImportRow, occupationImportHeaders } from "esco/common/entityToCSV.types";
import { getOccupationTypeFromCSVObjectType } from "import/esco/common/getOccupationTypeFromCSVObjectType";
import { arrayFromString, uniqueArrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, occupationImportHeaders);
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessEntityBatchFunction<IOccupation, INewOccupationSpec>(
    "Occupation",
    getRepositoryRegistry().occupation,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewOccupationSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string
): TransformRowToSpecificationFunction<IOccupationImportRow, INewOccupationSpec> {
  return (row: IOccupationImportRow) => {
    const occupationType = getOccupationTypeFromCSVObjectType(row.OCCUPATIONTYPE);
    const isLocalized = row.ISLOCALIZED?.trim().toLowerCase() === "true";

    if (occupationType === null) {
      //check that the occupationType exists
      errorLogger.logWarning(`Failed to import Occupation row with id:'${row.ID}'. OccupationType not found/invalid.`);
      return null;
    }
    if (isLocalized && occupationType !== ObjectTypes.ESCOOccupation) {
      // if it is a local import ensure that the occupationType is LOCAL
      errorLogger.logWarning(
        `Failed to import Local Occupation row with id:'${row.ID}'. Local occupation cannot be localized.`
      );
      return null;
    }

    //check against the code regex for local occupation code
    let validCode;
    if (occupationType === ObjectTypes.LocalOccupation) {
      validCode = RegExLocalOccupationCode.test(row.CODE) || RegExICATUSOccupationCode.test(row.CODE);
    } else {
      validCode = RegExESCOOccupationCode.test(row.CODE);
    }
    if (!validCode) {
      errorLogger.logWarning(
        `Failed to import ${
          occupationType === ObjectTypes.LocalOccupation ? "Local" : "ESCO"
        } Occupation row with id:'${row.ID}'. Code not valid.`
      );
      return null;
    }
    const { uniqueArray: uniqueAltLabels, duplicateCount } = uniqueArrayFromString(row.ALTLABELS);
    if (duplicateCount) {
      errorLogger.logWarning(
        `Warning while importing ${
          occupationType === ObjectTypes.LocalOccupation ? "Local" : "ESCO"
        } Occupation row with id:'${row.ID}'. AltLabels contain ${duplicateCount} duplicates.`
      );
    }

    // warning if the preferred label is not in the alt labels
    if (!uniqueAltLabels.includes(row.PREFERREDLABEL)) {
      errorLogger.logWarning(
        `Warning while importing Occupation row with id:'${row.ID}'. Preferred label '${row.PREFERREDLABEL}' is not in the alt labels.`
      );
    }


    return {
      originUri: row.ORIGINURI,
      modelId: modelId,
      UUIDHistory: arrayFromString(row.UUIDHISTORY),
      occupationGroupCode: row.OCCUPATIONGROUPCODE,
      code: row.CODE,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: uniqueAltLabels,
      description: row.DESCRIPTION,
      definition: row.DEFINITION,
      scopeNote: row.SCOPENOTE,
      regulatedProfessionNote: row.REGULATEDPROFESSIONNOTE,
      importId: row.ID,
      occupationType: occupationType,
      isLocalized: isLocalized,
    };
  };
}

// function to parse from url
export async function parseOccupationsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("Occupation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "Occupation", batchRowProcessor);
}

export async function parseOccupationsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const OccupationsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("Occupation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IOccupationImportRow>("Occupation", OccupationsCSVFileStream, batchRowProcessor);
}
