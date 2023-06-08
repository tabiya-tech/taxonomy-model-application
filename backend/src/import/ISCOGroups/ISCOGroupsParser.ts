import {INewISCOGroupSpec} from "esco/iscoGroup/ISCOGroupModel";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {processDownloadStream, processStream} from "import/stream/processStream";
import fs from "fs";

// expect all columns to be in upper case
export interface IISCOGroupRow {
  ESCOURI: string,
  ORIGINUUID: string
  ISCOCODE: string
  PREFERREDLABEL: string
  ALTLABELS: string
  DESCRIPTION: string
}

export function getRowProcessor(modelId: string): (row: IISCOGroupRow, index: number) => Promise<void> {

  const ISCOGroupRepository = getRepositoryRegistry().ISCOGroup;
  return async (row: IISCOGroupRow, index: number) => {
    const spec: INewISCOGroupSpec = {
      ESCOUri: row.ESCOURI ?? '',
      modelId: modelId,
      originUUID: row.ORIGINUUID ?? '',
      ISCOCode: row.ISCOCODE,
      preferredLabel: row.PREFERREDLABEL,
      altLabels: row.ALTLABELS ? row.ALTLABELS.split('\n') : [],
      description: row.DESCRIPTION ?? ''
    };
    try {
      await ISCOGroupRepository.create(spec);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.warn(`Failed to process row(${index}):'${row}' create ISCOGroup ${JSON.stringify(spec)}: ${e.message}`);
    }
  };
}

// function to parse from url
export async function parseISCOGroupsFromUrl(modelId: string, url: string): Promise<void> {
  const rowProcessor = getRowProcessor(modelId);
  await processDownloadStream(url, rowProcessor);
}

export async function parseISCOGroupsFromFile(modelId: string, filePath: string): Promise<void> {
  const iscoGroupsCSVFileStream = fs.createReadStream(filePath );
  const rowProcessor = getRowProcessor(modelId);
  await processStream<IISCOGroupRow>(iscoGroupsCSVFileStream, rowProcessor);
}
