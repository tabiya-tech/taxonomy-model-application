import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IOccupationHierarchyPairDoc } from "./occupationHierarchy.types";

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
      parentId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "parentDocModel",
        required: true,
      },
      childId: {
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
    { timestamps: true, strict: "throw" }
  );
  OccupationHierarchySchema.index(
    { modelId: 1, parentType: 1, parentId: 1, childId: 1, childType: 1 },
    { unique: true }
  );

  // Model
  return dbConnection.model<IOccupationHierarchyPairDoc>(
    MongooseModelName.OccupationHierarchy,
    OccupationHierarchySchema
  );
}
