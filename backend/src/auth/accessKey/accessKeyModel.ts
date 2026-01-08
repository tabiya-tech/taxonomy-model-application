import mongoose from "mongoose";

import AuthAPISpecs from "api-specifications/auth";

import { MongooseModelName } from "auth/mongooseModelNames";
import { AccessKeyType, IAccessKeyDoc } from "auth/accessKey/accessKey.types";

import { stringRequired } from "server/stringRequired";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<IAccessKeyDoc> {
  // Main Schema
  const AccessKeySchema = new mongoose.Schema<IAccessKeyDoc>(
    {
      keyType: {
        type: String,
        required: true,
        enum: Object.values(AccessKeyType),
      },
      role: {
        type: String,
        required: true,
        enum: Object.values(AuthAPISpecs.Enums.TabiyaRoles),
      },
      keyId: {
        type: String,
        required: stringRequired("keyId"),
        maxlength: [
          AuthAPISpecs.Constants.KEY_ID_MAX_LENGTH,
          `Key Id must be at most ${AuthAPISpecs.Constants.KEY_ID_MAX_LENGTH} chars long`,
        ],
      },
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(),
      toJSON: getGlobalTransformOptions(),
    }
  );

  AccessKeySchema.index(INDEX_FOR_KEY_TYPE_AND_ID, {
    unique: true,
  });

  return dbConnection.model<IAccessKeyDoc>(MongooseModelName.AccessKey, AccessKeySchema);
}

export const INDEX_FOR_KEY_TYPE_AND_ID: mongoose.IndexDefinition = {
  keyId: 1,
  keyType: 1,
};
