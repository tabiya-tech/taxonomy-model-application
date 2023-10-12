import mongoose from "mongoose";

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

export type ReferenceWithModelId<T> = T & {
  modelId: string | mongoose.Types.ObjectId;
};

export type ReferenceWithRelationType<T> = ReferenceWithModelId<T> & {
  relationType: RelationType;
};

export type ImportIdentifiable = { importId: string };
