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
  INewOccupationToSkillPairSpec,
  IOccupationToSkillRelationPair,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { RelationType } from "esco/common/objectTypes";
import { getOccupationTypeFromRow } from "import/esco/common/getOccupationTypeFromRow";
import {
  IOccupationToSkillRelationImportRow,
  occupationToSkillRelationImportHeaders,
} from "esco/common/entityToCSV.types";

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, occupationToSkillRelationImportHeaders);
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
): TransformRowToSpecificationFunction<IOccupationToSkillRelationImportRow, INewOccupationToSkillPairSpec> {
  return (row: IOccupationToSkillRelationImportRow) => {
    // Check if relation type is valid
    if (!Object.values(RelationType).includes(row.RELATIONTYPE)) {
      errorLogger.logWarning(
        `Failed to import OccupationToSkillRelation row with occupationId:'${row.OCCUPATIONID}' and skillId:'${row.SKILLID}'.`
      );
      return null;
    }
    // Check if occupation type is valid

    const occupationType = getOccupationTypeFromRow(row);
    if (!occupationType) {
      errorLogger.logWarning(
        `Failed to import OccupationToSkillRelation row with occupationId:'${row.OCCUPATIONID}' and skillId:'${row.SKILLID}'.`
      );
      return null;
    }

    // Check if occupation and skill exist
    const occupationId = importIdToDBIdMap.get(row.OCCUPATIONID);
    const skillId = importIdToDBIdMap.get(row.SKILLID);

    if (!occupationId || !skillId) {
      errorLogger.logWarning(
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
  return await processStream<IOccupationToSkillRelationImportRow>(
    "OccupationToSkillRelation",
    skillsRelationCSVFileStream,
    batchRowProcessor
  );
}
