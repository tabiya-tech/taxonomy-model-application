import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { ISkillReference } from "esco/skill/_shared/skill.types";
import { EntityEmbeddingStatus } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { ITranslatedStringArrayDoc, ITranslatedStringDoc } from "common/language/translatedString.types";
import LanguageAPISpecs from "api-specifications/language";

/**
 * Describes how a skill group is saved in the database.
 * Translatable fields are typed as ITranslatedStringDoc/ITranslatedStringArrayDoc, the shape mongoose hydrates them
 * as, keyed by the languages of the registry.
 * code is monolingual and stays a flat string.
 */
export interface ISkillGroupDoc extends ImportIdentifiable {
  modelId: mongoose.Types.ObjectId;
  UUID: string;
  UUIDHistory: string[];
  code: string;
  originUri: string;
  preferredLabel: ITranslatedStringDoc;
  altLabels: ITranslatedStringArrayDoc;
  description: ITranslatedStringDoc;
  scopeNote: ITranslatedStringDoc;
  embeddingStatus?: Map<string, EntityEmbeddingStatus>;
}

/**
 * Describes how a skill group is returned from the API.
 * The embeddingStatus is internal bookkeeping of the embedding process and is not returned from the API.
 * Translatable fields are redeclared as flat strings, since the repository flattens them.
 */
