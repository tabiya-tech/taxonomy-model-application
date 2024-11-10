import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { ReuseLevel, SkillType } from "esco/skill/skills.types";
import { SkillToSkillRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

export const enum CSVObjectTypes {
  ISCOGroup = "iscogroup",
  LocalGroup = "localgroup",
  ESCOOccupation = "escooccupation",
  LocalOccupation = "localoccupation",
  Skill = "skill",
  SkillGroup = "skillgroup",
}

export const getObjectTypeFromCSVObjectType = (type: string): ObjectTypes | null => {
  switch (type?.toLowerCase()) {
    case CSVObjectTypes.ISCOGroup:
      return ObjectTypes.ISCOGroup;
    case CSVObjectTypes.LocalGroup:
      return ObjectTypes.LocalGroup;
    case CSVObjectTypes.ESCOOccupation:
      return ObjectTypes.ESCOOccupation;
    case CSVObjectTypes.LocalOccupation:
      return ObjectTypes.LocalOccupation;
    case CSVObjectTypes.Skill:
      return ObjectTypes.Skill;
    case CSVObjectTypes.SkillGroup:
      return ObjectTypes.SkillGroup;
    default:
      return null;
  }
};

export const getCSVTypeFromObjectType = (type: string): CSVObjectTypes | null => {
  switch (type?.toLowerCase()) {
    case ObjectTypes.ISCOGroup:
      return CSVObjectTypes.ISCOGroup;
    case ObjectTypes.LocalGroup:
      return CSVObjectTypes.LocalGroup;
    case ObjectTypes.ESCOOccupation:
      return CSVObjectTypes.ESCOOccupation;
    case ObjectTypes.LocalOccupation:
      return CSVObjectTypes.LocalOccupation;
    case ObjectTypes.Skill:
      return CSVObjectTypes.Skill;
    case ObjectTypes.SkillGroup:
      return CSVObjectTypes.SkillGroup;
    default:
      return null;
  }
};

export enum CSVRelationType {
  None = "",
  Essential = "essential",
  Optional = "optional",
}

export enum CSVSignallingValueLabel {
  NONE = "",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export const getSkillToSkillRelationTypeFromCSVRelationType = (type: string): SkillToSkillRelationType | null => {
  switch (type?.toLowerCase()) {
    case CSVRelationType.Essential:
      return SkillToSkillRelationType.ESSENTIAL;
    case CSVRelationType.Optional:
      return SkillToSkillRelationType.OPTIONAL;
    default:
      return null;
  }
};

export const getOccupationToSkillRelationTypeFromCSVRelationType = (
  type: string
): OccupationToSkillRelationType | null => {
  switch (type?.toLowerCase()) {
    case CSVRelationType.None:
      return OccupationToSkillRelationType.NONE;
    case CSVRelationType.Essential:
      return OccupationToSkillRelationType.ESSENTIAL;
    case CSVRelationType.Optional:
      return OccupationToSkillRelationType.OPTIONAL;
    default:
      return null;
  }
};

export const getCSVRelationTypeFromSkillToSkillRelationType = (type: string): CSVRelationType | null => {
  switch (type?.toLowerCase()) {
    case SkillToSkillRelationType.ESSENTIAL:
      return CSVRelationType.Essential;
    case SkillToSkillRelationType.OPTIONAL:
      return CSVRelationType.Optional;
    default:
      return null;
  }
};

export const getCSVRelationTypeFromOccupationToSkillRelationType = (type: string): CSVRelationType | null => {
  switch (type?.toLowerCase()) {
    case OccupationToSkillRelationType.NONE:
      return CSVRelationType.None;
    case OccupationToSkillRelationType.ESSENTIAL:
      return CSVRelationType.Essential;
    case OccupationToSkillRelationType.OPTIONAL:
      return CSVRelationType.Optional;
    default:
      return null;
  }
};

export const getSignallingValueLabelFromCSVSignallingValueLabel = (value: string): SignallingValueLabel | null => {
  switch (value?.toLowerCase()) {
    case CSVSignallingValueLabel.HIGH:
      return SignallingValueLabel.HIGH;
    case CSVSignallingValueLabel.LOW:
      return SignallingValueLabel.LOW;
    case CSVSignallingValueLabel.MEDIUM:
      return SignallingValueLabel.MEDIUM;
    case CSVSignallingValueLabel.NONE:
      return SignallingValueLabel.NONE;
    default:
      return null;
  }
};

export const getCSVSignalingValueLabelFromSignallingValueLabel = (value?: string): CSVSignallingValueLabel | null => {
  switch (value?.toLowerCase()) {
    case SignallingValueLabel.HIGH:
      return CSVSignallingValueLabel.HIGH;
    case SignallingValueLabel.LOW:
      return CSVSignallingValueLabel.LOW;
    case SignallingValueLabel.MEDIUM:
      return CSVSignallingValueLabel.MEDIUM;
    case SignallingValueLabel.NONE:
      return CSVSignallingValueLabel.NONE;
    default:
      return null;
  }
};

export const getSignallingValueFromCSVSignallingValue = (value: string): number | null => {
  if (!value) return null;
  return Number(value);
};

export const getCSVSignalingValueFromSignallingValue = (value?: number): string => {
  if (value === undefined || value === null) return "";
  return value.toString();
};

export enum CSVReuseLevel {
  None = "",
  SectorSpecific = "sector-specific",
  OccupationSpecific = "occupation-specific",
  CrossSector = "cross-sector",
  Transversal = "transversal",
}

export const getCSVTypeFromReuseLevel = (type: string): CSVReuseLevel | null => {
  switch (type?.toLowerCase()) {
    case ReuseLevel.SectorSpecific:
      return CSVReuseLevel.SectorSpecific;
    case ReuseLevel.OccupationSpecific:
      return CSVReuseLevel.OccupationSpecific;
    case ReuseLevel.CrossSector:
      return CSVReuseLevel.CrossSector;
    case ReuseLevel.Transversal:
      return CSVReuseLevel.Transversal;
    case ReuseLevel.None:
      return CSVReuseLevel.None;
    default:
      return null;
  }
};

export const getReuseLevelFromCSVReuseLevel = (type: string): ReuseLevel | null => {
  switch (type?.toLowerCase()) {
    case CSVReuseLevel.SectorSpecific:
      return ReuseLevel.SectorSpecific;
    case CSVReuseLevel.OccupationSpecific:
      return ReuseLevel.OccupationSpecific;
    case CSVReuseLevel.CrossSector:
      return ReuseLevel.CrossSector;
    case CSVReuseLevel.Transversal:
      return ReuseLevel.Transversal;
    case CSVReuseLevel.None:
      return ReuseLevel.None;
    default:
      return null;
  }
};

export enum CSVSkillType {
  None = "",
  SkillCompetence = "skill/competence",
  Knowledge = "knowledge",
  Language = "language",
  Attitude = "attitude",
}

export const getCSVTypeFromSkillType = (type: string): CSVSkillType | null => {
  switch (type?.toLowerCase()) {
    case SkillType.SkillCompetence:
      return CSVSkillType.SkillCompetence;
    case SkillType.Knowledge:
      return CSVSkillType.Knowledge;
    case SkillType.Language:
      return CSVSkillType.Language;
    case SkillType.Attitude:
      return CSVSkillType.Attitude;
    case SkillType.None:
      return CSVSkillType.None;
    default:
      return null;
  }
};

export const getSkillTypeFromCSVSkillType = (type: string): SkillType | null => {
  switch (type?.toLowerCase()) {
    case CSVSkillType.SkillCompetence:
      return SkillType.SkillCompetence;
    case CSVSkillType.Knowledge:
      return SkillType.Knowledge;
    case CSVSkillType.Language:
      return SkillType.Language;
    case CSVSkillType.Attitude:
      return SkillType.Attitude;
    case CSVSkillType.None:
      return SkillType.None;
    default:
      return null;
  }
};
