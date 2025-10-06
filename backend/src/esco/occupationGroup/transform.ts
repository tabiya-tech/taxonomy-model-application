import { IOccupationGroup } from "esco/occupationGroup/OccupationGroup.types";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { Routes } from "routes.constant";
import { ObjectTypes } from "esco/common/objectTypes";

export function transform(
  data: IOccupationGroup,
  baseURL: string
): OccupationGroupAPISpecs.Types.Response.IOccupationGroup {
  return {
    id: data.id,
    UUID: data.UUID,
    UUIDHistory: data.UUIDHistory,
    code: data.code,
    originUri: data.originUri,
    preferredLabel: data.preferredLabel,
    altLabels: data.altLabels,
    groupType:
      data.groupType === ObjectTypes.ISCOGroup
        ? OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup
        : OccupationGroupAPISpecs.Enums.ObjectTypes.LocalGroup,
    description: data.description,
    parent: data.parent?.id
      ? {
          id: data.parent.id,
          UUID: data.parent.UUID,
          code: data.parent.code,
          preferredLabel: data.parent.preferredLabel,
          objectType:
            data.parent.objectType == ObjectTypes.ISCOGroup
              ? OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup
              : OccupationGroupAPISpecs.Enums.ObjectTypes.LocalGroup,
        }
      : null,
    children: data.children?.length
      ? data.children.map((child) => {
          if ("objectType" in child) {
            return {
              id: child.id,
              UUID: child.UUID,
              code: child.code,
              preferredLabel: child.preferredLabel,
              objectType:
                child.objectType === ObjectTypes.ISCOGroup
                  ? OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup
                  : OccupationGroupAPISpecs.Enums.ObjectTypes.LocalGroup,
            };
          } else {
            return {
              id: child.id,
              UUID: child.UUID,
              code: child.code,
              preferredLabel: child.preferredLabel,
              objectType:
                child?.occupationType === ObjectTypes.ESCOOccupation
                  ? OccupationGroupAPISpecs.Enums.ObjectTypes.ESCOOccupation
                  : OccupationGroupAPISpecs.Enums.ObjectTypes.LocalOccupation,
            };
          }
        })
      : [],
    modelId: data.modelId,
    path: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/occupationGroups/${data.id}`,
    tabiyaPath: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/occupationGroups/${data.UUID}`,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    originUUID: data.UUIDHistory && data.UUIDHistory.length > 0 ? data.UUIDHistory.at(-1)! : "",
  };
}

export function transformPaginated(
  data: IOccupationGroup[],
  baseURL: string,
  limit: number,
  cursor: string | null
): OccupationGroupAPISpecs.Types.GET.Response.Payload {
  return {
    data: data.map((item) => transform(item, baseURL)),
    limit,
    nextCursor: cursor,
  };
}
