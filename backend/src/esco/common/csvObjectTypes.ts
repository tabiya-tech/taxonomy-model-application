import { ObjectTypes, RelationType } from "esco/common/objectTypes";
import { ReuseLevel, SkillType } from "../skill/skills.types";

export const enum CSVObjectTypes {
  ISCOGroup = "iscogroup",
  ESCOOccupation = "escooccupation",
  LocalOccupation = "localoccupation",
  Skill = "skill",
  SkillGroup = "skillgroup",
}

export const getObjectTypeFromCSVObjectType = (type: string): ObjectTypes | null => {
  switch (type?.toLowerCase()) {
    case CSVObjectTypes.ISCOGroup:
      return ObjectTypes.ISCOGroup;
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

export const getCSVTypeFromObjectObjectType = (type: string): CSVObjectTypes | null => {
  switch (type) {
    case ObjectTypes.ISCOGroup:
      return CSVObjectTypes.ISCOGroup;
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
  Essential = "essential",
  Optional = "optional",
}

export const getRelationTypeFromCSVRelationType = (type: string): RelationType | null => {
  switch (type.toLowerCase()) {
    case CSVRelationType.Essential:
      return RelationType.ESSENTIAL;
    case CSVRelationType.Optional:
      return RelationType.OPTIONAL;
    default:
      return null;
  }
};

export const getCSVRelationTypeFromRelationType = (type: string): CSVRelationType | null => {
  switch (type) {
    case RelationType.ESSENTIAL:
      return CSVRelationType.Essential;
    case RelationType.OPTIONAL:
      return CSVRelationType.Optional;
    default:
      return null;
  }
};

export enum CSVReuseLevel {
  None = "",
  SectorSpecific = "sector-specific",
  OccupationSpecific = "occupation-specific",
  CrossSector = "cross-sector",
  Transversal = "transversal",
}

export const getCSVTypeFromReuseLevel = (type: string): CSVReuseLevel | null => {
  switch (type.toLowerCase()) {
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
  switch (type) {
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
  switch (type) {
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
  switch (type.toLowerCase()) {
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
