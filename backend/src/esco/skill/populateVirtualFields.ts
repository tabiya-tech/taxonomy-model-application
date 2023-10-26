import mongoose from "mongoose";
import { ISkillDoc, ISkillReference, ISkillReferenceDoc } from "esco/skill/skills.types";
import { ReferenceWithRelationType } from "esco/common/objectTypes";
import { ISkillGroupDoc, ISkillGroupReference, ISkillGroupReferenceDoc } from "esco/skillGroup/skillGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getSkillReferenceWithModelId, getSkillReferenceWithRelationType } from "esco/skill/skillReference";
import { getSkillGroupDocReferenceWithModelId } from "esco/skillGroup/skillGroupReference";
import { IPopulatedSkillToSkillRelationPairDoc } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { IPopulatedSkillHierarchyPairDoc } from "esco/skillHierarchy/skillHierarchy.types";

export type ISkillMongooseDocument =
  | (mongoose.Document<unknown, NonNullable<unknown>, ISkillDoc> &
      Omit<ISkillDoc & { _id: mongoose.Types.ObjectId }, never>)
  | null;

export async function populateParents(skill: ISkillMongooseDocument) {
  await skill?.populate({
    path: "parents",
    populate: {
      path: "parentId",
      transform: (doc: unknown) => transformParentOrChild(doc),
    },
    transform: (doc: IPopulatedSkillHierarchyPairDoc): ISkillReference | ISkillGroupReference | null => {
      if (!doc.parentId) return null;
      if (!doc.parentId.modelId?.equals(skill?.modelId)) {
        console.error(`Parent is not in the same model as the child`);
        return null;
      }
      // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReferenceDoc | ISkillGroupReferenceDoc interface
      delete doc.parentId.modelId;
      return doc.parentId;
    },
  });
}

export async function populateChildren(skill: ISkillMongooseDocument) {
  await skill?.populate({
    path: "children",
    populate: {
      path: "childId",
      transform: (doc: unknown) => transformParentOrChild(doc),
    },
    transform: (doc: IPopulatedSkillHierarchyPairDoc): ISkillReference | ISkillGroupReference | null => {
      if (!doc.childId) return null;
      if (!doc.childId.modelId?.equals(skill?.modelId)) {
        console.error(`Child is not in the same model as the parent`);
        return null;
      }
      // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReferenceDoc | ISkillGroupReferenceDoc interface
      delete doc.childId.modelId;
      return doc.childId;
    },
  });
}

export async function populateRequiresSkills(skill: ISkillMongooseDocument) {
  await skill?.populate({
    path: "requiresSkills",
    populate: {
      path: "requiredSkillId",
      transform: (doc: unknown) => transformRequiredOrRequiredBySkill(doc),
    },
    transform: (doc: IPopulatedSkillToSkillRelationPairDoc): ReferenceWithRelationType<ISkillReference> | null => {
      if (!doc.requiredSkillId) return null;
      if (!doc.requiredSkillId.modelId?.equals(skill?.modelId)) {
        console.error(`Required skill is not in the same model as the Requiring skill`);
        return null;
      }
      // @ts-ignore - we want to remove the modelId field because it is not part of the ReferenceWithRelationType<ISkillReference> interface
      delete doc.requiredSkillId.modelId;
      return getSkillReferenceWithRelationType(doc.requiredSkillId, doc.relationType);
    },
  });
}

export async function populateRequiredBySkills(skill: ISkillMongooseDocument) {
  await skill?.populate({
    path: "requiredBySkills",
    populate: {
      path: "requiringSkillId",
      transform: (doc: unknown) => transformRequiredOrRequiredBySkill(doc),
    },
    transform: (doc: IPopulatedSkillToSkillRelationPairDoc): ReferenceWithRelationType<ISkillReference> | null => {
      if (!doc.requiringSkillId) return null;
      if (!doc.requiringSkillId.modelId?.equals(skill?.modelId)) {
        console.error(`Requiring skill is not in the same model as the Required skill`);
        return null;
      }
      // @ts-ignore - we want to remove the modelId field because it is not part of the ReferenceWithRelationType<ISkillReference> interface
      delete doc.requiringSkillId.modelId;
      return getSkillReferenceWithRelationType(doc.requiringSkillId, doc.relationType);
    },
  });
}

export function transformParentOrChild(doc: unknown): ISkillReferenceDoc | ISkillGroupReferenceDoc | null {
  const modelName = (doc as ModelConstructed<unknown>).constructor.modelName;
  if (modelName === MongooseModelName.Skill) {
    return getSkillReferenceWithModelId(doc as SkillDocument);
  }
  if (modelName === MongooseModelName.SkillGroup) {
    return getSkillGroupDocReferenceWithModelId(doc as SkillGroupDocument);
  }
  // @ts-ignore
  console.error(`Parent/Child is not a Skill or SkillGroup: ${modelName}`);
  return null;
}

export function transformRequiredOrRequiredBySkill(doc: unknown): ISkillReferenceDoc | null {
  const modelName = (doc as ModelConstructed<unknown>).constructor.modelName;
  if (modelName === MongooseModelName.Skill) {
    return getSkillReferenceWithModelId(doc as SkillDocument);
  }
  console.error(`Required/RequiredBy is not a Skill: ${modelName}`);
  return null;
}

type ModelConstructed<T> = { constructor: mongoose.Model<T> };
type _Document<T> = mongoose.Document<unknown, undefined, T> & T & ModelConstructed<T>;
type SkillDocument = _Document<ISkillDoc>;
type SkillGroupDocument = _Document<ISkillGroupDoc>;
