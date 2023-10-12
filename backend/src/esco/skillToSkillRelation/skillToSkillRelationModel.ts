import mongoose from "mongoose";
import { ISkillToSkillRelationPairDoc } from "./skillToSkillRelation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { RelationType } from "esco/common/objectTypes";

export function initializeSchemaAndModel(
  dbConnection: mongoose.Connection
): mongoose.Model<ISkillToSkillRelationPairDoc> {
  const SkillToSkillRelationSchema: mongoose.Schema<ISkillToSkillRelationPairDoc> =
    new mongoose.Schema<ISkillToSkillRelationPairDoc>(
      {
        modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
        requiringSkillId: { type: mongoose.Schema.Types.ObjectId, refPath: "requiringSkillDocModel", required: true },
        requiredSkillId: { type: mongoose.Schema.Types.ObjectId, refPath: "requiredSkillDocModel", required: true },
        requiringSkillDocModel: { type: String, required: true, enum: [MongooseModelName.Skill] },
        requiredSkillDocModel: { type: String, required: true, enum: [MongooseModelName.Skill] },
        relationType: { type: String, required: true, enum: RelationType },
      },
      { timestamps: true, strict: "throw" }
    );
  SkillToSkillRelationSchema.index({ modelId: 1, requiringSkillId: 1, requiredSkillId: 1 }, { unique: true });

  return dbConnection.model<ISkillToSkillRelationPairDoc>(
    MongooseModelName.SkillToSkillRelations,
    SkillToSkillRelationSchema
  );
}
