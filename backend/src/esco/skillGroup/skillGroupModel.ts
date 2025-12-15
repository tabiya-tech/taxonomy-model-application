import mongoose from "mongoose";
import { RegEx_Skill_Group_Code, RegExp_UUIDv4 } from "server/regex";
import {
  AltLabelsProperty,
  DescriptionProperty,
  OriginUriProperty,
  UUIDHistoryProperty,
  PreferredLabelProperty,
  ScopeNoteProperty,
} from "esco/common/modelSchema";
import { ISkillGroupDoc } from "./skillGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { stringRequired } from "server/stringRequired";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { SkillHierarchyModelPaths } from "esco/skillHierarchy/skillHierarchyModel";
import { ObjectTypes } from "esco/common/objectTypes";

export const SkillGroupModelPaths = {
  parents: "parents",
  children: "children",
};
export const IMPORT_ID_MAX_LENGTH = 256;

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<ISkillGroupDoc> {
  // Main Schema
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
      preferredLabel: PreferredLabelProperty,
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      UUIDHistory: UUIDHistoryProperty,
      originUri: OriginUriProperty,
      altLabels: AltLabelsProperty,
      description: DescriptionProperty,
      scopeNote: ScopeNoteProperty,
      importId: {
        type: String,
        required: false,
        maxlength: [IMPORT_ID_MAX_LENGTH, `importId must be at most 256 chars long`],
      },
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(),
      toJSON: getGlobalTransformOptions(),
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
