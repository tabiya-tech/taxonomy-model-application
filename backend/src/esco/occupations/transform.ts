import OccupationAPISpecs from "api-specifications/esco/occupation";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { IOccupation } from "./occupation.types";
import { IOccupationGroup } from "esco/occupationGroup/OccupationGroup.types";
import { Routes } from "routes.constant";
import { ObjectTypes } from "esco/common/objectTypes";
import { getOriginUUIDFromUUIDHistory } from "common/getOriginUUIDFromUUIDHistory/getOriginUUIDFromUUIDHistory";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { transform as transformSkill } from "esco/skill/transform";
import { transform as transformOccupationGroup } from "esco/occupationGroup/transform";
import { ISkillWithRelation } from "./occupationService.types";

function transformParentObjectType(
  parent: NonNullable<IOccupation["parent"]> | IOccupationGroup
): OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes {
  const isOccupation = "occupationType" in parent;

  // Handling occupations parents, since an occupation can have a parent of an occupation
  // and a parent of a local occupation.
  if (isOccupation) {
    if (parent.occupationType === ObjectTypes.ESCOOccupation) {
      return OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.ESCOOccupation;
    } else {
      return OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.LocalOccupation;
    }
  }

  // An occupation can also have a parent as an occupation-group.
  // IOccupationGroup has groupType, IOccupationGroupReference has objectType
  const groupTypeValue = "groupType" in parent ? parent.groupType : parent.objectType;
  if (groupTypeValue === ObjectTypes.ISCOGroup) {
    return OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.ISCOGroup;
  } else {
    return OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.LocalGroup;
  }
}

function transformChildObjectType(
  child: IOccupation["children"][number] | IOccupationGroup
): OccupationAPISpecs.Enums.Relations.Children.ObjectTypes {
  const isOccupation = "occupationType" in child;

  if (isOccupation) {
    if (child.occupationType === ObjectTypes.ESCOOccupation) {
      return OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation;
    } else {
      return OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation;
    }
  }

  // An occupation can also have a child as an occupation-group.
  // IOccupationGroup has groupType, IOccupationGroupReference has objectType
  const groupTypeValue = "groupType" in child ? child.groupType : child.objectType;
  if (groupTypeValue === ObjectTypes.ISCOGroup) {
    return OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup;
  } else {
    return OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.LocalGroup;
  }
}

/**
 * Transforms a parent relation item into its minimal response representation.
 * Used for the 'parent' property inside an Occupation object.
 */
export function transformParent(
  parent: IOccupation["parent"] | IOccupationGroup
): OccupationAPISpecs.Types.Response.IOccupation["parent"] {
  if (!parent) {
    return null;
  }

  return {
    id: parent.id,
    UUID: parent.UUID,
    code: parent.code,
    preferredLabel: parent.preferredLabel,
    objectType: transformParentObjectType(parent),
  };
}

/**
 * Transforms a child relation item into its minimal response representation.
 * Used for the 'children' property items inside an Occupation object.
 */
export function transformChild(
  child: IOccupation["children"][number] | IOccupationGroup
): OccupationAPISpecs.Types.Response.IOccupation["children"][0] {
  return {
    id: child.id,
    UUID: child.UUID,
    code: child.code,
    preferredLabel: child.preferredLabel,
    objectType: transformChildObjectType(child),
  };
}

export function transformChildren(
  children: (IOccupation["children"][number] | IOccupationGroup)[]
): OccupationAPISpecs.Types.Response.IOccupation["children"] {
  return children.map(transformChild);
}

function transformOccupationType(occupationType: IOccupation["occupationType"]) {
  if (occupationType === ObjectTypes.ESCOOccupation) {
    return OccupationAPISpecs.Enums.OccupationType.ESCOOccupation;
  }

  return OccupationAPISpecs.Enums.OccupationType.LocalOccupation;
}

export function transformSkillRelationType(
  relationType: IOccupation["requiresSkills"][number]["relationType"]
): OccupationAPISpecs.Enums.OccupationToSkillRelationType | null {
  switch (relationType) {
    case OccupationToSkillRelationType.NONE:
      return null;
    case OccupationToSkillRelationType.ESSENTIAL:
      return OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL;
    case OccupationToSkillRelationType.OPTIONAL:
      return OccupationAPISpecs.Enums.OccupationToSkillRelationType.OPTIONAL;
    default:
      return null;
  }
}

