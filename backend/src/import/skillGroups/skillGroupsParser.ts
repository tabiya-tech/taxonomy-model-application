import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {processDownloadStream, processStream} from "import/stream/processStream";
import fs from "fs";
import {INewSkillGroupSpec} from "skillGroup/skillGroupModel";

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

export function getRowProcessor(modelId: string): (row: ISkillGroupRow, index: number) => Promise<void> {

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
  const rowProcessor = getRowProcessor(modelId);
  await processDownloadStream(url, rowProcessor);
}

export async function parseSkillGroupsFromFile(modelId: string, filePath: string) {
  const skillGroupsCSVFileStream = fs.createReadStream(filePath );
  const rowProcessor = getRowProcessor(modelId);
  await processStream<ISkillGroupRow>(skillGroupsCSVFileStream, rowProcessor);
}
