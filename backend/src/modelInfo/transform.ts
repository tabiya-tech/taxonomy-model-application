import {IModelInfo} from "./modelInfoModel";
import {
  IModelInfoResponse,
} from 'api-specifications/modelInfo';
export function transform(data: IModelInfo, baseURL: string): IModelInfoResponse {
  return  {
    id: data.id,
    UUID: data.UUID,
    name: data.name,
    description: data.description,
    version: data.version,
    released: data.released,
    releaseNotes: data.releaseNotes,
    originUUID: data.originUUID,
    previousUUID: data.previousUUID,
    locale: data.locale,
    path: `${baseURL}/${data.id}`,
    tabiyaPath: `${baseURL}/${data.UUID}`,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString()
  };
}