function transformRequiredSkills(
  requiresSkills: IOccupation["requiresSkills"]
): OccupationAPISpecs.Types.Response.IOccupation["requiresSkills"] {
  return requiresSkills.map((skillRef) => ({
    id: skillRef.id,
    UUID: skillRef.UUID,
    preferredLabel: skillRef.preferredLabel,
    isLocalized: skillRef.isLocalized,
    objectType: OccupationAPISpecs.Enums.Relations.RequiredSkills.ObjectTypes.Skill,
    relationType: transformSkillRelationType(skillRef.relationType),
    signallingValue: skillRef.signallingValue,
    signallingValueLabel: skillRef.signallingValueLabel || null,
  }));
}

/**
 * Transforms a full Occupation entity into its response representation.
 */
export function transform(data: IOccupation, baseURL: string): OccupationAPISpecs.Types.Response.IOccupation {
  return {
    id: data.id,
    UUID: data.UUID,
    UUIDHistory: data.UUIDHistory,
    path: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/occupations/${data.id}`,
    tabiyaPath: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/occupations/${data.UUID}`,
    code: data.code,
    occupationGroupCode: data.occupationGroupCode,
    preferredLabel: data.preferredLabel,
    originUri: data.originUri,
    altLabels: data.altLabels,
    definition: data.definition,
    description: data.description,
    regulatedProfessionNote: data.regulatedProfessionNote,
    scopeNote: data.scopeNote,
    occupationType: transformOccupationType(data.occupationType),
    modelId: data.modelId,
    isLocalized: data.isLocalized,
    parent: transformParent(data.parent),
    children: transformChildren(data.children),
    requiresSkills: transformRequiredSkills(data.requiresSkills),
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    originUUID: getOriginUUIDFromUUIDHistory(data.UUIDHistory),
  };
}

/**
 * Transforms a dynamic entity (Occupation or OccupationGroup) into its FULL response representation.
 * Used for relation endpoints (/parent, /children) that return full objects.
 */
export function transformDynamicEntity(
  data: IOccupation | IOccupationGroup,
  baseURL: string
): OccupationAPISpecs.Types.Response.IOccupation | OccupationGroupAPISpecs.Types.Response.IOccupationGroup {
  if ("occupationType" in data) {
    return transform(data as IOccupation, baseURL);
  } else {
    return transformOccupationGroup(data as IOccupationGroup, baseURL);
  }
}

/**
 * Paginated transformation for relation endpoints that return mixed types (Occupation/OccupationGroup).
 */
export function transformPaginatedRelation(
  data: (IOccupation | IOccupationGroup)[],
  baseURL: string,
  limit: number,
  cursor: string | null
): {
  data: (OccupationAPISpecs.Types.Response.IOccupation | OccupationGroupAPISpecs.Types.Response.IOccupationGroup)[];
  limit: number;
  nextCursor: string | null;
} {
  return {
    data: data.map((item) => transformDynamicEntity(item, baseURL)),
    limit,
    nextCursor: cursor,
  };
}

// Paginated transformation for occupations list
export function transformPaginated(
  data: IOccupation[],
  baseURL: string,
  limit: number,
  cursor: string | null
): OccupationAPISpecs.Types.GET.Response.Payload {
  return {
    data: data.map((item) => transform(item, baseURL)),
    limit,
    nextCursor: cursor,
  };
}

export function transformOccupationSkill(
  skillData: ISkillWithRelation,
  baseURL: string
): OccupationAPISpecs.Types.GET.Skills.Response.SkillItem {
  const transformedSkill = transformSkill(skillData, baseURL);
  return {
    ...transformedSkill,
    relationType: transformSkillRelationType(skillData.relationType),
    signallingValue: skillData.signallingValue,
    signallingValueLabel: skillData.signallingValueLabel || null,
  };
}

export function transformPaginatedSkills(
  data: ISkillWithRelation[],
  baseURL: string,
  limit: number,
  cursor: string | null
): OccupationAPISpecs.Types.GET.Skills.Response.Payload {
  return {
    data: data.map((item) => transformOccupationSkill(item, baseURL)),
    limit,
    nextCursor: cursor,
  };
}
