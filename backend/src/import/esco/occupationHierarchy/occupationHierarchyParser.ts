import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import {
  INewOccupationHierarchyPairSpec,
  IOccupationHierarchyPair,
} from "esco/occupationHierarchy/occupationHierarchy.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";
import { getRelationBatchFunction } from "import/esco/common/processRelationBatchFunction";
import { IOccupationHierarchyImportRow, occupationHierarchyImportHeaders } from "esco/common/entityToCSV.types";
import { getObjectTypeFromCSVObjectType } from "esco/common/csvObjectTypes";
import { ObjectTypes } from "esco/common/objectTypes";

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, occupationHierarchyImportHeaders);
}

function getBatchProcessor(modelId: string) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getRelationBatchFunction<IOccupationHierarchyPair, INewOccupationHierarchyPairSpec>(
    modelId,
    "OccupationHierarchy",
    getRepositoryRegistry().occupationHierarchy
  );
  return new BatchProcessor<INewOccupationHierarchyPairSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string,
  importIdToDBIdMap: Map<string, string>
): (row: IOccupationHierarchyImportRow) => null | {
  childType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup | ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
  childId: string;
  parentType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup | ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
  parentId: string;
} {
  return (row: IOccupationHierarchyImportRow) => {
    const parentType = getObjectTypeFromCSVObjectType(row.PARENTOBJECTTYPE);
    const childType = getObjectTypeFromCSVObjectType(row.CHILDOBJECTTYPE);

    if (
      (parentType !== ObjectTypes.ISCOGroup &&
        parentType !== ObjectTypes.LocalGroup &&
        parentType !== ObjectTypes.ESCOOccupation &&
        parentType !== ObjectTypes.LocalOccupation) ||
      (childType !== ObjectTypes.ISCOGroup &&
        childType !== ObjectTypes.LocalGroup &&
        childType !== ObjectTypes.ESCOOccupation &&
        childType !== ObjectTypes.LocalOccupation)
    ) {
      errorLogger.logWarning(
        `Failed to import OccupationHierarchy row with parentType:'${row.PARENTOBJECTTYPE}' and childType:'${row.CHILDOBJECTTYPE}'`
      );
      return null;
    }

    const parentId = importIdToDBIdMap.get(row.PARENTID);
    const childId = importIdToDBIdMap.get(row.CHILDID);
    if (!parentId || !childId) {
      errorLogger.logWarning(
        `Failed to import OccupationHierarchy row with parent importId:'${row.PARENTID}' and child importId:'${row.CHILDID}'`
      );
      return null;
    }
    return {
      parentType: parentType,
      parentId: parentId,
      childId: childId,
      childType: childType,
    };
  };
}

// function to parse from url
export async function parseOccupationHierarchyFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("OccupationHierarchy");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "OccupationHierarchy", batchRowProcessor);
}

export async function parseOccupationHierarchyFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const occupationGroupsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("OccupationHierarchy");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<IOccupationHierarchyImportRow>(
    "OccupationHierarchy",
    occupationGroupsCSVFileStream,
    batchRowProcessor
  );
}
