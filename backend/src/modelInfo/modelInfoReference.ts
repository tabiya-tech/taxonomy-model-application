import { IModelInfo, IModelInfoReference } from "./modelInfo.types";

/**
 * Maps a full IModelInfo to a lightweight IModelInfoReference (the stripped-down shape used in entity history
 * responses). Keeps only the fields needed to identify/show a model.
 */
export function toModelReference(model: IModelInfo): IModelInfoReference {
  return {
    id: model.id,
    UUID: model.UUID,
    name: model.name,
    version: model.version,
    localeShortCode: model.locale.shortCode,
  };
}
