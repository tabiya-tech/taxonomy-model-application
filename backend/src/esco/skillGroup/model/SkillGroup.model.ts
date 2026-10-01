import mongoose from "mongoose";
import { RegEx_Skill_Group_Code, RegExp_UUIDv4 } from "server/regex";
import {
  TranslatedAltLabelsProperty,
  TranslatedDescriptionProperty,
  OriginUriProperty,
  UUIDHistoryProperty,
  TranslatedPreferredLabelProperty,
  TranslatedScopeNoteProperty,
  EmbeddingStatusProperty,
} from "esco/common/modelSchema";
import { ISkillGroupDoc } from "../_shared/skillGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { stringRequired } from "server/stringRequired";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { SkillHierarchyModelPaths } from "esco/skillHierarchy/skillHierarchyModel";
import { ObjectTypes } from "esco/common/objectTypes";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { readLanguageValuesWithFallback, readLanguageValueWithFallback } from "common/language/translatedFields";

export const SkillGroupModelPaths = {
  parents: "parents",
  children: "children",
};
export const IMPORT_ID_MAX_LENGTH = 256;

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<ISkillGroupDoc> {
  const SkillGroupSchema = new mongoose.Schema<ISkillGroupDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      code: {
        type: String,
        required: stringRequired("code"),
        validate: {
          validator: function (value: string): boolean {
            return value === "" || RegEx_Skill_Group_Code.test(value);
          },
          message: (props) => `${props.value} is not a valid code.`,
        },
      },
      preferredLabel: TranslatedPreferredLabelProperty,
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      UUIDHistory: UUIDHistoryProperty,
      originUri: OriginUriProperty,
      altLabels: TranslatedAltLabelsProperty,
      description: TranslatedDescriptionProperty,
      scopeNote: TranslatedScopeNoteProperty,
      importId: {
        type: String,
        required: false,
        maxlength: [IMPORT_ID_MAX_LENGTH, `importId must be at most 256 chars long`],
      },
      embeddingStatus: EmbeddingStatusProperty,
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(_TransformFn),
      toJSON: getGlobalTransformOptions(_TransformFn),
    }
  );

  SkillGroupSchema.virtual(SkillGroupModelPaths.parents, {
    ref: MongooseModelName.SkillHierarchy,
    localField: "_id",
    foreignField: SkillHierarchyModelPaths.childId,
    match: (skillGroup: ISkillGroupDoc) => ({
      modelId: { $eq: skillGroup.modelId },
      childType: { $eq: ObjectTypes.SkillGroup },
    }),
  });

  SkillGroupSchema.virtual(SkillGroupModelPaths.children, {
    ref: MongooseModelName.SkillHierarchy,
    localField: "_id",
    foreignField: SkillHierarchyModelPaths.parentId,
    match: (skillGroup: ISkillGroupDoc) => ({
      modelId: { $eq: skillGroup.modelId },
      parentType: { $eq: ObjectTypes.SkillGroup },
    }),
  });

  SkillGroupSchema.index({ UUID: 1 }, { unique: true });
  SkillGroupSchema.index({ modelId: 1 });
  SkillGroupSchema.index({ UUIDHistory: 1 });

  return dbConnection.model<ISkillGroupDoc>(MongooseModelName.SkillGroup, SkillGroupSchema);
}

/**
 * The toObject() options that flatten the translatable fields to the given language, e.g.
 * doc.toObject(toObjectInLanguage("fr")). Without a language, they are flattened to the fall back language.
 */
export function toObjectInLanguage(language?: string): mongoose.ToObjectOptions {
  return { language } as mongoose.ToObjectOptions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (_doc: any, ret: any, options: any) => {
  // every field falls back on its own to the fall back language when it is not translated in the language
  const language: string = options?.language ?? getFallbackLanguageConfig().dbKeyName;
  ret.preferredLabel = readLanguageValueWithFallback(ret.preferredLabel, language);
  ret.description = readLanguageValueWithFallback(ret.description, language);
  ret.scopeNote = readLanguageValueWithFallback(ret.scopeNote, language);
  ret.altLabels = readLanguageValuesWithFallback(ret.altLabels, language);
  return ret;
};
