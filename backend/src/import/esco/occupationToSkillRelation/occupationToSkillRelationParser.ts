import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import importLogger from "import/importLogger/importLogger";
import { getRelationBatchFunction } from "import/esco/common/processRelationBatchFunction";
import {
  INewOccupationToSkillPairSpec,
  IOccupationToSkillRelationPair,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { ObjectTypes, RelationType } from "esco/common/objectTypes";

// Expect all columns to be in upper case
export interface OccupationToSkillsRelationRow {
  OCCUPATIONTYPE: string;
  OCCUPATIONID: string;
  SKILLID: string;
  RELATIONTYPE: RelationType;
}

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, ["OCCUPATIONTYPE", "OCCUPATIONID", "SKILLID", "RELATIONTYPE"]);
}

function getBatchProcessor(modelId: string) {
  const BATCH_SIZE: number = 50000;
  const batchProcessFn = getRelationBatchFunction<IOccupationToSkillRelationPair, INewOccupationToSkillPairSpec>(
    modelId,
    "OccupationToSkillRelation",
    getRepositoryRegistry().occupationToSkillRelation
  );
  return new BatchProcessor<INewOccupationToSkillPairSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  importIdToDBIdMap: Map<string, string>
): TransformRowToSpecificationFunction<OccupationToSkillsRelationRow, INewOccupationToSkillPairSpec> {
  return (row: OccupationToSkillsRelationRow) => {
    // Check if relation type is valid
    if (!Object.values(RelationType).includes(row.RELATIONTYPE)) {
      importLogger.logWarning(
        `Failed to import OccupationToSkillRelation row with occupationId:'${row.OCCUPATIONID}' and skillId:'${row.SKILLID}'.`
      );
      return null;
    }
    // Check if occupation type is valid
    const csv2EscoObjectType = (type: string): ObjectTypes.Occupation | null => {
      // | ObjectTypes.LocalOccupation | ObjectTypes.LocalizedOccupation
      switch (type.toUpperCase()) {
        case "ESCO":
          return ObjectTypes.Occupation;
        default:
          return null;
      }
    };
    const occupationType = csv2EscoObjectType(row.OCCUPATIONTYPE);
    if (!occupationType) {
      importLogger.logWarning(
        `Failed to import OccupationToSkillRelation row with occupationId:'${row.OCCUPATIONID}' and skillId:'${row.SKILLID}'.`
      );
      return null;
    }

    // Check if occupation and skill exist
    const occupationId = importIdToDBIdMap.get(row.OCCUPATIONID);
    const skillId = importIdToDBIdMap.get(row.SKILLID);

    if (!occupationId || !skillId) {
      importLogger.logWarning(
        `Failed to import OccupationToSkillRelation row with occupationId:'${row.OCCUPATIONID}' and skillId:'${row.SKILLID}'.`
      );
      return null;
    }

    return {
      requiringOccupationType: occupationType,
      requiringOccupationId: occupationId,
      requiredSkillId: skillId,
      relationType: row.RELATIONTYPE,
    };
  };
}

// Function to parse from URL
export async function parseOccupationToSkillRelationFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("OccupationToSkillRelation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "OccupationToSkillRelation", batchRowProcessor);
}

export async function parseOccupationToSkillRelationFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const skillsRelationCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("OccupationToSkillRelation");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(importIdToDBIdMap);
  const batchProcessor = getBatchProcessor(modelId);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<OccupationToSkillsRelationRow>(
    "OccupationToSkillRelation",
    skillsRelationCSVFileStream,
    batchRowProcessor
  );
}
