import { IPopulatedOccupationHierarchyPairDoc } from "./occupationHierarchy.types";
import { IISCOGroupReference } from "esco/iscoGroup/ISCOGroup.types";
import { IOccupationReference } from "esco/occupation/occupation.types";

export function getOccupationHierarchyChildReference(
  doc: IPopulatedOccupationHierarchyPairDoc
): IISCOGroupReference | IOccupationReference | null {
  if (!doc.childId) return null; // the child was not populated, most likely because it failed to pass the consistency criteria in the transform
  if (!doc.childId.modelId?.equals(doc.modelId)) {
    console.error(`Child is not in the same model as the parent`);
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the IOccupationReference, IISCOGroupReferenceDoc interface
  delete doc.childId.modelId;
  return doc.childId;
}

export function getOccupationHierarchyParentReference(
  doc: IPopulatedOccupationHierarchyPairDoc
): IISCOGroupReference | IOccupationReference | null {
  // return only the relevant fields
  if (!doc.parentId) return null; // the parent was not populated, most likely because it failed to pass the consistency criteria in the transform
  if (!doc.parentId.modelId?.equals(doc.modelId)) {
    console.error(`Parent is not in the same model as the child`);
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because  it is not part of the IOccupationReference, IISCOGroupReferenceDoc interface
  delete doc.parentId.modelId;
  return doc.parentId;
}
