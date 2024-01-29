import ModelInfoAPISpecs from "api-specifications/modelInfo";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { Routes } from "routes.constant";

export function transform(data: IModelInfo, baseURL: string): ModelInfoAPISpecs.Types.Response.IModelInfo  {
  return {
    id: data.id,
    UUID: data.UUID,
    UUIDHistory: data.UUIDHistory,
    name: data.name,
    description: data.description,
    version: data.version,
    released: data.released,
    releaseNotes: data.releaseNotes,
    locale: data.locale,
    path: `${baseURL}${Routes.MODELS_ROUTE}/${data.id}`,
    tabiyaPath: `${baseURL}${Routes.MODELS_ROUTE}/${data.UUID}`,
    exportProcessState: data.exportProcessState.map((exportProcessState) => ({
      ...exportProcessState,
      timestamp: exportProcessState.timestamp.toISOString(),
    })),
    importProcessState: data.importProcessState,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}
