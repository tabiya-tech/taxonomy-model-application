import mongoose from "mongoose";
import { ISkillToSkillRelationPairDoc } from "./skillToSkillRelation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { RelationType } from "esco/common/objectTypes";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";

export const SkillToSkillRelationModelPaths = {
  requiringSkillId: "requiringSkillId",
  requiredSkillId: "requiredSkillId",
};

export function initializeSchemaAndModel(
  dbConnection: mongoose.Connection
): mongoose.Model<ISkillToSkillRelationPairDoc> {
  const SkillToSkillRelationSchema: mongoose.Schema<ISkillToSkillRelationPairDoc> =
    new mongoose.Schema<ISkillToSkillRelationPairDoc>(
      {
        modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
        [SkillToSkillRelationModelPaths.requiringSkillId]: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "requiringSkillDocModel",
          required: true,
        },
        [SkillToSkillRelationModelPaths.requiredSkillId]: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "requiredSkillDocModel",
          required: true,
        },
        requiringSkillDocModel: { type: String, required: true, enum: [MongooseModelName.Skill] },
        requiredSkillDocModel: { type: String, required: true, enum: [MongooseModelName.Skill] },
        relationType: { type: String, required: true, enum: RelationType },
      },
      {
        timestamps: true,
        strict: "throw",
        toObject: getGlobalTransformOptions(_TransformFn),
        toJSON: getGlobalTransformOptions(_TransformFn),
      }
    );
  SkillToSkillRelationSchema.index({ modelId: 1, requiringSkillId: 1, requiredSkillId: 1 }, { unique: true });

  return dbConnection.model<ISkillToSkillRelationPairDoc>(
    MongooseModelName.SkillToSkillRelation,
    SkillToSkillRelationSchema
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  ret.requiringSkillId = ret.requiringSkillId.toString(); // Convert parentId to string
  ret.requiredSkillId = ret.requiredSkillId.toString(); // Convert childId to string
  return ret;
};
