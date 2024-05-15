import mongoose from "mongoose";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ObjectTypes, RelationType, SignallingValue } from "esco/common/objectTypes";
import { IOccupationToSkillRelationPairDoc } from "./occupationToSkillRelation.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { stringRequired } from "server/stringRequired";

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
          enum: [ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation],
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
        requiringOccupationDocModel: {
          type: String,
          required: true,
          enum: [MongooseModelName.Occupation],
        },
        requiredSkillDocModel: { type: String, required: true, enum: [MongooseModelName.Skill] },
        relationType: {
          type: String,
          required: stringRequired("relationType"),
          enum: RelationType,
          validate: {
            validator: function (value: string): boolean {
              // only ESCOOccupation can have relation types
              // @ts-ignore
              switch (this.requiringOccupationType) {
                case ObjectTypes.ESCOOccupation:
                  return value !== RelationType.NONE;
                case ObjectTypes.LocalOccupation:
                  // @ts-ignore
                  if (this.signallingValueLabel === SignallingValue.NONE) {
                    return value !== RelationType.NONE;
                  } else {
                    return value === RelationType.NONE;
                  }
                default:
                  throw new Error("Value of 'occupationType' path is not supported");
              }
            },
          },
        },
        signallingValueLabel: {
          type: String,
          required: stringRequired("signallingValueLabel"),
          enum: SignallingValue,
          validate: {
            validator: function (value: string) {
              // only local occupations can have signalling values
              // @ts-ignore
              switch (this.requiringOccupationType) {
                case ObjectTypes.ESCOOccupation:
                  return value === SignallingValue.NONE;
                case ObjectTypes.LocalOccupation:
                  // @ts-ignore
                  if (this.relationType === RelationType.NONE) {
                    return value !== SignallingValue.NONE;
                  } else {
                    return value === SignallingValue.NONE;
                  }
                default:
                  throw new Error("Value of 'occupationType' path is not supported");
              }
            },
          },
        },
        signallingValue: { type: Number, required: false, min: 0, max: 1 },
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
