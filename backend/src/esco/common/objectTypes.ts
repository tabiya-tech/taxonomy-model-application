/**
 * Enum for the different types of objects in the ESCO ontology.
 */
export enum ObjectTypes {
  ISCOGroup = "iscogroup",
  ESCOOccupation = "escooccupation",
  LocalOccupation = "localoccupation",
  Skill = "skill",
  SkillGroup = "skillgroup",
}

/**
 * Enum for the two different types of relations in the ESCO ontology, essential and optional
 */
export enum RelationType {
  ESSENTIAL = "essential",
  OPTIONAL = "optional",
  NONE = "",
}

export enum SignallingValue {
  NONE = "",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export type ImportIdentifiable = { importId: string };
