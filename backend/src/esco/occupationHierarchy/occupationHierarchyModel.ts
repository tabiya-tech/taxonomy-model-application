import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IOccupationHierarchyPairDoc } from "./occupationHierarchy.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";

export const OccupationHierarchyModelPaths = {
  parentId: "parentId",
  childId: "childId",
};

export function initializeSchemaAndModel(
  dbConnection: mongoose.Connection
): mongoose.Model<IOccupationHierarchyPairDoc> {
  // Main Schema
  const OccupationHierarchySchema = new mongoose.Schema<IOccupationHierarchyPairDoc>(
    {
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      parentType: {
        type: String,
        required: true,
        enum: [ObjectTypes.ISCOGroup, ObjectTypes.Occupation],
      },
      parentDocModel: {
        type: String,
        required: true,
        enum: [MongooseModelName.Occupation, MongooseModelName.ISCOGroup],
      },
      [OccupationHierarchyModelPaths.parentId]: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "parentDocModel",
        required: true,
      },
      [OccupationHierarchyModelPaths.childId]: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "childDocModel",
        required: true,
      },
      childType: {
        type: String,
        required: true,
        enum: [ObjectTypes.ISCOGroup, ObjectTypes.Occupation],
      },
      childDocModel: {
        type: String,
        required: true,
        enum: [MongooseModelName.Occupation, MongooseModelName.ISCOGroup],
      },
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(_TransformFn),
      toJSON: getGlobalTransformOptions(_TransformFn),
    }
  );

  // A parent child relation cannot show up twice in a model
  // Additionally, it is needed from the virtual children field matcher, that is populated via the populateOccupationChildrenOptions
  OccupationHierarchySchema.index(INDEX_FOR_CHILDREN, { unique: true });

  // An entity (occupation, iscoGroup) cannot have multiple parents.
  // Additionally, it is needed from the virtual parent field matcher, that is populated via the populateOccupationParentOptions
  OccupationHierarchySchema.index(INDEX_FOR_PARENT, { unique: true });

  // Model
  return dbConnection.model<IOccupationHierarchyPairDoc>(
    MongooseModelName.OccupationHierarchy,
    OccupationHierarchySchema
  );
}

export const INDEX_FOR_PARENT: mongoose.IndexDefinition = { modelId: 1, childId: 1, childType: 1 };
export const INDEX_FOR_CHILDREN: mongoose.IndexDefinition = {
  modelId: 1,
  parentId: 1,
  parentType: 1,
  childId: 1,
  childType: 1,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  ret.parentId = ret.parentId.toString(); // Convert parentId to string
  ret.childId = ret.childId.toString(); // Convert childId to string
  return ret;
};
