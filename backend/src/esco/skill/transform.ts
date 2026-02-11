import { ISkill, ISkillReference } from "./skills.types";
import SkillAPISpecs from "api-specifications/esco/skill";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { Routes } from "routes.constant";
import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillGroup, ISkillGroupReference } from "esco/skillGroup/skillGroup.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { transform as transformSkillGroup } from "esco/skillGroup/transform";

function mapSkillType(skillType: string): SkillAPISpecs.Enums.SkillType {
  switch (skillType) {
    case "skill/competence":
      return SkillAPISpecs.Enums.SkillType.SkillCompetence;
    case "knowledge":
      return SkillAPISpecs.Enums.SkillType.Knowledge;
    case "language":
      return SkillAPISpecs.Enums.SkillType.Language;
    case "attitude":
      return SkillAPISpecs.Enums.SkillType.Attitude;
    default:
      return SkillAPISpecs.Enums.SkillType.None;
  }
}

function mapReuseLevel(reuseLevel: string): SkillAPISpecs.Enums.ReuseLevel {
  switch (reuseLevel) {
    case "sector-specific":
      return SkillAPISpecs.Enums.ReuseLevel.SectorSpecific;
    case "occupation-specific":
      return SkillAPISpecs.Enums.ReuseLevel.OccupationSpecific;
    case "cross-sector":
      return SkillAPISpecs.Enums.ReuseLevel.CrossSector;
    case "transversal":
      return SkillAPISpecs.Enums.ReuseLevel.Transversal;
    default:
      return SkillAPISpecs.Enums.ReuseLevel.None;
  }
}

function mapParent(parent: ISkillReference | ISkillGroupReference): SkillAPISpecs.Types.Response.ISkill["parent"] {
  if (!parent) return null;

  const objectType =
    parent.objectType === ObjectTypes.SkillGroup
      ? SkillAPISpecs.Enums.Relations.Parents.ObjectTypes.SkillGroup
      : SkillAPISpecs.Enums.Relations.Parents.ObjectTypes.Skill;

  return {
    id: parent.id,
    UUID: parent.UUID,
    preferredLabel: parent.preferredLabel,
    objectType,
    ...("code" in parent && parent.code && { code: parent.code }),
  };
}

function mapChild(child: ISkillReference | ISkillGroupReference): SkillAPISpecs.Types.Response.ISkill["children"][0] {
  return {
    id: child.id,
    UUID: child.UUID,
    preferredLabel: child.preferredLabel,
    objectType: SkillAPISpecs.Enums.Relations.Children.ObjectTypes.Skill,
    ...("isLocalized" in child && child.isLocalized !== undefined && { isLocalized: child.isLocalized }),
  };
}

function mapSkillToSkillRelationType(relationType: string): SkillAPISpecs.Enums.SkillToSkillRelationType {
  switch (relationType) {
    case "essential":
      return SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL;
    case "optional":
      return SkillAPISpecs.Enums.SkillToSkillRelationType.OPTIONAL;
    default:
      return SkillAPISpecs.Enums.SkillToSkillRelationType.ESSENTIAL;
  }
}

function mapRequiresSkill(
  skill: SkillToSkillReferenceWithRelationType<ISkillReference>
): SkillAPISpecs.Types.Response.ISkill["requiresSkills"][0] {
  return {
    id: skill.id,
    UUID: skill.UUID,
    preferredLabel: skill.preferredLabel,
    isLocalized: skill.isLocalized,
    objectType: SkillAPISpecs.Enums.ObjectTypes.Skill,
    relationType: mapSkillToSkillRelationType(skill.relationType),
  };
}

function mapRequiredBySkill(
  skill: SkillToSkillReferenceWithRelationType<ISkillReference>
): SkillAPISpecs.Types.Response.ISkill["requiredBySkills"][0] {
  return {
    id: skill.id,
    UUID: skill.UUID,
    preferredLabel: skill.preferredLabel,
    isLocalized: skill.isLocalized,
    objectType: SkillAPISpecs.Enums.ObjectTypes.Skill,
    relationType: mapSkillToSkillRelationType(skill.relationType),
  };
}

function mapOccupationToSkillRelationType(
  relationType: string
): SkillAPISpecs.Enums.OccupationToSkillRelationType | null {
  switch (relationType) {
    case "essential":
      return SkillAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL;
    case "optional":
      return SkillAPISpecs.Enums.OccupationToSkillRelationType.OPTIONAL;
    default:
      return null;
  }
}

function mapSignallingValueLabel(label: string): SkillAPISpecs.Enums.SignallingValueLabel | null {
  switch (label) {
    case "low":
      return SkillAPISpecs.Enums.SignallingValueLabel.LOW;
    case "medium":
      return SkillAPISpecs.Enums.SignallingValueLabel.MEDIUM;
    case "high":
      return SkillAPISpecs.Enums.SignallingValueLabel.HIGH;
    default:
      return null;
  }
}

function mapOccupationObjectType(
  objectType: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation
): SkillAPISpecs.Enums.OccupationObjectTypes {
  switch (objectType) {
    case ObjectTypes.ESCOOccupation:
      return SkillAPISpecs.Enums.OccupationObjectTypes.ESCOOccupation;
    case ObjectTypes.LocalOccupation:
      return SkillAPISpecs.Enums.OccupationObjectTypes.LocalOccupation;
    default:
      return SkillAPISpecs.Enums.OccupationObjectTypes.ESCOOccupation;
  }
}

