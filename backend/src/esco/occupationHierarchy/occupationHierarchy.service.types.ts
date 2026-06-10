import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { IOccupation } from "esco/occupations/_shared/occupation.types";

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
   * Sets the parent for an occupation.
   *
   * @param {string} modelId - The modelId of the taxonomy model.
   * @param {string} childId - The ID of the child occupation.
   * @param {string} parentId - The ID of the parent entity.
   * @param {string} parentType - The type of the parent entity.
   * @return {Promise<IOccupation | IOccupationGroup>} - A Promise that resolves to the parent entity.
   */
  setParent(
    modelId: string,
    childId: string,
    parentId: string,
    parentType: string
  ): Promise<IOccupation | IOccupationGroup>;
}
