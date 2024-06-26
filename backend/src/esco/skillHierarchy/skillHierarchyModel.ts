import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillHierarchyPairDoc } from "./skillHierarchy.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";

export const SkillHierarchyModelPaths = {
  parentId: "parentId",
  childId: "childId",
};

export function initializeSchemaAndModel(dbConnection: mongoose.Connection): mongoose.Model<ISkillHierarchyPairDoc> {
  // Main Schema
  const SkillHierarchySchema = new mongoose.Schema<ISkillHierarchyPairDoc>(
    {
      modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
      parentType: { type: String, required: true, enum: [ObjectTypes.Skill, ObjectTypes.SkillGroup] },
      parentDocModel: { type: String, required: true, enum: [MongooseModelName.Skill, MongooseModelName.SkillGroup] },
      [SkillHierarchyModelPaths.parentId]: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "parentDocModel",
        required: true,
      },
      [SkillHierarchyModelPaths.childId]: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "childDocModel",
        required: true,
      },
      childType: { type: String, required: true, enum: [ObjectTypes.Skill, ObjectTypes.SkillGroup] },
      childDocModel: { type: String, required: true, enum: [MongooseModelName.Skill, MongooseModelName.SkillGroup] },
    },
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(_TransformFn),
      toJSON: getGlobalTransformOptions(_TransformFn),
    }
  );

  // A parent child relation cannot show up twice in a model
  // Additionally, it is needed from the virtual children field matcher, that is populated via the populateSkillHierarchyOptions
  SkillHierarchySchema.index(INDEX_FOR_CHILDREN, { unique: true });

  // This is needed from the virtual parents field matcher, that is populated via the populateSkillHierarchyOptions
  SkillHierarchySchema.index(INDEX_FOR_PARENTS);

  // Model
  return dbConnection.model<ISkillHierarchyPairDoc>(MongooseModelName.SkillHierarchy, SkillHierarchySchema);
}

export const INDEX_FOR_PARENTS: mongoose.IndexDefinition = { modelId: 1, childId: 1, childType: 1 };
export const INDEX_FOR_CHILDREN: mongoose.IndexDefinition = {
  modelId: 1,
  parentId: 1,
  parentType: 1,
  childId: 1,
  childType: 1,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _TransformFn = (_doc: any, ret: any) => {
  ret.parentId = ret.parentId.toString(); // Convert parentId to string
  ret.childId = ret.childId.toString(); // Convert childId to string
  return ret;
};
