/**
 * Enum for the different types of objects in the ESCO ontology.
 */
export enum ObjectTypes {
  OccupationGroup = "occupationgroup",
  ESCOOccupation = "escooccupation",
  LocalOccupation = "localoccupation",
  Skill = "skill",
  SkillGroup = "skillgroup",
}

export enum SignallingValueLabel {
  NONE = "",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export type ImportIdentifiable = { importId: string };
