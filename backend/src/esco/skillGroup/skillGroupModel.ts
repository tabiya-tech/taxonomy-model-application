import mongoose from "mongoose";
import { RegEx_Skill_Group_Code, RegExp_UUIDv4 } from "server/regex";
import {
  AltLabelsProperty,
  DescriptionProperty,
  ESCOUriProperty,
  ImportIDProperty,
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
      ESCOUri: ESCOUriProperty,
      altLabels: AltLabelsProperty,
      description: DescriptionProperty,
      scopeNote: ScopeNoteProperty,
      importId: ImportIDProperty,
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

  // Two instances cannot have the same UUID
  SkillGroupSchema.index(INDEX_FOR_UUID, { unique: true });

  // Index used to improve queries performance
  SkillGroupSchema.index(INDEX_FOR_MODEL_ID);
  SkillGroupSchema.index(INDEX_FOR_UUIDHistory);

  return dbConnection.model<ISkillGroupDoc>(MongooseModelName.SkillGroup, SkillGroupSchema);
}

export const INDEX_FOR_MODEL_ID: mongoose.IndexDefinition = { modelId: 1 };
export const INDEX_FOR_UUID: mongoose.IndexDefinition = { UUID: 1 };
export const INDEX_FOR_UUIDHistory: mongoose.IndexDefinition = { UUIDHistory: 1 };
