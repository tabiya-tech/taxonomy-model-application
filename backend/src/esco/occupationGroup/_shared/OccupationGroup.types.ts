import mongoose from "mongoose";
import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import { EntityEmbeddingStatus } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { ITranslatedStringArrayDoc, ITranslatedStringDoc } from "common/language/translatedString.types";
import LanguageAPISpecs from "api-specifications/language";

/**
 * Describes how an OccupationGroup is saved in the database.
 * Translatable fields are typed as ITranslatedStringDoc/ITranslatedStringArrayDoc, the shape mongoose hydrates them
 * as, keyed by the languages of the registry.
 * code and groupType are monolingual and stay flat strings.
 */
export interface IOccupationGroupDoc extends ImportIdentifiable {
  modelId: mongoose.Types.ObjectId;
  UUID: string;
  UUIDHistory: string[];
  code: string;
  originUri: string;
  preferredLabel: ITranslatedStringDoc;
  altLabels: ITranslatedStringArrayDoc;
  importId: string;
  groupType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup;
  description: ITranslatedStringDoc;
  embeddingStatus?: Map<string, EntityEmbeddingStatus>;
}

/**
 * Describes how an OccupationGroup is returned from the API.
 * The embeddingStatus is internal bookkeeping of the embedding process and is not returned from the API.
 * Translatable fields are redeclared as flat strings, since the repository flattens them.
 */
export interface IOccupationGroup
  extends Omit<
    IOccupationGroupDoc,
    "id" | "modelId" | "UUIDHistory" | "embeddingStatus" | "preferredLabel" | "altLabels" | "description"
  > {
  id: string;
  UUID: string;
  preferredLabel: string;
  altLabels: string[];
  description: string;
  parent: IOccupationGroupReference | null;
  children: (IOccupationGroupReference | IOccupationReference)[];
  UUIDHistory: string[];
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Describes how an OccupationGroup child is returned from the API without importId.
 */
export interface IOccupationGroupChild
  extends Omit<IOccupationGroup, "importId" | "parent" | "children" | "groupType"> {
  parentId: string;
  objectType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup | ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
}

export interface IOccupationGroupWithoutImportId extends Omit<IOccupationGroup, "importId"> {
  importId: string | null;
}

// translatable fields of an OccupationGroup, stored as translated sub documents (e.g. { en: "Managers" }).
// code and groupType are monolingual and are deliberately absent from this list.
export const OCCUPATION_GROUP_TRANSLATABLE_STRING_FIELDS = [
  "preferredLabel",
  "description",
] as const satisfies ReadonlyArray<keyof IOccupationGroupDoc>;

type OccupationGroupTranslatableFields = "preferredLabel" | "altLabels" | "description";

// OccupationGroup for export: not populated, translatable fields kept in every language instead of flattened to fallback
export type IOccupationGroupWithTranslations = Omit<
  IOccupationGroup,
  OccupationGroupTranslatableFields | "parent" | "children"
> &
  Pick<IOccupationGroupDoc, OccupationGroupTranslatableFields>;

/**
 * Describes how a new OccupationGroup is created with the API.
 */
export type INewOccupationGroupSpec = Omit<
  IOccupationGroup,
  "id" | "UUID" | "parent" | "children" | "createdAt" | "updatedAt"
>;

export const OCCUPATION_GROUP_TRANSLATABLE_FIELDS = [
  ...OCCUPATION_GROUP_TRANSLATABLE_STRING_FIELDS,
  "altLabels",
] as const;

type ITranslatableFields = {
  preferredLabel: LanguageAPISpecs.Types.ITranslatedString;
  altLabels: LanguageAPISpecs.Types.ITranslatedStringArray;
  description: LanguageAPISpecs.Types.ITranslatedString;
};

/**
 * Describes how an OccupationGroup is created with the API without import action (POST).
 * Translatable fields are full multilingual objects.
 */
export type INewOccupationGroupSpecWithoutImportId = Omit<
  INewOccupationGroupSpec,
  "importId" | OccupationGroupTranslatableFields
> &
  ITranslatableFields;

type IUpdateOccupationGroupBaseFields = Pick<
  IOccupationGroup,
  "originUri" | "code" | "modelId" | "UUIDHistory" | "groupType"
>;

/**
 * Describes the mutable fields for a full OccupationGroup replacement (PUT).
 * Excludes server-managed fields: id, UUID, importId, parent, children, createdAt, updatedAt.
 * A language absent from a translatable field is removed from the stored occupation group.
 */
export type IUpdateOccupationGroupSpec = IUpdateOccupationGroupBaseFields & ITranslatableFields;

/**
 * Describes the mutable fields for a partial OccupationGroup update (PATCH). All fields are optional.
 * Within a present translatable field, a language is set, deleted (null) or left as-is (absent);
 * altLabels, when present, is replaced as a whole.
 */
export type IPartialUpdateOccupationGroupSpec = Partial<IUpdateOccupationGroupBaseFields> & {
  preferredLabel?: LanguageAPISpecs.Types.IPartialTranslatedString;
  altLabels?: LanguageAPISpecs.Types.ITranslatedStringArray;
  description?: LanguageAPISpecs.Types.IPartialTranslatedString;
};

/**
 * Like INewOccupationGroupSpec but with translatable fields already expressed as localized Maps, for the
 * language-suffixed CSV import path.
 */
export type INewOccupationGroupSpecLocalized = Omit<
  INewOccupationGroupSpec,
  "preferredLabel" | "altLabels" | "description"
> & {
  preferredLabel: ITranslatedStringDoc;
  altLabels: ITranslatedStringArrayDoc;
  description: ITranslatedStringDoc;
};

/**
 * Describes how a reference to an OccupationGroup is returned from the API.
 */
export interface IOccupationGroupReference extends Pick<IOccupationGroup, "id" | "UUID" | "code" | "preferredLabel"> {
  objectType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup;
}

/**
 * Describes how a reference to an OccupationGroup is populated within repository functions .
 * This is not returned from the API.
 */
export interface IOccupationGroupReferenceDoc extends Pick<IOccupationGroupDoc, "modelId" | "UUID" | "code"> {
  id: string;
  // flattened to the fall back language by getOccupationGroupDocReference, unlike the localized sub document it is
  // stored as
  preferredLabel: string;
  objectType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup;
}

/**
 * These are service level error codes for validating a model for occupation group operations
 */
export enum ModelForOccupationGroupValidationErrorCode {
  FAILED_TO_FETCH_FROM_DB,
  MODEL_NOT_FOUND_BY_ID,
  MODEL_IS_RELEASED,
}

/**
 * The result of validating a model for occupation group operations. On success, also carries the model's
 * availableLanguages so read endpoints can resolve the Accept-Language header against them.
 */
export type ValidateModelForOccupationGroupResult =
  | { errorCode: null; availableLanguages: string[] }
  | { errorCode: ModelForOccupationGroupValidationErrorCode; availableLanguages?: never };
/**
 * Base path parameters for occupation group routes
 */
export type BasePathParams = {
  modelId?: string;
};
