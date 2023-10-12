import mongoose from "mongoose";
import { ISkillDoc, ISkillReferenceDoc } from "esco/skill/skills.types";
import { ReferenceWithModelId, ReferenceWithRelationType } from "esco/common/objectTypes";
import { ISkillGroupDoc, ISkillGroupReferenceDoc } from "esco/skillGroup/skillGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getSkillReferenceWithModelId, getSkillReferenceWithRelationType } from "esco/skill/skillReference";
import { getSkillGroupReferenceWithModelId } from "esco/skillGroup/skillGroupReference";

export type ISkillMongooseDocument =
  | (mongoose.Document<unknown, NonNullable<unknown>, ISkillDoc> &
      Omit<ISkillDoc & { _id: mongoose.Types.ObjectId }, never>)
  | null;

export async function populateParents(skill: ISkillMongooseDocument) {
  await skill?.populate({
    path: "parents",
    populate: {
      path: "parentId",
      transform: (doc) => transformParentOrChild(doc),
    },
    transform: (doc) => {
      if (!doc?.parentId) return null;
      if (!doc?.parentId?.modelId?.equals(skill?.modelId)) {
        console.error(`Parent is not in the same model as the child`);
        return null;
      }
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
      transform: (doc) => transformParentOrChild(doc),
    },
    transform: (doc) => {
      if (!doc?.childId) return null;
      if (!doc?.childId?.modelId?.equals(skill?.modelId)) {
        console.error(`Child is not in the same model as the parent`);
        return null;
      }
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
      transform: (doc) => transformRequiredOrRequiredBySkill(doc),
    },
    transform: (doc) => {
      if (!doc?.requiredSkillId) return null;
      if (!doc?.requiredSkillId?.modelId?.equals(skill?.modelId)) {
        console.error(`Required skill is not in the same model as the Requiring skill`);
        return null;
      }
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
      transform: (doc) => transformRequiredOrRequiredBySkill(doc),
    },
    transform: (doc): ReferenceWithRelationType<ISkillReferenceDoc> | null => {
      if (!doc?.requiringSkillId) return null;
      if (!doc?.requiringSkillId?.modelId?.equals(skill?.modelId)) {
        console.error(`Requiring skill is not in the same model as the Required skill`);
        return null;
      }
      delete doc.requiringSkillId.modelId;
      return getSkillReferenceWithRelationType(doc.requiringSkillId, doc.relationType);
    },
  });
}

export function transformParentOrChild(
  doc: ISkillDoc | ISkillGroupDoc
): ReferenceWithModelId<ISkillReferenceDoc> | ReferenceWithModelId<ISkillGroupReferenceDoc> | null {
  // @ts-ignore
  if (doc.constructor.modelName === MongooseModelName.Skill) {
    return getSkillReferenceWithModelId(doc as ISkillDoc);
  }
  // @ts-ignore
  if (doc.constructor.modelName === MongooseModelName.SkillGroup) {
    return getSkillGroupReferenceWithModelId(doc as ISkillGroupDoc);
  }
  // @ts-ignore
  console.error(`Parent/Child is not a Skill or SkillGroup: ${doc.constructor.modelName}`);
  return null;
}

export function transformRequiredOrRequiredBySkill(doc: ISkillDoc): ReferenceWithModelId<ISkillReferenceDoc> | null {
  // @ts-ignore
  if (doc.constructor.modelName === MongooseModelName.Skill) {
    return getSkillReferenceWithModelId(doc);
  }
  // @ts-ignore
  console.error(`Required/RequiredBy is not a Skill: ${doc.constructor.modelName}`);
  return null;
}
