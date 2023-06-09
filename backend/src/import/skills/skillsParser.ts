import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {HeadersValidatorFunction, processDownloadStream, processStream} from "import/stream/processStream";
import fs from "fs";
import {INewSkillSpec, ReuseLevel, SkillType} from "esco/skill/skillModel";
import {getStdHeadersValidator} from "../stdHeadersValidator";

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

export function getHeadersValidator(modelId: string): HeadersValidatorFunction {
  return getStdHeadersValidator(modelId, ['ESCOURI', 'ORIGINUUID', 'PREFERREDLABEL', 'ALTLABELS', 'DESCRIPTION', 'DEFINITION', 'SCOPENOTE', 'REUSELEVEL', 'SKILLTYPE']);
}

export function getRowProcessor(modelId: string): (row: ISkillRow, index: number) => Promise<void> {

  const skillRepository = getRepositoryRegistry().skill;
  return async (row: ISkillRow, index: number) => {
    // @ts-ignore
    const spec: INewSkillSpec = {
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
    try {
      await skillRepository.create(spec);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.warn(`Failed to process row(${index}):'${row}' create skill ${JSON.stringify(spec)}: ${e.message}`);
    }
  };
}

// function to parse from url
export async function parseSkillsFromUrl(modelId: string, url: string) {
  const headersValidator = getHeadersValidator(modelId);
  const rowProcessor = getRowProcessor(modelId);
  await processDownloadStream(url, headersValidator, rowProcessor);
}

export async function parseSkillsFromFile(modelId: string, filePath: string) {
  const headersValidator = getHeadersValidator(modelId);
  const skillsCSVFileStream = fs.createReadStream(filePath);
  const rowProcessor = getRowProcessor(modelId);
  await processStream<ISkillRow>(skillsCSVFileStream, headersValidator, rowProcessor);
}
