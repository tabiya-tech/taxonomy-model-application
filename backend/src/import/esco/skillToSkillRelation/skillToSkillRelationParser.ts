import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";
import { getRelationBatchFunction } from "import/esco/common/processRelationBatchFunction";
import {
  INewSkillToSkillPairSpec,
  ISkillToSkillRelationPair,
} from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { ISkillToSkillsRelationImportRow, skillToSkillRelationImportHeaders } from "esco/common/entityToCSV.types";
import { getSkillToSkillRelationTypeFromCSVRelationType } from "esco/common/csvObjectTypes";

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, skillToSkillRelationImportHeaders);
}

function getBatchProcessor(modelId: string) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getRelationBatchFunction<ISkillToSkillRelationPair, INewSkillToSkillPairSpec>(
    modelId,
    "SkillToSkillRelation",
    getRepositoryRegistry().skillToSkillRelation
  );
  return new BatchProcessor<INewSkillToSkillPairSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  _modelId: string,
  importIdToDBIdMap: Map<string, string>
): TransformRowToSpecificationFunction<ISkillToSkillsRelationImportRow, INewSkillToSkillPairSpec> {
  return (row: ISkillToSkillsRelationImportRow) => {
    // Check if relation type is valid
    const relationType = getSkillToSkillRelationTypeFromCSVRelationType(row.RELATIONTYPE);
    if (relationType === null) {
      errorLogger.logWarning(
        `Failed to import SkillToSkillRelation row with requiringSkillId:'${row.REQUIRINGID}' and requiredSkillId:'${row.REQUIREDID}'`
      );
      return null;
    }
    // Check if requiring skill and required skill exist
    const requiringSkillId = importIdToDBIdMap.get(row.REQUIRINGID);
    const requiredSkillId = importIdToDBIdMap.get(row.REQUIREDID);

    if (!requiringSkillId || !requiredSkillId) {
      errorLogger.logWarning(
        `Failed to import SkillToSkillRelation row with requiringSkillId:'${row.REQUIRINGID}' and requiredSkillId:'${row.REQUIREDID}'`
      );
      return null;
    }
    return {
      requiringSkillId: requiringSkillId,
      requiredSkillId: requiredSkillId,
      relationType: relationType,
    };
  };
}

// Function to parse from URL
export async function parseSkillToSkillRelationFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("SkillToSkillRelation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "SkillToSkillRelation", batchRowProcessor);
}

export async function parseSkillToSkillRelationFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const skillsRelationCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("SkillToSkillRelation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId, importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<ISkillToSkillsRelationImportRow>(
    "SkillToSkillRelation",
    skillsRelationCSVFileStream,
    batchRowProcessor
  );
}
