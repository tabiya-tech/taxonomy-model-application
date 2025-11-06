import OccupationAPISpecs from "api-specifications/esco/occupation";
import { IOccupation } from "./occupation.types";
import { Routes } from "routes.constant";
import { ObjectTypes } from "esco/common/objectTypes";
import { getOriginUUIDFromUUIDHistory } from "common/getOriginUUIDFromUUIDHistory/getOriginUUIDFromUUIDHistory";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

function transformParentObjectType(
  parent: NonNullable<IOccupation["parent"]>
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
  if (parent.objectType === ObjectTypes.ISCOGroup) {
    return OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.ISCOGroup;
  } else {
    return OccupationAPISpecs.Enums.Relations.Parent.ObjectTypes.LocalGroup;
  }
}

function transformChildObjectType(
  child: IOccupation["children"][number]
): OccupationAPISpecs.Enums.Relations.Children.ObjectTypes {
  const isOccupation = "occupationType" in child;
  if (!isOccupation) {
    // ref: backend/taxonomy-hierarchy.md
    throw new Error("An occupation can only have a child of occupation and not occupation groups.");
  }

  if (child.occupationType === ObjectTypes.ESCOOccupation) {
    return OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation;
  } else {
    return OccupationAPISpecs.Enums.Relations.Children.ObjectTypes.LocalOccupation;
  }
}

function transformParent(parent: IOccupation["parent"]): OccupationAPISpecs.Types.Response.IOccupation["parent"] {
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

function transformChildren(
  children: IOccupation["children"]
): OccupationAPISpecs.Types.Response.IOccupation["children"] {
  return children.map((child) => ({
    id: child.id,
    UUID: child.UUID,
    code: child.code,
    preferredLabel: child.preferredLabel,
    objectType: transformChildObjectType(child),
  }));
}

function transformOccupationType(occupationType: IOccupation["occupationType"]) {
  if (occupationType === ObjectTypes.ESCOOccupation) {
    return OccupationAPISpecs.Enums.OccupationType.ESCOOccupation;
  }

  return OccupationAPISpecs.Enums.OccupationType.LocalOccupation;
}

function transformSkillRelationType(
  relationType: IOccupation["requiresSkills"][number]["relationType"]
): OccupationAPISpecs.Enums.OccupationToSkillRelationType {
  switch (relationType) {
    case OccupationToSkillRelationType.NONE:
      return OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE;
    case OccupationToSkillRelationType.ESSENTIAL:
      return OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL;
    case OccupationToSkillRelationType.OPTIONAL:
      return OccupationAPISpecs.Enums.OccupationToSkillRelationType.OPTIONAL;
    default:
      return OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE;
  }
}

function transformRequiredSkills(
  requiresSkills: IOccupation["requiresSkills"]
): OccupationAPISpecs.Types.Response.IOccupation["requiresSkills"] {
  return requiresSkills?.map((skillRef) => ({
    id: skillRef.id,
    UUID: skillRef.UUID,
    preferredLabel: skillRef.preferredLabel,
    isLocalized: skillRef.isLocalized,
    objectType: OccupationAPISpecs.Enums.Relations.RequiredSkills.ObjectTypes.Skill,
    relationType: transformSkillRelationType(skillRef.relationType),
    signallingValue: skillRef.signallingValue,
    signallingValueLabel: skillRef.signallingValueLabel,
  }));
}

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

// Paginated transformation for occupations
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
