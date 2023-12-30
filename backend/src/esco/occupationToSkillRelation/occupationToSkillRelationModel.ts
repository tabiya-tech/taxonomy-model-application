import mongoose from "mongoose";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { OccupationType, RelationType } from "esco/common/objectTypes";
import { IOccupationToSkillRelationPairDoc } from "./occupationToSkillRelation.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";

export const OccupationToSkillRelationModelPaths = {
  requiringOccupationId: "requiringOccupationId",
  requiredSkillId: "requiredSkillId",
};

export function initializeSchemaAndModel(
  dbConnection: mongoose.Connection
): mongoose.Model<IOccupationToSkillRelationPairDoc> {
  const OccupationToSkillRelationSchema: mongoose.Schema<IOccupationToSkillRelationPairDoc> =
    new mongoose.Schema<IOccupationToSkillRelationPairDoc>(
      {
        modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
        requiringOccupationType: {
          type: String,
          required: true,
          enum: OccupationType,
        },
        [OccupationToSkillRelationModelPaths.requiringOccupationId]: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "requiringOccupationDocModel",
          required: true,
        },
        [OccupationToSkillRelationModelPaths.requiredSkillId]: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "requiredSkillDocModel",
          required: true,
        },
        requiringOccupationDocModel: { type: String, required: true, enum: [MongooseModelName.Occupation] },
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

  // A requiring occupation -> required skill relation cannot show up twice in a model
  // Additionally, it is needed from the virtual requiredSkill field matcher, that is populated via the populateOccupationToSkillRelationOptions
  OccupationToSkillRelationSchema.index(INDEX_FOR_REQUIRES_SKILLS, { unique: true });

  // This is needed from the virtual required by occupation field matcher, that is populated via the populateOccupationToSkillRelationOptions
  OccupationToSkillRelationSchema.index(INDEX_FOR_REQUIRED_BY_OCCUPATIONS);

  return dbConnection.model<IOccupationToSkillRelationPairDoc>(
    MongooseModelName.OccupationToSkillRelation,
    OccupationToSkillRelationSchema
  );
}

export const INDEX_FOR_REQUIRES_SKILLS: mongoose.IndexDefinition = {
  modelId: 1,
  requiringOccupationId: 1,
  requiringOccupationType: 1,
  requiredSkillId: 1,
};
export const INDEX_FOR_REQUIRED_BY_OCCUPATIONS: mongoose.IndexDefinition = { modelId: 1, requiredSkillId: 1 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  ret.requiringOccupationId = ret.requiringOccupationId.toString(); // Convert parentId to string
  ret.requiredSkillId = ret.requiredSkillId.toString(); // Convert childId to string
  return ret;
};
