import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import {
  INewOccupationHierarchyPairSpec,
  IOccupationHierarchyPair,
} from "esco/occupationHierarchy/occupationHierarchy.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";
import { getRelationBatchFunction } from "import/esco/common/processRelationBatchFunction";

// expect all columns to be in upper case
export interface OccupationHierarchyHierarchyRow {
  PARENTOBJECTTYPE: string;
  PARENTID: string;
  CHILDID: string;
  CHILDOBJECTTYPE: string;
}

const enum CSV_OBJECT_TYPES {
  ISCOGroup = "ISCOGROUP",
  Occupation = "ESCOOCCUPATION",
}

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, ["PARENTOBJECTTYPE", "PARENTID", "CHILDID", "CHILDOBJECTTYPE"]);
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
): TransformRowToSpecificationFunction<OccupationHierarchyHierarchyRow, INewOccupationHierarchyPairSpec> {
  const csv2EscoObjectType = (type: string): ObjectTypes.ISCOGroup | ObjectTypes.Occupation | null => {
    switch (type.toUpperCase()) {
      case CSV_OBJECT_TYPES.ISCOGroup:
        return ObjectTypes.ISCOGroup;
      case CSV_OBJECT_TYPES.Occupation:
        return ObjectTypes.Occupation;
      default:
        return null;
    }
  };

  return (row: OccupationHierarchyHierarchyRow) => {
    const parentType = csv2EscoObjectType(row.PARENTOBJECTTYPE);
    const childType = csv2EscoObjectType(row.CHILDOBJECTTYPE);
    if (!parentType || !childType) {
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
  const iscoGroupsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("OccupationHierarchy");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<OccupationHierarchyHierarchyRow>(
    "OccupationHierarchy",
    iscoGroupsCSVFileStream,
    batchRowProcessor
  );
}
