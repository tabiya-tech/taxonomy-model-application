import { ImportIdentifiable, ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { EntityEmbeddingStatus } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { ITranslatedStringArrayDoc, ITranslatedStringDoc } from "common/language/translatedString.types";
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

/**
 *  Describes how new occupations are created in the API
 */
export type INewOccupationSpec = Omit<
  IOccupation,
  "id" | "UUID" | "parent" | "children" | "requiresSkills" | "createdAt" | "updatedAt"
>;

/**
 * Describes how an OccupationGroup is created with the API without import action.
 */
export type INewOccupationSpecWithoutImportId = Omit<INewOccupationSpec, "importId">;

export interface IOccupationWithoutImportId extends Omit<IOccupation, "importId"> {
  importId: string | null;
}

/**
 * Describes the mutable fields for a full occupation replacement (PUT).
 * Excludes server-managed fields: id, UUID, importId, parent, children, requiresSkills, createdAt, updatedAt.
 */
export type IUpdateOccupationSpec = Pick<
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
 * Describes the mutable fields for a partial occupation update (PATCH).
 * All fields are optional.
 */
export type IPartialUpdateOccupationSpec = Partial<IUpdateOccupationSpec>;

/**
 * Like INewOccupationSpec but with translatable fields already expressed as localized Maps, for the
 * language-suffixed CSV import path.
 */
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
