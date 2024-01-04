import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { INewOccupationSpec, IOccupation } from "esco/occupations/occupation/occupation.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import errorLogger from "common/errorLogger/errorLogger";
import { RegExESCOOccupationCode, RegExLocalOccupationCode } from "esco/common/modelSchema";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationImportRow, occupationImportHeaders } from "esco/common/entityToCSV.types";
import { getOccupationTypeFromCSVObjectType } from "import/esco/common/getOccupationTypeFromCSVObjectType";
import { arrayFromString } from "../common/parseNewLineSeparatedArray";

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
  modelId: string,
  isLocalImport: boolean
): TransformRowToSpecificationFunction<IOccupationImportRow, INewOccupationSpec> {
  return (row: IOccupationImportRow) => {
    const occupationType = getOccupationTypeFromCSVObjectType(row.OCCUPATIONTYPE);

    if (!occupationType) {
      //check that the occupationType exists
      errorLogger.logWarning(`Failed to import Occupation row with id:'${row.ID}'. OccupationType not found/invalid.`);
      return null;
    }
    if (isLocalImport && occupationType !== ObjectTypes.LocalOccupation) {
      // if it is a local import ensure that the occupationType is LOCAL
      errorLogger.logWarning(`Failed to import Local Occupation row with id:'${row.ID}'. Not a local occupation.`);
      return null;
    }
    if (!isLocalImport && occupationType !== ObjectTypes.ESCOOccupation) {
      // if it is not a local import ensure that the occupationType is ESCO
      errorLogger.logWarning(`Failed to import ESCO Occupation row with id:'${row.ID}'. Not an ESCO occupation.`);
      return null;
    }

    //check against the code regex for local occupation code
    let validCode;
    if (isLocalImport) {
      validCode = RegExLocalOccupationCode.test(row.CODE);
    } else {
      validCode = RegExESCOOccupationCode.test(row.CODE);
    }
    if (!validCode) {
      errorLogger.logWarning(
        `Failed to import ${isLocalImport ? "Local" : "ESCO"} Occupation row with id:'${row.ID}'. Code not valid.`
      );
      return null;
    }

    return {
      originUri: row.ORIGINURI,
      modelId: modelId,
      UUIDHistory: arrayFromString(row.UUIDHISTORY),
      ISCOGroupCode: row.ISCOGROUPCODE,
      code: row.CODE,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: arrayFromString(row.ALTLABELS),
      description: row.DESCRIPTION,
      definition: row.DEFINITION,
      scopeNote: row.SCOPENOTE,
      regulatedProfessionNote: row.REGULATEDPROFESSIONNOTE,
      importId: row.ID,
      occupationType: occupationType,
    };
  };
}

// function to parse from url
export async function parseOccupationsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>,
  isLocalImport: boolean
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("Occupation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, isLocalImport);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "Occupation", batchRowProcessor);
}

export async function parseOccupationsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>,
  isLocalImport: boolean
): Promise<RowsProcessedStats> {
  const OccupationsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("Occupation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, isLocalImport);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IOccupationImportRow>("Occupation", OccupationsCSVFileStream, batchRowProcessor);
}
