import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { processDownloadStream, processStream } from "import/stream/processStream";
import fs from "fs";
import { INewSkillSpec, ISkill, ReuseLevel, SkillType } from "esco/skill/skills.types";
import { BatchProcessor } from "import/batch/BatchProcessor";
import { BatchRowProcessor, TransformRowToSpecificationFunction } from "import/parse/BatchRowProcessor";
import { HeadersValidatorFunction } from "import/parse/RowProcessor.types";
import { getStdHeadersValidator } from "import/parse/stdHeadersValidator";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getProcessEntityBatchFunction } from "import/esco/common/processEntityBatchFunction";

// expect all columns to be in upper case
export interface ISkillRow {
  ESCOURI: string;
  ORIGINUUID: string;
  PREFERREDLABEL: string;
  ALTLABELS: string;
  DESCRIPTION: string;
  DEFINITION: string;
  SCOPENOTE: string;
  REUSELEVEL: string;
  SKILLTYPE: string;
  ID: string;
}

function getHeadersValidator(validatorName: string): HeadersValidatorFunction {
  return getStdHeadersValidator(validatorName, [
    "ESCOURI",
    "ID",
    "ORIGINUUID",
    "PREFERREDLABEL",
    "ALTLABELS",
    "DESCRIPTION",
    "DEFINITION",
    "SCOPENOTE",
    "REUSELEVEL",
    "SKILLTYPE",
  ]);
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = getProcessEntityBatchFunction<ISkill, INewSkillSpec>(
    "Skill",
    getRepositoryRegistry().skill,
    importIdToDBIdMap
  );
  return new BatchProcessor<INewSkillSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(
  modelId: string
): TransformRowToSpecificationFunction<ISkillRow, INewSkillSpec> {
  return (row: ISkillRow) => {
    // @ts-ignore
    return {
      ESCOUri: row.ESCOURI ?? "",
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? "",
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split("\n") : [],
      description: row.DESCRIPTION ?? "",
      definition: row.DEFINITION ?? "",
      scopeNote: row.SCOPENOTE ?? "",
      reuseLevel: (row.REUSELEVEL as ReuseLevel) ?? "",
      skillType: (row.SKILLTYPE as SkillType) ?? "",
      importId: row.ID ?? "",
    };
  };
}

// function to parse from url
export async function parseSkillsFromUrl(
  modelId: string,
  url: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator("Skill");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, "Skill", batchRowProcessor);
}

export async function parseSkillsFromFile(
  modelId: string,
  filePath: string,
  importIdToDBIdMap: Map<string, string>
): Promise<RowsProcessedStats> {
  const skillsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator("Skill");
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<ISkillRow>("Skill", skillsCSVFileStream, batchRowProcessor);
}
