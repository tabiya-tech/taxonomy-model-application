import { ISkillGroup } from "esco/skillGroup/skillGroup.types";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { Routes } from "routes.constant";
import { ObjectTypes } from "esco/common/objectTypes";

export function transform(data: ISkillGroup, baseURL: string): SkillGroupAPISpecs.Types.Response.ISkillGroup {
  return {
    id: data.id,
    UUID: data.UUID,
    UUIDHistory: data.UUIDHistory,
    code: data.code,
    originUri: data.originUri,
    preferredLabel: data.preferredLabel,
    altLabels: data.altLabels,
    description: data.description,
    scopeNote: data.scopeNote,
    parents: data.parents?.length
      ? data.parents.map((parent) => ({
          id: parent.id,
          UUID: parent.UUID,
          code: parent.code,
          preferredLabel: parent.preferredLabel,
          objectType: SkillGroupAPISpecs.Enums.Relations.Parents.ObjectTypes.SkillGroup,
        }))
      : [],
    children: data.children?.length
      ? data.children.map((child) => {
          if ("isLocalized" in child && child.objectType === ObjectTypes.Skill) {
            return {
              id: child.id,
              UUID: child.UUID,
              preferredLabel: child.preferredLabel,
              objectType: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.Skill,
              isLocalized: child.isLocalized,
            };
          } else {
            return {
              id: child.id,
              UUID: child.UUID,
              code: child.code,
              preferredLabel: child.preferredLabel,
              objectType: SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.SkillGroup,
            };
          }
        })
      : [],
    originUUID: data.UUIDHistory && data.UUIDHistory.length > 0 ? data.UUIDHistory.at(-1)! : "",
    path: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/skillGroups/${data.id}`,
    tabiyaPath: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/skillGroups/${data.UUID}`,
    modelId: data.modelId,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}

export function transformPaginated(
  data: ISkillGroup[],
  baseURL: string,
  limit: number,
  cursor: string | null
): SkillGroupAPISpecs.Types.GET.Response.Payload {
  return {
    data: data.map((item) => transform(item, baseURL)),
    limit,
    nextCursor: cursor,
  };
}
