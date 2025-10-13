import { IPopulatedOccupationHierarchyPairDoc } from "./occupationHierarchy.types";
import { IOccupationGroupDoc, IOccupationGroupReference } from "esco/occupationGroup/OccupationGroup.types";
import { IOccupationDoc } from "esco/occupations/occupation.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import mongoose from "mongoose";

export function getOccupationHierarchyChildReference(
  doc: IPopulatedOccupationHierarchyPairDoc
): IOccupationGroupReference | IOccupationReference | null {
  if (!doc) return null;
  if (!doc.childId) return null; // the child was not populated, most likely because it failed to pass the consistency criteria in the transform
  if (!doc.childId.modelId?.equals(doc.modelId)) {
    console.error(new Error(`Child is not in the same model as the parent`));
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because it is not part of the IOccupationReference, IOccupationGroupReferenceDoc interface
  delete doc.childId.modelId;
  return doc.childId;
}

export function getOccupationHierarchyParentReference(
  doc: IPopulatedOccupationHierarchyPairDoc
): IOccupationGroupReference | IOccupationReference | null {
  // return only the relevant fields
  if (!doc) return null;
  if (!doc.parentId) return null; // the parent was not populated, most likely because it failed to pass the consistency criteria in the transform
  if (!doc.parentId.modelId?.equals(doc.modelId)) {
    console.error(new Error(`Parent is not in the same model as the child`));
    return null;
  }
  // @ts-ignore - we want to remove the modelId field because  it is not part of the IOccupationReference, IOccupationGroupReferenceDoc interface
  delete doc.parentId.modelId;
  return doc.parentId;
}

export function populateEmptyOccupationHierarchy(
  target: mongoose.Document<unknown, unknown, IOccupationDoc | IOccupationGroupDoc>
) {
  // @ts-ignore
  target.parent = null;
  // @ts-ignore
  target.children = [];
}
