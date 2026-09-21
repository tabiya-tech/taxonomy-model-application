import mongoose from "mongoose";
import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import { EntityEmbeddingStatus } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { ISkillGroupReference } from "esco/skillGroup/_shared/skillGroup.types";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import LanguageAPISpecs from "api-specifications/language";

/**
 * Enum for the different types of skills.
 */
export enum SkillType {
  None = "",
  SkillCompetence = "skill/competence",
  Knowledge = "knowledge",
  Language = "language",
  Attitude = "attitude",
}

/**
 * Enum for the different levels of reuse for skills.
 */
export enum ReuseLevel {
  None = "",
  SectorSpecific = "sector-specific",
  OccupationSpecific = "occupation-specific",
  CrossSector = "cross-sector",
  Transversal = "transversal",
}

/**
 * Describes how a skill is saved in the database.
 */
export interface ISkillDoc extends ImportIdentifiable {
  UUID: string;
  modelId: mongoose.Types.ObjectId;
  preferredLabel: string;
  UUIDHistory: string[];
  originUri: string;
  altLabels: string[];
  description: string;
  definition: string;
  scopeNote: string;
  skillType: SkillType;
  reuseLevel: ReuseLevel;
  isLocalized: boolean;
  embeddingStatus?: Map<string, EntityEmbeddingStatus>;
}

/**
 * The translatable fields of a skill, stored as localized sub documents (e.g. { en: "Cook" }).
 */
type SkillTranslatableFields = "preferredLabel" | "description" | "definition" | "scopeNote";

/**
 * How a skill is actually shaped in MongoDB, used only at the mongoose schema/document boundary. Everywhere else
 * (ISkillDoc, ISkill) the fields stay flat strings, resolved to the fallback language by the repository.
 */
export type ISkillLocalizedDoc = Omit<ISkillDoc, SkillTranslatableFields | "altLabels"> & {
  preferredLabel: LanguageAPISpecs.Types.ITranslatedString;
  description: LanguageAPISpecs.Types.ITranslatedString;
  definition: LanguageAPISpecs.Types.ITranslatedString;
  scopeNote: LanguageAPISpecs.Types.ITranslatedString;
  altLabels: LanguageAPISpecs.Types.ITranslatedStringArray;
};

/**
 * Describes how a skill is returned from the API.
 * The embeddingStatus is internal bookkeeping of the embedding process and is not returned from the API.
 */
export interface ISkill extends Omit<ISkillDoc, "modelId" | "embeddingStatus"> {
  id: string;
  modelId: string;
  parents: (ISkillReference | ISkillGroupReference)[];
  children: (ISkillReference | ISkillGroupReference)[];
  requiresSkills: SkillToSkillReferenceWithRelationType<ISkillReference>[];
  requiredBySkills: SkillToSkillReferenceWithRelationType<ISkillReference>[];
  createdAt: Date;
  updatedAt: Date;
  requiredByOccupations: OccupationToSkillReferenceWithRelationType<IOccupationReference>[];
}

/**
 * Describes how a new skill is created with the API.
 */
export type INewSkillSpec = Omit<
  ISkill,
  | "id"
  | "UUID"
  | "parents"
  | "children"
  | "requiresSkills"
  | "requiredBySkills"
  | "requiredByOccupations"
  | "createdAt"
  | "updatedAt"
>;

/**
 * Describes how a new skill is created with the API without importId.
 */
export type INewSkillSpecWithoutImportId = Omit<INewSkillSpec, "importId">;

/**
 * Describes how a reference to a skill is returned from the API
 */
export interface ISkillReference extends Pick<ISkill, "id" | "UUID" | "preferredLabel" | "isLocalized"> {
  objectType: ObjectTypes.Skill;
}

/**
 * Describes how a reference to a skill is populated within repository functions.
 * This is not returned from the API.
 */
export interface ISkillReferenceDoc extends Pick<ISkillDoc, "modelId" | "UUID" | "preferredLabel" | "isLocalized"> {
  id: string;
  objectType: ObjectTypes.Skill;
}

/**
 * Describes the mutable fields for a full skill replacement (PUT).
 * Excludes server-managed fields: id, UUID, importId, parents, children, requiresSkills, requiredBySkills, requiredByOccupations, createdAt, updatedAt.
 */
export type IUpdateSkillSpec = Pick<
  ISkill,
  | "preferredLabel"
  | "originUri"
  | "altLabels"
  | "definition"
  | "description"
  | "scopeNote"
  | "skillType"
  | "reuseLevel"
  | "modelId"
  | "UUIDHistory"
  | "isLocalized"
>;

/**
 * Describes the mutable fields for a partial skill update (PATCH).
 * All fields are optional.
 */
export type IPartialUpdateSkillSpec = Partial<IUpdateSkillSpec>;

/**
 * These are service level error codes for validating a model for skill operations
 */
export enum ModelForSkillValidationErrorCode {
  FAILED_TO_FETCH_FROM_DB = "FAILED_TO_FETCH_FROM_DB",
  MODEL_NOT_FOUND_BY_ID = "MODEL_NOT_FOUND_BY_ID",
  MODEL_IS_RELEASED = "MODEL_IS_RELEASED",
}
