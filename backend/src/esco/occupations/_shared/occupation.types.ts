import { ImportIdentifiable, ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { EntityEmbeddingStatus } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { ITranslatedStringArrayDoc, ITranslatedStringDoc } from "common/language/translatedString.types";
import LanguageAPISpecs from "api-specifications/language";
import { IOccupationGroupReference } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { ISkill, ISkillReference } from "esco/skill/_shared/skill.types";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import {
  OccupationToSkillReferenceWithRelationType,
  OccupationToSkillRelationType,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

/**
 * Describes a skill with its relationship metadata to an occupation.
 */
export interface ISkillWithRelation extends ISkill {
  relationType: OccupationToSkillRelationType;
  signallingValue: number | null;
  signallingValueLabel: SignallingValueLabel;
}

/**
 * Describes an occupation with its relationship metadata to a skill.
 */
export interface IOccupationWithRelation extends IOccupation {
  relationType: OccupationToSkillRelationType;
  signallingValue: number | null;
  signallingValueLabel: SignallingValueLabel;
}

/**
 * Describes how an occupation is saved in MongoDB.
 * Translatable fields are typed as ITranslatedStringDoc/ITranslatedStringArrayDoc, the shape mongoose hydrates them
 * as, keyed by the languages of the registry.
 */
export interface IOccupationDoc extends ImportIdentifiable {
  UUID: string;
  modelId: mongoose.Types.ObjectId;
  preferredLabel: ITranslatedStringDoc;
  UUIDHistory: string[];
  originUri: string;
  occupationGroupCode: string;
  code: string;
  altLabels: ITranslatedStringArrayDoc;
  description: ITranslatedStringDoc;
  definition: ITranslatedStringDoc;
  scopeNote: ITranslatedStringDoc;
  regulatedProfessionNote: ITranslatedStringDoc;
  occupationType: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
  isLocalized: boolean;
  importId: string;
  embeddingStatus?: Map<string, EntityEmbeddingStatus>;
}

/**
 * Describes how occupations are return from the API
 * The embeddingStatus is internal bookkeeping of the embedding process and is not returned from the API.
 * Translatable fields are redeclared as flat strings, since the repository flattens them.
 */
export interface IOccupation
  extends Omit<
    IOccupationDoc,
    | "modelId"
    | "embeddingStatus"
    | "preferredLabel"
    | "altLabels"
    | "description"
    | "definition"
    | "scopeNote"
    | "regulatedProfessionNote"
  > {
  id: string;
  modelId: string;
  preferredLabel: string;
  altLabels: string[];
  description: string;
  definition: string;
  scopeNote: string;
  regulatedProfessionNote: string;
  parent: IOccupationGroupReference | IOccupationReference | null;
  children: (IOccupationGroupReference | IOccupationReference)[];
  createdAt: Date;
  updatedAt: Date;
  requiresSkills: OccupationToSkillReferenceWithRelationType<ISkillReference>[];
}

// translatable fields of an occupation, stored as translated sub documents (e.g. { en: "Cook" })
type OccupationTranslatableFields =
  | "preferredLabel"
  | "altLabels"
  | "description"
  | "definition"
  | "scopeNote"
  | "regulatedProfessionNote";

// Occupation for export: not populated, translatable fields kept in every language instead of flattened to fallback
export type IOccupationWithTranslations = Omit<
  IOccupation,
  OccupationTranslatableFields | "parent" | "children" | "requiresSkills"
> &
  Pick<IOccupationDoc, OccupationTranslatableFields>;

type TranslatableFieldName =
  | "preferredLabel"
  | "altLabels"
  | "description"
  | "definition"
  | "scopeNote"
  | "regulatedProfessionNote";

type ITranslatableFields = {
  preferredLabel: LanguageAPISpecs.Types.ITranslatedString;
  altLabels: LanguageAPISpecs.Types.ITranslatedStringArray;
  description: LanguageAPISpecs.Types.ITranslatedString;
  definition: LanguageAPISpecs.Types.ITranslatedString;
  scopeNote: LanguageAPISpecs.Types.ITranslatedString;
  regulatedProfessionNote: LanguageAPISpecs.Types.ITranslatedString;
};

// Same fields as ITranslatableFields, but each language may also be null to delete that translation.
type IPartialTranslatableFields = {
  preferredLabel?: LanguageAPISpecs.Types.IPartialTranslatedString;
  altLabels?: LanguageAPISpecs.Types.ITranslatedStringArray;
  description?: LanguageAPISpecs.Types.IPartialTranslatedString;
  definition?: LanguageAPISpecs.Types.IPartialTranslatedString;
  scopeNote?: LanguageAPISpecs.Types.IPartialTranslatedString;
  regulatedProfessionNote?: LanguageAPISpecs.Types.IPartialTranslatedString;
};

/**
 *  Describes how new occupations are created in the API
 */
export type INewOccupationSpec = Omit<
  IOccupation,
  "id" | "UUID" | "parent" | "children" | "requiresSkills" | "createdAt" | "updatedAt"
>;

/**
 * Describes how an occupation is created with the API without import action (POST).
 * Translatable fields accept the full multilingual object, unlike INewOccupationSpec's flat strings used by
 * the CSV import path.
 */
export type INewOccupationSpecWithoutImportId = Omit<INewOccupationSpec, "importId" | TranslatableFieldName> &
  ITranslatableFields;

export interface IOccupationWithoutImportId extends Omit<IOccupation, "importId"> {
  importId: string | null;
}

/**
 * The mutable fields shared by a full replacement (PUT) and a partial update (PATCH), before either
 * verb's own treatment of the translatable fields is applied.
 */
type IUpdateOccupationBaseFields = Pick<
  IOccupation,
  | "code"
  | "occupationGroupCode"
  | "originUri"
  | "modelId"
  | "occupationType"
  | "UUIDHistory"
  | "isLocalized"
  | TranslatableFieldName
>;

/**
 * Describes the mutable fields for a full occupation replacement (PUT).
 * Excludes server-managed fields: id, UUID, importId, parent, children, requiresSkills, createdAt, updatedAt.
 * Translatable fields accept the full multilingual object: PUT replaces the whole localized value, so a
 * language absent from the object is removed from the stored occupation.
 */
export type IUpdateOccupationSpec = Omit<IUpdateOccupationBaseFields, TranslatableFieldName> & ITranslatableFields;

/**
 * Describes the mutable fields for a partial occupation update (PATCH). All fields are optional and left
 * untouched when absent. Within a present translatable field, a language is set/overwritten, deleted (null),
 * or left as-is (absent). altLabels has no stable per-item identity to merge by, so when present it is
 * replaced wholesale, like POST/PUT, not merged per language.
 */
export type IPartialUpdateOccupationSpec = Omit<Partial<IUpdateOccupationBaseFields>, TranslatableFieldName> &
  IPartialTranslatableFields;

/**
 * Like INewOccupationSpec but with translatable fields already expressed as localized Maps, for the
 * language-suffixed CSV import path.
 */
// The translatable string fields of an occupation (excludes altLabels, which is an array).
export const OCCUPATION_TRANSLATABLE_STRING_FIELDS = [
  "preferredLabel",
  "description",
  "definition",
  "scopeNote",
  "regulatedProfessionNote",
] as const satisfies ReadonlyArray<keyof IOccupationDoc>;

export const OCCUPATION_TRANSLATABLE_FIELDS = [...OCCUPATION_TRANSLATABLE_STRING_FIELDS, "altLabels"] as const;

export type INewOccupationSpecLocalized = Omit<
  INewOccupationSpec,
  "preferredLabel" | "altLabels" | "description" | "definition" | "scopeNote" | "regulatedProfessionNote"
> & {
  preferredLabel: ITranslatedStringDoc;
  altLabels: ITranslatedStringArrayDoc;
  description: ITranslatedStringDoc;
  definition: ITranslatedStringDoc;
  scopeNote: ITranslatedStringDoc;
  regulatedProfessionNote: ITranslatedStringDoc;
};
