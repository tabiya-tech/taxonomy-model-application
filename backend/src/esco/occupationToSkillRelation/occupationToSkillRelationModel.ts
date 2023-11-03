import mongoose from "mongoose";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ObjectTypes, RelationType } from "esco/common/objectTypes";
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
        requiringOccupationType: { type: String, required: true, enum: [ObjectTypes.Occupation] },
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
  OccupationToSkillRelationSchema.index({ modelId: 1, requiringOccupationId: 1, requiredSkillId: 1 }, { unique: true });
  OccupationToSkillRelationSchema.index({ requiredSkillId: 1 }); // Needed for populateOccupationRequiresSkillsOptions
  OccupationToSkillRelationSchema.index({ requiringOccupationId: 1 }); // Needed for populateSkillRequiredByOccupationsOptions

  return dbConnection.model<IOccupationToSkillRelationPairDoc>(
    MongooseModelName.OccupationToSkillRelation,
    OccupationToSkillRelationSchema
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  ret.requiringOccupationId = ret.requiringOccupationId.toString(); // Convert parentId to string
  ret.requiredSkillId = ret.requiredSkillId.toString(); // Convert childId to string
  return ret;
};
