import { IPopulatedSkillHierarchyPairDoc } from "./skillHierarchy.types";
import { ISkillDoc, ISkillReferenceDoc } from "esco/skill/skills.types";
import { ISkillGroupDoc, ISkillGroupReferenceDoc } from "esco/skillGroup/skillGroup.types";
import mongoose from "mongoose";

export function getSkillHierarchyParentsReference(
  doc: IPopulatedSkillHierarchyPairDoc
): ISkillReferenceDoc | ISkillGroupReferenceDoc | null {
  if (!doc.parentId) return null;
  if (!doc.parentId.modelId?.equals(doc.modelId)) {
    console.error(new Error(`Parent is not in the same model as the child`));
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReferenceDoc | ISkillGroupReferenceDoc interface
  delete doc.parentId.modelId;
  return doc.parentId;
}

export function getSkillHierarchyChildrenReference(
  doc: IPopulatedSkillHierarchyPairDoc
): ISkillReferenceDoc | ISkillGroupReferenceDoc | null {
  if (!doc.childId) return null;
  if (!doc.childId.modelId?.equals(doc.modelId)) {
    console.error(new Error(`Child is not in the same model as the parent`));
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReferenceDoc | ISkillGroupReferenceDoc interface
  delete doc.childId.modelId;
  return doc.childId;
}

export function populateEmptySkillHierarchy(target: mongoose.Document<unknown, unknown, ISkillDoc | ISkillGroupDoc>) {
  //@ts-ignore
  target.parents = [];
  //@ts-ignore
  target.children = [];
}
