import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { INewSkillHierarchyPairSpec, ISkillHierarchyPair } from "esco/skillHierarchy/skillHierarchy.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";
import { getRelationBatchFunction } from "import/esco/common/processRelationBatchFunction";

// expect all columns to be in upper case
export interface SkillHierarchyRow {
  PARENTOBJECTTYPE: string;
  PARENTID: string;
  CHILDID: string;
  CHILDOBJECTTYPE: string;
}

const enum CSV_OBJECT_TYPES {
  Skill = "SKILL",
  SkillGroup = "SKILLGROUP",
}

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, ["PARENTOBJECTTYPE", "PARENTID", "CHILDID", "CHILDOBJECTTYPE"]);
}

function getBatchProcessor(modelId: string) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getRelationBatchFunction<ISkillHierarchyPair, INewSkillHierarchyPairSpec>(
    modelId,
    "SkillHierarchy",
    getRepositoryRegistry().skillHierarchy
  );
  return new BatchProcessor<INewSkillHierarchyPairSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string,
  importIdToDBIdMap: Map<string, string>
): TransformRowToSpecificationFunction<SkillHierarchyRow, INewSkillHierarchyPairSpec> {
  const csv2EscoObjectType = (type: string): ObjectTypes.Skill | ObjectTypes.SkillGroup | null => {
    switch (type.toUpperCase()) {
      case CSV_OBJECT_TYPES.Skill:
        return ObjectTypes.Skill;
      case CSV_OBJECT_TYPES.SkillGroup:
        return ObjectTypes.SkillGroup;
      default:
        return null;
    }
  };

  return (row: SkillHierarchyRow) => {
    const parentType = csv2EscoObjectType(row.PARENTOBJECTTYPE);
    const childType = csv2EscoObjectType(row.CHILDOBJECTTYPE);
    if (!parentType || !childType) {
      errorLogger.logWarning(
        `Failed to import SkillHierarchy row with parentType:'${row.PARENTOBJECTTYPE}' and childType:'${row.CHILDOBJECTTYPE}'`
      );
      return null;
    }
    const parentId = importIdToDBIdMap.get(row.PARENTID);
    const childId = importIdToDBIdMap.get(row.CHILDID);
    if (!parentId || !childId) {
      errorLogger.logWarning(
        `Failed to import SkillHierarchy row with parent importId:'${row.PARENTID}' and child importId:'${row.CHILDID}'`
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
export async function parseSkillHierarchyFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("SkillHierarchy");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "SkillHierarchy", batchRowProcessor);
}

export async function parseSkillHierarchyFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const skillsHierarchyCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("SkillHierarchy");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<SkillHierarchyRow>("SkillHierarchy", skillsHierarchyCSVFileStream, batchRowProcessor);
}
