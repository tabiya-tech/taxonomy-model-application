import ModelInfoAPISpecs from "api-specifications/modelInfo";
import { IModelInfo } from "./modelInfo.types";
export function transform(data: IModelInfo, baseURL: string): ModelInfoAPISpecs.Types.POST.Response.Payload {
  return {
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
    importProcessState: data.importProcessState,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}
