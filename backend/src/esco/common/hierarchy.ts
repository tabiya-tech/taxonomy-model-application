import { ObjectTypes } from "./objectTypes";

export interface IHierarchyPairSpec {
  parentType: ObjectTypes;
  parentId: string;

  childId: string;
  childType: ObjectTypes;
}

export function isHierarchyPairValid(
  spec: IHierarchyPairSpec,
  existingIds: Map<string, ObjectTypes>,
  validPairTypes: {
    parentType: ObjectTypes;
    childType: ObjectTypes;
  }[]
) {
  if (spec.childId === spec.parentId) return false; // skip self referencing

  // check if the parentType and childType pair is in the validPairTypes
  const isIncluded = validPairTypes.find((pairType) => {
    return pairType.parentType === spec.parentType && pairType.childType === spec.childType;
  });

  if (!isIncluded) return false; // skip if the parentType and childType pair is not in the validPairTypes

  const existingParentType = existingIds.get(spec.parentId.toString());
  if (!existingParentType) return false; // skip if parentId is not found in the existingIds
  if (spec.parentType !== existingParentType) return false; // skip if the parentType does not match the existingParentType

  const existingChildType = existingIds.get(spec.childId.toString());
  if (!existingChildType) return false; // skip if  is not found in the existingIds
  if (spec.childType !== existingChildType) return false; // skip if the parentType does not match the existingChildType

  return true;
}
