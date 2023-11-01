import mongoose from "mongoose";
import { RegEx_Skill_Group_Code, RegExp_UUIDv4 } from "server/regex";
import {
  AltLabelsProperty,
  DescriptionProperty,
  ESCOUriProperty,
  ImportIDProperty,
  OriginUUIDProperty,
  PreferredLabelProperty,
  ScopeNoteProperty,
} from "esco/common/modelSchema";
import { ISkillGroupDoc } from "./skillGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { stringRequired } from "server/stringRequired";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";

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
      originUUID: OriginUUIDProperty,
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

  SkillGroupSchema.virtual("parents", {
    ref: "SkillHierarchyModel",
    localField: "_id",
    foreignField: "childId",
    match: (skillGroup: ISkillGroupDoc) => ({ modelId: skillGroup.modelId }),
  });

  SkillGroupSchema.virtual("children", {
    ref: "SkillHierarchyModel",
    localField: "_id",
    foreignField: "parentId",
    match: (skillGroup: ISkillGroupDoc) => ({ modelId: skillGroup.modelId }),
  });

  SkillGroupSchema.index({ UUID: 1 }, { unique: true });

  SkillGroupSchema.index({ modelId: 1 });

  return dbConnection.model<ISkillGroupDoc>(MongooseModelName.SkillGroup, SkillGroupSchema);
}
