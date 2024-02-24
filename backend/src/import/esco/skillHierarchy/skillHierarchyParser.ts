import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { INewSkillHierarchyPairSpec, ISkillHierarchyPair } from "esco/skillHierarchy/skillHierarchy.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";
import { getRelationBatchFunction } from "import/esco/common/processRelationBatchFunction";
import { ISkillHierarchyImportRow, skillHierarchyImportHeaders } from "esco/common/entityToCSV.types";
import { getObjectTypeFromCSVObjectType } from "esco/common/csvObjectTypes";
import { ObjectTypes } from "esco/common/objectTypes";

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, skillHierarchyImportHeaders);
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
): TransformRowToSpecificationFunction<ISkillHierarchyImportRow, INewSkillHierarchyPairSpec> {
  return (row: ISkillHierarchyImportRow) => {
    const parentType = getObjectTypeFromCSVObjectType(row.PARENTOBJECTTYPE);
    const childType = getObjectTypeFromCSVObjectType(row.CHILDOBJECTTYPE);
    if (
      (parentType !== ObjectTypes.Skill && parentType !== ObjectTypes.SkillGroup) ||
      (childType !== ObjectTypes.Skill && childType !== ObjectTypes.SkillGroup)
    ) {
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
  return await processStream<ISkillHierarchyImportRow>(
    "SkillHierarchy",
    skillsHierarchyCSVFileStream,
    batchRowProcessor
  );
}
