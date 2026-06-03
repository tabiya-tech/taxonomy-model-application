import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { IOccupation } from "esco/occupations/_shared/occupation.types";
import {
  OccupationHierarchyChildType,
  OccupationHierarchyParentType,
} from "esco/occupationHierarchy/occupationHierarchy.types";

export enum ParentForOccupationValidationErrorCode {
  OCCUPATION_NOT_FOUND,
  PARENT_NOT_FOUND,
  INVALID_PARENT_TYPE,
  PARENT_CHILD_CODE_INCONSISTENT,
  DB_FAILED_TO_CREATE_OCCUPATION_PARENT,
}

export class OccupationParentValidationError extends Error {
  constructor(public code: ParentForOccupationValidationErrorCode) {
    super();
  }
}

export interface IOccupationHierarchyService {
  /**
   * Sets the parent for a given child.
   *
   * @param {string} modelId - The ID of the model.
   * @param {string} childId - The ID of the child.
   * @param {OccupationHierarchyChildType} childType - The ObjectType of the child.
   * @param {string} parentId - The ID of the parent.
   * @param {OccupationHierarchyParentType} parentType - The ObjectType of the parent.
   * @returns {Promise<IOccupation | IOccupationGroup>} A promise that resolves to the child with its parents populated.
   */
  setParent(
    modelId: string,
    childId: string,
    childType: OccupationHierarchyChildType,
    parentId: string,
    parentType: OccupationHierarchyParentType
  ): Promise<IOccupation | IOccupationGroup>;
}
