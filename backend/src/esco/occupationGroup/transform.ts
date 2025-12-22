import { IOccupationGroup, IOccupationGroupChild } from "esco/occupationGroup/OccupationGroup.types";
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
              ? OccupationGroupAPISpecs.Enums.Relations.Parent.ObjectTypes.ISCOGroup
              : OccupationGroupAPISpecs.Enums.Relations.Parent.ObjectTypes.LocalGroup,
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
                  ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup
                  : OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup,
            };
          } else {
            return {
              id: child.id,
              UUID: child.UUID,
              code: child.code,
              preferredLabel: child.preferredLabel,
              objectType:
                child?.occupationType === ObjectTypes.ESCOOccupation
                  ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation
                  : OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation,
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

export function transformParent(
  data: IOccupationGroup,
  baseURL: string
): OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload {
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
              ? OccupationGroupAPISpecs.Enums.Relations.Parent.ObjectTypes.ISCOGroup
              : OccupationGroupAPISpecs.Enums.Relations.Parent.ObjectTypes.LocalGroup,
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
                  ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup
                  : OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup,
            };
          } else {
            return {
              id: child.id,
              UUID: child.UUID,
              code: child.code,
              preferredLabel: child.preferredLabel,
              objectType:
                child?.occupationType === ObjectTypes.ESCOOccupation
                  ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation
                  : OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation,
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

export function transformChild(
  data: IOccupationGroupChild,
  baseURL: string
): OccupationGroupAPISpecs.Types.GET.Response.Child.Payload {
  return {
    id: data.id,
    parentId: data.parentId,
    UUID: data.UUID,
    originUUID: data.UUIDHistory && data.UUIDHistory.length > 0 ? data.UUIDHistory.at(-1)! : "",
    path: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/occupationGroups/${data.id}/children`,
    tabiyaPath: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/occupationGroups/${data.UUID}/children`,
    UUIDHistory: data.UUIDHistory,
    originUri: data.originUri,
    code: data.code,
    description: data.description,
    preferredLabel: data.preferredLabel,
    altLabels: data.altLabels,
    objectType:
      data.objectType === ObjectTypes.ISCOGroup
        ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup
        : data.objectType === ObjectTypes.LocalGroup
        ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup
        : data.objectType === ObjectTypes.ESCOOccupation
        ? OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation
        : OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation,
    modelId: data.modelId,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}

export function transformPaginatedChildren(
  data: IOccupationGroupChild[],
  baseURL: string,
  limit: number | null,
  cursor: string | null
): OccupationGroupAPISpecs.Types.GET.Response.Children.Payload {
  return {
    data: data.map((item) => transformChild(item, baseURL)),
    limit,
    nextCursor: cursor,
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