export interface ISkillGroup
  extends Omit<
    ISkillGroupDoc,
    "id" | "modelId" | "UUIDHistory" | "embeddingStatus" | "preferredLabel" | "altLabels" | "description" | "scopeNote"
  > {
  id: string;
  UUID: string;
  modelId: string;
  preferredLabel: string;
  altLabels: string[];
  description: string;
  scopeNote: string;
  parents: ISkillGroupReference[];
  UUIDHistory: string[];
  children: (ISkillGroupReference | ISkillReference)[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how a skill group child is returned from the API without importId.
 */
export interface ISkillGroupChild
  extends Omit<ISkillGroup, "importId" | "parents" | "scopeNote" | "children" | "code"> {
  parentId: string;
  objectType: ObjectTypes.SkillGroup | ObjectTypes.Skill;
  code?: string;
  isLocalized?: boolean;
}

export interface ISkillGroupWithoutImportId extends Omit<ISkillGroup, "importId"> {
  importId: string | null;
}

// translatable fields of a skill group, stored as translated sub documents (e.g. { en: "Managers" })
type SkillGroupTranslatableFields = "preferredLabel" | "altLabels" | "description" | "scopeNote";

// same as SkillGroupTranslatableFields, kept as a runtime value for the repository, which treats altLabels
// separately (it needs a Mongoose Map-array reset before being set, unlike the scalar fields)
export const SKILLGROUP_TRANSLATABLE_STRING_FIELDS = ["preferredLabel", "description", "scopeNote"] as const;

// same as SKILLGROUP_TRANSLATABLE_STRING_FIELDS, plus altLabels; used by the language validator, which does not
// need to special-case altLabels
export const SKILLGROUP_TRANSLATABLE_FIELDS = [...SKILLGROUP_TRANSLATABLE_STRING_FIELDS, "altLabels"] as const;

// SkillGroup for export: not populated, translatable fields kept in every language instead of flattened to fallback
export type ISkillGroupWithTranslations = Omit<ISkillGroup, SkillGroupTranslatableFields | "parents" | "children"> &
  Pick<ISkillGroupDoc, SkillGroupTranslatableFields>;

/**
 * Describes how a new skill group is created with the API.
 */
export type INewSkillGroupSpec = Omit<ISkillGroup, "id" | "UUID" | "parents" | "children" | "createdAt" | "updatedAt">;

type ITranslatableFields = {
  preferredLabel: LanguageAPISpecs.Types.ITranslatedString;
  altLabels: LanguageAPISpecs.Types.ITranslatedStringArray;
  description: LanguageAPISpecs.Types.ITranslatedString;
  scopeNote: LanguageAPISpecs.Types.ITranslatedString;
};

/**
 * Describes how an SkillGroup is created with the API without import action (POST).
 * Translatable fields accept the full multilingual object, unlike INewSkillGroupSpec's flat strings used by
 * the CSV import path.
 */
export type INewSkillGroupSpecWithoutImportId = Omit<INewSkillGroupSpec, "importId" | SkillGroupTranslatableFields> &
  ITranslatableFields;

// Same fields as ITranslatableFields, but each language may also be null to delete that translation.
type IPartialTranslatableFields = {
  preferredLabel?: LanguageAPISpecs.Types.IPartialTranslatedString;
  altLabels?: LanguageAPISpecs.Types.ITranslatedStringArray;
  description?: LanguageAPISpecs.Types.IPartialTranslatedString;
  scopeNote?: LanguageAPISpecs.Types.IPartialTranslatedString;
};

/**
 * The mutable fields shared by a full replacement (PUT) and a partial update (PATCH), before either
 * verb's own treatment of the translatable fields is applied.
 */
type IUpdateSkillGroupBaseFields = Pick<
  ISkillGroup,
  "originUri" | "code" | "modelId" | "UUIDHistory" | SkillGroupTranslatableFields
>;

/**
 * Describes the mutable fields for a full SkillGroup replacement (PUT).
 * Excludes server-managed fields: id, UUID, importId, parents, children, createdAt, updatedAt.
 * Translatable fields accept the full multilingual object: PUT replaces the whole localized value, so a
 * language absent from the object is removed from the stored skill group.
 */
export type IUpdateSkillGroupSpec = Omit<IUpdateSkillGroupBaseFields, SkillGroupTranslatableFields> &
  ITranslatableFields;

/**
 * Describes the mutable fields for a partial SkillGroup update (PATCH). All fields are optional and left
 * untouched when absent. Within a present translatable field, a language is set/overwritten, deleted (null),
 * or left as-is (absent). altLabels has no stable per-item identity to merge by, so when present it is
 * replaced wholesale, like POST/PUT, not merged per language.
 */
export type IPartialUpdateSkillGroupSpec = Omit<Partial<IUpdateSkillGroupBaseFields>, SkillGroupTranslatableFields> &
  IPartialTranslatableFields;

/**
 * Like INewSkillGroupSpec but with translatable fields already expressed as localized Maps, for the
 * language-suffixed CSV import path.
 */
export type INewSkillGroupSpecLocalized = Omit<
  INewSkillGroupSpec,
  "preferredLabel" | "altLabels" | "description" | "scopeNote"
> & {
  preferredLabel: ITranslatedStringDoc;
  altLabels: ITranslatedStringArrayDoc;
  description: ITranslatedStringDoc;
  scopeNote: ITranslatedStringDoc;
};

/**
 * Describes how a reference to a skill group is returned from the API
 */
export interface ISkillGroupReference extends Pick<ISkillGroup, "id" | "UUID" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.SkillGroup | ObjectTypes.Skill;
}

/**
 * Describes how a reference to a skill group is populated within repository functions .
 * This is not returned from the API.
 */
export interface ISkillGroupReferenceDoc extends Pick<ISkillGroupDoc, "modelId" | "UUID" | "code"> {
  id: string;
  // flattened to the fall back language by getSkillGroupDocReference, unlike the localized sub document it is
  // stored as
  preferredLabel: string;
  objectType: ObjectTypes.SkillGroup | ObjectTypes.Skill;
}

/**
 * These are service level error codes for validating a model for skill group operations
 */
export enum ModelForSkillGroupValidationErrorCode {
  FAILED_TO_FETCH_FROM_DB,
  MODEL_NOT_FOUND_BY_ID,
  MODEL_IS_RELEASED,
}

export type ValidateModelForSkillGroupResult =
  | { errorCode: null; availableLanguages: string[] }
  | { errorCode: ModelForSkillGroupValidationErrorCode; availableLanguages?: never };
/**
 * Base path parameters for skill group routes
 */
export type BasePathParams = {
  modelId?: string;
};
