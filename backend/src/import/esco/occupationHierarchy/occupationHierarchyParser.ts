import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  processDownloadStream,
  processStream,
} from "import/stream/processStream";
import fs from "fs";
import {BatchProcessor} from "import/batch/BatchProcessor";
import {BatchRowProcessor, TransformRowToSpecificationFunction} from "import/parse/BatchRowProcessor";
import {HeadersValidatorFunction} from "import/parse/RowProcessor.types";
import {getStdHeadersValidator} from "import/parse/stdHeadersValidator";
import {INewOccupationHierarchyPairSpec} from "esco/occupationHierarchy/occupationHierarchy.types";
import {ObjectTypes} from "esco/common/objectTypes";
import {RowsProcessedStats} from "import/rowsProcessedStats.types";

// expect all columns to be in upper case
export interface OccupationHierarchyHierarchyRow {
  PARENTOBJECTTYPE: string,
  PARENTID: string,
  CHILDID: string,
  CHILDOBJECTTYPE: string
}

const enum CSV_OBJECT_TYPES {
  ISCOGroup = 'ISCOGROUP',
  Occupation = 'ESCOOCCUPATION'
}

function getHeadersValidator(modelid: string): HeadersValidatorFunction {
  return getStdHeadersValidator(modelid, ['PARENTOBJECTTYPE', 'PARENTID', 'CHILDID', 'CHILDOBJECTTYPE']);
}

function getBatchProcessor(modelId: string,) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = async (specs: INewOccupationHierarchyPairSpec[]) => {
    const stats: RowsProcessedStats = {
      rowsProcessed: specs.length,
      rowsSuccess: 0,
      rowsFailed: 0
    };
    try {
      const repository = getRepositoryRegistry().occupationHierarchy;
      const hierarchyEntries = await repository.createMany(modelId, specs);
      stats.rowsSuccess = hierarchyEntries.length;
    } catch (e: unknown) {
      console.error("Failed to process batch", e);
    }
    stats.rowsFailed = specs.length - stats.rowsSuccess;
    return stats;
  };
  return new BatchProcessor<INewOccupationHierarchyPairSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(modelId: string, importIdToDBIdMap: Map<string, string>): TransformRowToSpecificationFunction<OccupationHierarchyHierarchyRow, INewOccupationHierarchyPairSpec> {
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
      return null;
    }
    const parentId = importIdToDBIdMap.get(row.PARENTID);
    const childId = importIdToDBIdMap.get(row.CHILDID);
    if (!parentId || !childId) {
      return null;
    }
    return {
      parentType: parentType,
      parentId: parentId,
      childId: childId,
      childType: childType
    };
  };
}

// function to parse from url
export async function parseOccupationHierarchyFromUrl(modelId: string, url: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, batchRowProcessor);
}

export async function parseOccupationHierarchyFromFile(modelId: string, filePath: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> {
  const iscoGroupsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<OccupationHierarchyHierarchyRow>(iscoGroupsCSVFileStream, batchRowProcessor);
}
