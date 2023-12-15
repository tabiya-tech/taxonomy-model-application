import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { INewOccupationSpec, IOccupation } from "esco/occupation/occupation.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";
import errorLogger from "common/errorLogger/errorLogger";
import { RegExESCOOccupationCode, RegExLocalOccupationCode } from "esco/common/modelSchema";
import { OccupationType } from "esco/common/objectTypes";
import { getOccupationTypeFromRow } from "import/esco/common/getOccupationTypeFromRow";
import { IOccupationRow, occupationHeaders } from "esco/common/entityToCSV.types";

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, occupationHeaders);
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
): TransformRowToSpecificationFunction<IOccupationRow, INewOccupationSpec> {
  return (row: IOccupationRow) => {
    const occupationType = getOccupationTypeFromRow(row);

    if (!occupationType) {
      //check that the occupationType exists
      errorLogger.logWarning(`Failed to import Occupation row with id:'${row.ID}'. OccupationType not found/invalid.`);
      return null;
    }
    if (isLocalImport && occupationType !== OccupationType.LOCAL) {
      // if it is a local import ensure that the occupationType is LOCAL
      errorLogger.logWarning(`Failed to import Local Occupation row with id:'${row.ID}'. Not a local occupation.`);
      return null;
    }
    if (!isLocalImport && occupationType !== OccupationType.ESCO) {
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
      ESCOUri: row.ESCOURI,
      modelId: modelId,
      UUIDHistory: row.UUIDHISTORY ? row.UUIDHISTORY.split("\n") : [],
      ISCOGroupCode: row.ISCOGROUPCODE,
      code: row.CODE,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split("\n") : [],
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
  isLocalImport: boolean = false
): Promise<RowsProcessedStats> {
  const OccupationsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("Occupation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, isLocalImport);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IOccupationRow>("Occupation", OccupationsCSVFileStream, batchRowProcessor);
}