function mapRequiredByOccupation(
  occupation: OccupationToSkillReferenceWithRelationType<IOccupationReference>
): SkillAPISpecs.Types.Response.ISkill["requiredByOccupations"][0] {
  return {
    id: occupation.id,
    UUID: occupation.UUID,
    preferredLabel: occupation.preferredLabel,
    isLocalized: occupation.isLocalized,
    objectType: mapOccupationObjectType(occupation.occupationType),
    relationType: mapOccupationToSkillRelationType(occupation.relationType),
    signallingValue: occupation.signallingValue,
    signallingValueLabel: mapSignallingValueLabel(occupation.signallingValueLabel),
  };
}

export function transform(data: ISkill, baseURL: string): SkillAPISpecs.Types.Response.ISkill {
  return {
    id: data.id,
    UUID: data.UUID,
    UUIDHistory: data.UUIDHistory,
    originUUID: data.UUIDHistory?.at(-1) || "",
    preferredLabel: data.preferredLabel,
    originUri: data.originUri,
    altLabels: data.altLabels,
    definition: data.definition,
    description: data.description,
    scopeNote: data.scopeNote,
    skillType: mapSkillType(data.skillType),
    reuseLevel: mapReuseLevel(data.reuseLevel),
    isLocalized: data.isLocalized,
    modelId: data.modelId,
    path: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/skills/${data.id}`,
    tabiyaPath: `${baseURL}${Routes.MODELS_ROUTE}/${data.modelId}/skills/${data.UUID}`,
    parent: data.parents.length > 0 ? mapParent(data.parents[0]) : null,
    children: data.children.map(mapChild),
    requiresSkills: data.requiresSkills.map(mapRequiresSkill),
    requiredBySkills: data.requiredBySkills.map(mapRequiredBySkill),
    requiredByOccupations: data.requiredByOccupations.map(mapRequiredByOccupation),
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  };
}

export function transformPaginated(
  data: ISkill[],
  baseURL: string,
  limit: number,
  cursor: string | null
): SkillAPISpecs.Types.GET.Response.Payload {
  return {
    data: data.map((item) => transform(item, baseURL)),
    limit,
    nextCursor: cursor,
  };
}

/**
 * Transforms a dynamic entity (Skill or SkillGroup) into its FULL response representation.
 * Used for relation endpoints (/parents, /children) that return full objects.
 */
export function transformDynamicEntity(
  data: ISkill | ISkillGroup,
  baseURL: string
): SkillAPISpecs.Types.Response.ISkill | SkillGroupAPISpecs.Types.Response.ISkillGroup {
  if ("skillType" in data) {
    return transform(data as ISkill, baseURL);
  } else {
    return transformSkillGroup(data as ISkillGroup, baseURL);
  }
}

/**
 * Paginated transformation for relation endpoints that return mixed types (Skill/SkillGroup).
 */
export function transformPaginatedRelation(
  data: (ISkill | ISkillGroup)[],
  baseURL: string,
  limit: number,
  cursor: string | null
): {
  data: (SkillAPISpecs.Types.Response.ISkill | SkillGroupAPISpecs.Types.Response.ISkillGroup)[];
  limit: number;
  nextCursor: string | null;
} {
  return {
    data: data.map((item) => transformDynamicEntity(item, baseURL)),
    limit,
    nextCursor: cursor,
  };
}

export function transformSkillOccupation(
  occupationData: OccupationToSkillReferenceWithRelationType<IOccupationReference>
): SkillAPISpecs.Types.GET.Occupations.Response.Payload["data"][0] {
  return {
    id: occupationData.id,
    UUID: occupationData.UUID,
    code: occupationData.code,
    preferredLabel: occupationData.preferredLabel,
    occupationType: mapOccupationObjectType(occupationData.occupationType),
    relationType: mapOccupationToSkillRelationType(occupationData.relationType),
    signallingValue: occupationData.signallingValue,
    signallingValueLabel: mapSignallingValueLabel(occupationData.signallingValueLabel),
  };
}

export function transformPaginatedOccupations(
  data: OccupationToSkillReferenceWithRelationType<IOccupationReference>[],
  limit: number,
  cursor: string | null
): SkillAPISpecs.Types.GET.Occupations.Response.Payload {
  return {
    data: data.map((item) => transformSkillOccupation(item)),
    limit,
    nextCursor: cursor,
  };
}

export function transformSkillRelated(
  skillData: SkillToSkillReferenceWithRelationType<ISkillReference>
): SkillAPISpecs.Types.GET.Related.Response.Payload["data"][0] {
  const fullSkill = skillData as unknown as ISkill;
  return {
    id: skillData.id,
    UUID: skillData.UUID,
    preferredLabel: skillData.preferredLabel,
    skillType: mapSkillType(fullSkill.skillType),
    reuseLevel: mapReuseLevel(fullSkill.reuseLevel),
    isLocalized: skillData.isLocalized,
    relationType: mapSkillToSkillRelationType(skillData.relationType),
  };
}

export function transformPaginatedRelated(
  data: SkillToSkillReferenceWithRelationType<ISkillReference>[],
  limit: number,
  cursor: string | null
): SkillAPISpecs.Types.GET.Related.Response.Payload {
  return {
    data: data.map((item) => transformSkillRelated(item)),
    limit,
    nextCursor: cursor,
  };
}
