/**
 * Enum for the different types of objects in the ESCO ontology.
 */
export enum ObjectTypes {
  ISCOGroup = "ISCOGroup",
  Occupation = "Occupation",
  Skill = "Skill",
  SkillGroup = "SkillGroup",
}

/**
 * Enum for the two different types of relations in the ESCO ontology, essential and optional
 */
export enum RelationType {
  ESSENTIAL = "essential",
  OPTIONAL = "optional",
}

/**
 * Describes the three Types of Occupations
 */

export enum OccupationType {
  ESCO = "ESCO",
  LOCAL = "LOCAL",
  LOCALIZED = "LOCALIZED",
}

export type ReferenceWithRelationType<T> = T & {
  relationType: RelationType;
};

export type ImportIdentifiable = { importId: string };
