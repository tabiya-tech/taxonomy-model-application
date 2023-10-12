import mongoose from "mongoose";
import { RegExp_UUIDv4 } from "server/regex";
import {
  AltLabelsProperty,
  DefinitionProperty,
  DescriptionProperty,
  ESCOUriProperty,
  ImportIDProperty,
  OriginUUIDProperty,
  PreferredLabelProperty,
  ScopeNoteProperty,
} from "esco/common/modelSchema";
import { stringRequired } from "server/stringRequired";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillDoc, ReuseLevel, SkillType } from "./skills.types";

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<ISkillDoc> {
  // Main Schema
  const SkillSchema = new mongoose.Schema<ISkillDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      preferredLabel: PreferredLabelProperty,
      skillType: {
        type: String,
        required: stringRequired("skillType"),
        enum: SkillType,
      },
      reuseLevel: {
        type: String,
        required: stringRequired("reuseLevel"),
        enum: ReuseLevel,
      },
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      originUUID: OriginUUIDProperty,
      ESCOUri: ESCOUriProperty,
      altLabels: AltLabelsProperty,
      definition: DefinitionProperty,
      description: DescriptionProperty,
      scopeNote: ScopeNoteProperty,
      importId: ImportIDProperty,
    },
    { timestamps: true, strict: "throw" }
  );
  SkillSchema.virtual("parents", {
    ref: MongooseModelName.SkillHierarchy,
    localField: "_id",
    foreignField: "childId",
    match: (skill: ISkillDoc) => ({ modelId: skill.modelId }),
  });
  SkillSchema.virtual("children", {
    ref: MongooseModelName.SkillHierarchy,
    localField: "_id",
    foreignField: "parentId",
    match: (skill: ISkillDoc) => ({ modelId: skill.modelId }),
  });
  SkillSchema.virtual("requiresSkills", {
    ref: MongooseModelName.SkillToSkillRelations,
    localField: "_id",
    foreignField: "requiringSkillId",
    match: (skill: ISkillDoc) => ({ modelId: skill.modelId }),
  });
  SkillSchema.virtual("requiredBySkills", {
    ref: MongooseModelName.SkillToSkillRelations,
    localField: "_id",
    foreignField: "requiredSkillId",
    match: (skill: ISkillDoc) => ({ modelId: skill.modelId }),
  });
  SkillSchema.index({ UUID: 1 }, { unique: true });
  SkillSchema.index({ modelId: 1 });

  // Model
  return dbConnection.model<ISkillDoc>(MongooseModelName.Skill, SkillSchema);
}
