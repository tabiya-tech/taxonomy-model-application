import { IPopulatedSkillHierarchyPairDoc } from "./skillHierarchy.types";
import { ISkillReferenceDoc } from "esco/skill/skills.types";
import { ISkillGroupReferenceDoc } from "esco/skillGroup/skillGroup.types";

export function getSkillHierarchyParentsReference(
  doc: IPopulatedSkillHierarchyPairDoc
): ISkillReferenceDoc | ISkillGroupReferenceDoc | null {
  if (!doc.parentId) return null;
  if (!doc.parentId.modelId?.equals(doc.modelId)) {
    console.error(`Parent is not in the same model as the child`);
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
    console.error(`Child is not in the same model as the parent`);
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReferenceDoc | ISkillGroupReferenceDoc interface
  delete doc.childId.modelId;
  return doc.childId;
}
