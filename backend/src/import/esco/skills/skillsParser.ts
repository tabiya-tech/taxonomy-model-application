import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  processDownloadStream,
  processStream
} from "import/stream/processStream";
import fs from "fs";
import {INewSkillSpec, ReuseLevel, SkillType} from "esco/skill/skillModel";
import {BatchProcessor} from "import/batch/BatchProcessor";
import {BatchRowProcessor, TransformRowToSpecificationFunction} from "import/parse/BatchRowProcessor";
import {HeadersValidatorFunction} from "import/parse/RowProcessor.types";
import {getStdHeadersValidator} from "import/parse/stdHeadersValidator";

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
  SKILLTYPE: string
}

function getHeadersValidator(modelId: string): HeadersValidatorFunction {
  return getStdHeadersValidator(modelId, ['ESCOURI', 'ORIGINUUID', 'PREFERREDLABEL', 'ALTLABELS', 'DESCRIPTION', 'DEFINITION', 'SCOPENOTE', 'REUSELEVEL', 'SKILLTYPE']);
}

function getBatchProcessor() {
  const BATCH_SIZE: number = 5000;
  const batchProcessFn = async (specs: INewSkillSpec[]) => {
    try {
      const skillRepository = getRepositoryRegistry().skill;
      await skillRepository.createMany(specs);
    } catch (e: unknown) {
      console.error("Failed to process batch", e);
    }
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
    };
  };
}

// function to parse from url
export async function parseSkillsFromUrl(modelId: string, url: string) {
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor();
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processDownloadStream(url, batchRowProcessor);
}

export async function parseSkillsFromFile(modelId: string, filePath: string) {
  const skillsCSVFileStream = fs.createReadStream(filePath);
  const headersValidator = getHeadersValidator(modelId);
  const transformRowToSpecificationFn = getRowToSpecificationTransformFn(modelId);
  const batchProcessor = getBatchProcessor();
  const batchRowProcessor = new BatchRowProcessor(headersValidator, transformRowToSpecificationFn, batchProcessor);
  return await processStream<ISkillRow>(skillsCSVFileStream, batchRowProcessor);
}