import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {
  HeadersValidatorFunction,
  processDownloadStream,
  processStream,
  RowProcessorFunction
} from "import/stream/processStream";
import fs from "fs";
import {INewSkillGroupSpec} from "esco/skillGroup/skillGroupModel";
import {getStdHeadersValidator} from "../stdHeadersValidator";

// expect all columns to be in upper case
export interface ISkillGroupRow {
  ESCOURI: string,
  ORIGINUUID: string
  CODE: string
  PREFERREDLABEL: string
  ALTLABELS: string
  DESCRIPTION: string
  SCOPENOTE: string
}

export function getHeadersValidator(modelid: string): HeadersValidatorFunction {
  return getStdHeadersValidator(modelid, ['ESCOURI', 'ORIGINUUID', 'CODE', 'PREFERREDLABEL', 'ALTLABELS', 'DESCRIPTION', 'SCOPENOTE']);
}
export function getRowProcessor(modelId: string): RowProcessorFunction<ISkillGroupRow> {

  const skillGroupRepository = getRepositoryRegistry().skillGroup;
  return async (row: ISkillGroupRow, index: number) => {
    const spec: INewSkillGroupSpec = {
      ESCOUri: row.ESCOURI ?? '',
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? '',
      code: row.CODE ?? '',
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split('\n') : [],
      description: row.DESCRIPTION ?? '',
      scopeNote: row.SCOPENOTE ?? ''
    };
    try {
      await skillGroupRepository.create(spec);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.warn(`Failed to process row(${index}):'${row}' create skillGroup ${JSON.stringify(spec)}: ${e.message}`);
    }
  };
}


// function to parse from url
export async function parseSkillGroupsFromUrl(modelId: string, url: string) {
  const headersValidator = getHeadersValidator(modelId);
  const rowProcessor = getRowProcessor(modelId);
  await processDownloadStream(url, headersValidator, rowProcessor);
}

export async function parseSkillGroupsFromFile(modelId: string, filePath: string) {
  const skillGroupsCSVFileStream = fs.createReadStream(filePath );
  const headersValidator = getHeadersValidator(modelId);
  const rowProcessor = getRowProcessor(modelId);
  await processStream<ISkillGroupRow>(skillGroupsCSVFileStream, headersValidator, rowProcessor);
}
