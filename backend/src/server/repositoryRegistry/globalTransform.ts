// Set up mongoose
// Apply to all schemas the transforms to get lean representations of the documents
import mongoose from "mongoose";

export const getGlobalTransformOptions = (
  schemaSpecificTransform?: (doc: unknown, ret: unknown, options: unknown) => unknown
): {
  virtuals: boolean;
  versionKey: boolean;
  transform: (doc: unknown, ret: unknown, options: unknown) => unknown;
} => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    virtuals: true,
    versionKey: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform: function (doc: any, ret: any, options: unknown) {
      // Delete any object attributes we do not need in our projections
      //delete ret.id;
      if (schemaSpecificTransform) ret = schemaSpecificTransform(doc, ret, options);

      if (ret.modelId && ret.modelId instanceof mongoose.Types.ObjectId) {
        ret.modelId = ret.modelId.toString(); // Convert modelId to string
      }
      delete ret._id;
      delete ret.__v;
    },
  };
};
