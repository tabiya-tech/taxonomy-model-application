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

export type ReferenceWithModelId<T> = T & { modelId: string | mongoose.Types.ObjectId };

export type ImportIdentifiable = { importId: string };