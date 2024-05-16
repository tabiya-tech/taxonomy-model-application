import mongoose from "mongoose";
import { ISkillToSkillRelationPairDoc, SkillToSkillRelationType } from "./skillToSkillRelation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
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
        relationType: { type: String, required: true, enum: SkillToSkillRelationType },
      },
      {
        timestamps: true,
        strict: "throw",
        toObject: getGlobalTransformOptions(_TransformFn),
        toJSON: getGlobalTransformOptions(_TransformFn),
      }
    );

  // A requiring skill -> required skill relation cannot show up twice in a model
  // Additionally, it is needed from the virtual requiresSkill field matcher, that is populated via the populateSkillToSkillRelationOptions
  SkillToSkillRelationSchema.index(INDEX_FOR_REQUIRES_SKILLS, { unique: true });

  // This is needed from the virtual required by occupation field matcher, that is populated via the populateSkillToSkillRelationOptions
  SkillToSkillRelationSchema.index(INDEX_FOR_REQUIRED_BY_SKILLS);

  return dbConnection.model<ISkillToSkillRelationPairDoc>(
    MongooseModelName.SkillToSkillRelation,
    SkillToSkillRelationSchema
  );
}

export const INDEX_FOR_REQUIRES_SKILLS: mongoose.IndexDefinition = {
  modelId: 1,
  requiringSkillId: 1,
  requiredSkillId: 1,
};
export const INDEX_FOR_REQUIRED_BY_SKILLS: mongoose.IndexDefinition = { modelId: 1, requiredSkillId: 1 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  ret.requiringSkillId = ret.requiringSkillId.toString(); // Convert parentId to string
  ret.requiredSkillId = ret.requiredSkillId.toString(); // Convert childId to string
  return ret;
};
