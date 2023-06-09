import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  processDownloadStream,
  processStream
} from "import/stream/processStream";
import fs from "fs";
import {INewSkillSpec, ReuseLevel, SkillType} from "esco/skill/skills.types";
import {BatchProcessor} from "import/batch/BatchProcessor";
import {BatchRowProcessor, TransformRowToSpecificationFunction} from "import/parse/BatchRowProcessor";
import {HeadersValidatorFunction} from "import/parse/RowProcessor.types";
import {getStdHeadersValidator} from "import/parse/stdHeadersValidator";
import {isSpecified} from "server/isUnspecified";
import {RowsProcessedStats} from "import/rowsProcessedStats.types";

// expect all columns to be in upper case
export interface ISkillRow {
  ESCOURI: string,
  ORIGINUUID: string
  PREFERREDLABEL: string
  ALTLABELS: string
  DESCRIPTION: string
  DEFINITION: string
  SCOPENOTE: string
  REUSELEVEL: string
  SKILLTYPE: string,
  ID: string
}

function getHeadersValidator(modelId: string): HeadersValidatorFunction {
  return getStdHeadersValidator(modelId, ['ESCOURI', 'ID', 'ORIGINUUID', 'PREFERREDLABEL', 'ALTLABELS', 'DESCRIPTION', 'DEFINITION', 'SCOPENOTE', 'REUSELEVEL', 'SKILLTYPE']);
}

function getBatchProcessor(importIdToDBIdMap: Map<string, string>) {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = async (specs: INewSkillSpec[]) => {
    const stats: RowsProcessedStats = {
      rowsProcessed: specs.length,
      rowsSuccess: 0,
      rowsFailed: 0
    };
    try {
      const skillRepository = getRepositoryRegistry().skill;
      const skills = await skillRepository.createMany(specs);
      // map the importId to the db id
      // They will be used in a later stage to build the hierarchy and associations
      skills.forEach((skill) => {
        if (isSpecified(skill.importId)) {
          importIdToDBIdMap.set(skill.importId, skill.id);
        }
      });
      stats.rowsSuccess = skills.length;
    } catch (e: unknown) {
      console.error("Failed to process batch", e);
    }
    stats.rowsFailed = specs.length - stats.rowsSuccess;
    return stats;
  };
  return new BatchProcessor<INewSkillSpec>(BATCH_SIZE, batchProcessFn);
}

function getRowToSpecificationTransformFn(modelId: string): TransformRowToSpecificationFunction<ISkillRow, INewSkillSpec> {
  return (row: ISkillRow) => {
    // @ts-ignore
    return {
      ESCOUri: row.ESCOURI ?? '',
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? '',
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split('\n') : [],
      description: row.DESCRIPTION ?? '',
      definition: row.DEFINITION ?? '',
      scopeNote: row.SCOPENOTE ?? '',
      reuseLevel: row.REUSELEVEL as ReuseLevel ?? '',
      skillType: row.SKILLTYPE as SkillType ?? '',
      importId: row.ID ?? '',
    };
  };
}

// function to parse from url
export async function parseSkillsFromUrl(modelId: string, url: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> {
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, batchRowProcessor);
}

export async function parseSkillsFromFile(modelId: string, filePath: string, importIdToDBIdMap: Map<string, string>): Promise<RowsProcessedStats> {
  const skillsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor(importIdToDBIdMap);
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<ISkillRow>(skillsCSVFileStream, batchRowProcessor);
}