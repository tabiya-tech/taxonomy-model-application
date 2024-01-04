import mongoose from "mongoose";
import { RegExp_UUIDv4 } from "server/regex";
import {
  AltLabelsProperty,
  DescriptionProperty,
  ImportIDProperty,
  OccupationTypeProperty,
  UUIDHistoryProperty,
} from "esco/common/modelSchema";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";
import { ILocalizedOccupationDoc } from "./localizedOccupation.types";

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<ILocalizedOccupationDoc> {
  // Main Schema
  const LocalizedOccupationSchema = new mongoose.Schema<ILocalizedOccupationDoc>(
    {
      UUID: { type: String, required: true, validate: RegExp_UUIDv4 },
      UUIDHistory: UUIDHistoryProperty,
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      altLabels: AltLabelsProperty,
      description: DescriptionProperty,
      importId: ImportIDProperty,
      occupationType: OccupationTypeProperty,
      localizesOccupationId: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(_TransformFn),
      toJSON: getGlobalTransformOptions(_TransformFn),
    }
  );

  LocalizedOccupationSchema.index({ UUID: 1 }, { unique: true });
  LocalizedOccupationSchema.index(INDEX_FOR_LOCALIZED, { unique: true });
  LocalizedOccupationSchema.index({ UUIDHistory: 1 });

  // Model
  return dbConnection.model<ILocalizedOccupationDoc>(MongooseModelName.LocalizedOccupation, LocalizedOccupationSchema);
}

export const INDEX_FOR_LOCALIZED: mongoose.IndexDefinition = {
  modelId: 1,
  localizesOccupationId: 1,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (doc: any, ret: any) => {
  ret.localizesOccupationId = ret.localizesOccupationId.toString(); // Convert localizesOccupationId to string
  return ret;
};
