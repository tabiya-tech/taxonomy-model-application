import {INewISCOGroupSpec} from "iscoGroup/ISCOGroupModel";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {SkillGroupSpec} from "../../skillGroup/skillGroupModel";

// TODO: write an integration test for this function with in memory MongoDB
// TODO: consider moving to https://csv.js.org/parse/distributions/nodejs_esm/
//  see https://csv.js.org/parse/api/sync/ for the API. Since the data we read are already in memory, we can use the sync API
//  for more efficient usage of memory and CPU use streaming api and pipes/pipeline
export async function parseISCOGroups(modelId: string, data: string[][]): Promise<void> {

  const ISCOGroupRepository = getRepositoryRegistry().ISCOGroup;

  if (!data || data.length < 2) {
    throw new Error("Parse Error");
  }

  // Expect that the first row contains the column headers
  const header: string[] = data[0];
  const column_Description = header.indexOf("description");
  const column_preferredLabel = header.indexOf("preferredLabel");
  const column_ISCOcode = header.indexOf("ISCOcode");
  const column_ESCOUri = header.indexOf("ESCOUri");
  const column_OriginUUID = header.indexOf("OriginUUID");
  const column_altLabels = header.indexOf("altLabels");

  for (let index = 1; index < data.length; index++) {
    const row = data[index];
    const spec: INewISCOGroupSpec = {
      ESCOUri: row[column_ESCOUri] ?? '',
      modelId: modelId,
      originUUID: row[column_OriginUUID] ?? '',
      ISCOCode: row[column_ISCOcode],
      preferredLabel: row[column_preferredLabel],
      altLabels: row[column_altLabels] ? row[column_altLabels].split(','): [],
      description: row[column_Description] ?? ''
    };
    try {
      await ISCOGroupRepository.create(spec);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.warn(`Failed to process row(${index}):'${row}' create ISCOGroup ${JSON.stringify(spec)}: ${e.message}`);
    }
  }
}

export async function parseESCOSkillGroups(modelId: string, data: string[][]): Promise<void> {
  const skillGroupRepository = getRepositoryRegistry().skillGroup;

  if (!data || data.length < 2) {
    throw new Error("Parse Error");
  }

  // Expect that the first row contains the column headers
  const header: string[] = data[0];
  const column_Description = header.indexOf("description");
  const column_preferredLabel = header.indexOf("preferredLabel");
  const column_code = header.indexOf("SkillGroupcode");
  const column_ESCOUri = header.indexOf("ESCOUri");
  const column_OriginUUID = header.indexOf("OriginUUID");
  const column_altLabels = header.indexOf("altLabels");
  const column_scopeNote = header.indexOf("scopeNote");

  for (let index = 1; index < data.length; index++) {
    const row = data[index];
    const spec: SkillGroupSpec = {
      ESCOUri: row[column_ESCOUri] ?? '',
      modelId: modelId,
      originUUID: row[column_OriginUUID] ?? '',
      code: row[column_code] ?? '',
      preferredLabel: row[column_preferredLabel],
      altLabels: row[column_altLabels] ? row[column_altLabels].split(','): [],
      description: row[column_Description] ?? '',
      scopeNote: row[column_scopeNote] ?? '',
    };
    try {
      await skillGroupRepository.create(spec);
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.warn(`Failed to process row(${index}):'${row}' create skillGroup ${JSON.stringify(spec)}: ${e.message}`);
    }
  }
}