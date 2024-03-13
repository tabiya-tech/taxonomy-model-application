import ModelInfoAPISpecs from "api-specifications/modelInfo";
import { IModelInfo, IModelInfoReference } from "modelInfo/modelInfo.types";
import { Routes } from "routes.constant";

export function transform(
  data: IModelInfo,
  baseURL: string,
  uuidHistoryDetails: IModelInfoReference[]
): ModelInfoAPISpecs.Types.Response.IModelInfo {
  return {
    id: data.id,
    UUID: data.UUID,
    modelHistory: uuidHistoryDetails,
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
      createdAt: exportProcessState.createdAt.toISOString(),
      updatedAt: exportProcessState.updatedAt.toISOString(),
    })),
    importProcessState: {
      ...data.importProcessState,
      // in the case that the model is created but not imported, the createdAt and updatedAt are undefined
      // we have to check for that and respond accordingly
      createdAt: data.importProcessState.createdAt ? data.importProcessState.createdAt.toISOString() : undefined,
      updatedAt: data.importProcessState.updatedAt ? data.importProcessState.updatedAt.toISOString() : undefined,
    },
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}
