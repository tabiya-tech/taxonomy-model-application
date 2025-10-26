import OccupationAPISpecs from "api-specifications/esco/occupation";
import { IOccupation } from "./occupation.types";
import { Routes } from "routes.constant";
import { ObjectTypes } from "esco/common/objectTypes";

export function transform(data: IOccupation, baseURL: string): OccupationAPISpecs.Types.Response.IOccupation {
  return {
    id: data.id,
    UUID: data.UUID,
    UUIDHistory: data.UUIDHistory ?? [],
    path: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/occupations/${data.id}`,
    tabiyaPath: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/occupations/${data.UUID}`,
    code: data.code,
    occupationGroupCode: data.occupationGroupCode,
    preferredLabel: data.preferredLabel,
    originUri: data.originUri,
    altLabels: data.altLabels ?? [],
    definition: data.definition,
    description: data.description,
    regulatedProfessionNote: data.regulatedProfessionNote,
    scopeNote: data.scopeNote,
    occupationType:
      data.occupationType === ObjectTypes.ESCOOccupation
        ? OccupationAPISpecs.Enums.OccupationType.ESCOOccupation
        : OccupationAPISpecs.Enums.OccupationType.LocalOccupation,
    modelId: data.modelId,
    isLocalized: data.isLocalized,
    parent: data.parent
      ? {
          id: data.parent.id,
          UUID: data.parent.UUID,
          code: data.parent.code,
          preferredLabel: data.parent.preferredLabel,
          objectType:
            "occupationType" in data.parent
              ? data.parent.occupationType === ObjectTypes.ESCOOccupation
                ? OccupationAPISpecs.Enums.ObjectTypes.ESCOOccupation
                : OccupationAPISpecs.Enums.ObjectTypes.LocalOccupation
              : data.parent.objectType === ObjectTypes.ISCOGroup
              ? OccupationAPISpecs.Enums.ObjectTypes.ISCOGroup
              : OccupationAPISpecs.Enums.ObjectTypes.LocalGroup,
        }
      : null,
    children: (data.children ?? []).map((child) =>
      "occupationType" in child
        ? {
            id: child.id,
            UUID: child.UUID,
            code: child.code,
            preferredLabel: child.preferredLabel,
            objectType:
              child.occupationType === ObjectTypes.ESCOOccupation
                ? OccupationAPISpecs.Enums.ObjectTypes.ESCOOccupation
                : OccupationAPISpecs.Enums.ObjectTypes.LocalOccupation,
          }
        : {
            id: child.id,
            UUID: child.UUID,
            code: child.code,
            preferredLabel: child.preferredLabel,
            objectType:
              child.objectType === ObjectTypes.ISCOGroup
                ? OccupationAPISpecs.Enums.ObjectTypes.ISCOGroup
                : OccupationAPISpecs.Enums.ObjectTypes.LocalGroup,
          }
    ),
    requiresSkills: (data.requiresSkills ?? []).map((skillRef) => ({
      id: skillRef.id,
      UUID: skillRef.UUID,
      preferredLabel: skillRef.preferredLabel,
      isLocalized: skillRef.isLocalized,
      objectType: OccupationAPISpecs.Enums.ObjectTypes.Skill,
      relationType:
        data.occupationType === ObjectTypes.ESCOOccupation
          ? skillRef.relationType
          : OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE,
      signallingValue: data.occupationType === ObjectTypes.LocalOccupation ? skillRef.signallingValue : null,
      signallingValueLabel: data.occupationType === ObjectTypes.LocalOccupation ? skillRef.signallingValueLabel : null,
    })),
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    originUUID: data.UUIDHistory && data.UUIDHistory.length > 0 ? data.UUIDHistory[0] : "",
  };
}

// Paginated transformation for occupations
export function transformPaginated(
  data: IOccupation[],
  baseURL: string,
  limit: number,
  cursor: string | null
): OccupationAPISpecs.Types.GET.Response.Payload {
  return {
    items: data.map((item) => transform(item, baseURL)),
    limit,
    next_cursor: cursor ? cursor : null,
  };
}
