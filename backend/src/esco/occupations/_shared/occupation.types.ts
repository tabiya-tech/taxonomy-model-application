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

/**
 *  Describes how new occupations are created in the API
 */
export type INewOccupationSpec = Omit<
  IOccupation,
  "id" | "UUID" | "parent" | "children" | "requiresSkills" | "createdAt" | "updatedAt"
>;

/**
 * Describes how an OccupationGroup is created with the API without import action.
 * Translatable fields accept the full multilingual object (POST accepts every language in one call),
 * unlike INewOccupationSpec's flat strings used by the CSV import path.
 */
export type INewOccupationSpecWithoutImportId = Omit<
  INewOccupationSpec,
  "importId" | "preferredLabel" | "altLabels" | "description" | "definition" | "scopeNote" | "regulatedProfessionNote"
> & {
  preferredLabel: LanguageAPISpecs.Types.ITranslatedString;
  altLabels: LanguageAPISpecs.Types.ITranslatedStringArray;
  description: LanguageAPISpecs.Types.ITranslatedString;
  definition: LanguageAPISpecs.Types.ITranslatedString;
  scopeNote: LanguageAPISpecs.Types.ITranslatedString;
  regulatedProfessionNote: LanguageAPISpecs.Types.ITranslatedString;
};

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
  | "preferredLabel"
  | "originUri"
  | "altLabels"
  | "definition"
  | "description"
  | "regulatedProfessionNote"
  | "scopeNote"
  | "modelId"
  | "occupationType"
  | "UUIDHistory"
  | "isLocalized"
>;

/**
 * Describes the mutable fields for a full occupation replacement (PUT).
 * Excludes server-managed fields: id, UUID, importId, parent, children, requiresSkills, createdAt, updatedAt.
 * Translatable fields accept the full multilingual object: PUT replaces the whole localized value, so a
 * language absent from the object is removed from the stored occupation.
 */
export type IUpdateOccupationSpec = Omit<
  IUpdateOccupationBaseFields,
  "preferredLabel" | "altLabels" | "description" | "definition" | "scopeNote" | "regulatedProfessionNote"
> & {
  preferredLabel: LanguageAPISpecs.Types.ITranslatedString;
  altLabels: LanguageAPISpecs.Types.ITranslatedStringArray;
  description: LanguageAPISpecs.Types.ITranslatedString;
  definition: LanguageAPISpecs.Types.ITranslatedString;
  scopeNote: LanguageAPISpecs.Types.ITranslatedString;
  regulatedProfessionNote: LanguageAPISpecs.Types.ITranslatedString;
};

/**
 * Describes the mutable fields for a partial occupation update (PATCH).
 * All fields are optional. Kept flat-string and decoupled from IUpdateOccupationSpec (rather than
 * Partial<IUpdateOccupationSpec>) since PATCH has not been migrated to multilingual objects yet.
 */
export type IPartialUpdateOccupationSpec = Partial<IUpdateOccupationBaseFields>;
