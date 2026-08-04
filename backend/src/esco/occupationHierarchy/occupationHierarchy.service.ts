import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { IOccupation } from "esco/occupations/_shared/occupation.types";
import { IOccupationRepository } from "esco/occupations/repository/occupation.repository";
import { IOccupationGroupRepository } from "esco/occupationGroup/repository/OccupationGroup.repository";
import { IOccupationHierarchyRepository } from "esco/occupationHierarchy/occupationHierarchyRepository";
import {
  IOccupationHierarchyService,
  ParentForOccupationValidationErrorCode,
  OccupationParentValidationError,
} from "esco/occupationHierarchy/occupationHierarchy.service.types";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  OccupationHierarchyParentType,
  OccupationHierarchyChildType,
  INewOccupationHierarchyPairSpec,
} from "esco/occupationHierarchy/occupationHierarchy.types";
import {
  isNewOccupationHierarchyPairSpecValid,
  isParentChildCodeConsistent,
} from "esco/occupationHierarchy/occupationHierarchyValidation";

export class OccupationHierarchyService implements IOccupationHierarchyService {
  private readonly occupationRepository: IOccupationRepository;
  private readonly occupationGroupRepository: IOccupationGroupRepository;
  private readonly occupationHierarchyRepository: IOccupationHierarchyRepository;

  constructor(
    occupationRepository: IOccupationRepository,
    occupationGroupRepository: IOccupationGroupRepository,
    occupationHierarchyRepository: IOccupationHierarchyRepository
  ) {
    this.occupationRepository = occupationRepository;
    this.occupationGroupRepository = occupationGroupRepository;
    this.occupationHierarchyRepository = occupationHierarchyRepository;
  }

  private async findEntityByType(
    id: string,
    type: OccupationHierarchyParentType | OccupationHierarchyChildType
  ): Promise<IOccupation | IOccupationGroup | null> {
    if (type === ObjectTypes.ISCOGroup || type === ObjectTypes.LocalGroup) {
      return this.occupationGroupRepository.findById(id);
    }
    return this.occupationRepository.findById(id);
  }

  private async validateParentChild(
    modelId: string,
    spec: INewOccupationHierarchyPairSpec
  ): Promise<IOccupation | IOccupationGroup> {
    const parentEntity = await this.findEntityByType(spec.parentId, spec.parentType);
    if (!parentEntity || parentEntity.modelId !== modelId) {
      throw new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_NOT_FOUND);
    }

    const childEntity = await this.findEntityByType(spec.childId, spec.childType);
    if (!childEntity || childEntity.modelId !== modelId) {
      throw new OccupationParentValidationError(ParentForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND);
    }

    const existingIds = new Map<string, ObjectTypes[]>([
      [spec.parentId, [spec.parentType]],
      [spec.childId, [spec.childType]],
    ]);
    const idToCode = new Map<string, { type: ObjectTypes; code: string }[]>([
      [spec.parentId, [{ type: spec.parentType, code: parentEntity.code }]],
      [spec.childId, [{ type: spec.childType, code: childEntity.code }]],
    ]);

    if (
      !isNewOccupationHierarchyPairSpecValid(spec, existingIds) ||
      !isParentChildCodeConsistent(spec.parentType, spec.parentId, spec.childType, spec.childId, idToCode)
    ) {
      throw new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT);
    }

    return parentEntity;
  }

  async setParent(
    modelId: string,
    childId: string,
    childType: OccupationHierarchyChildType,
    parentId: string,
    parentType: OccupationHierarchyParentType
  ): Promise<IOccupation | IOccupationGroup> {
    try {
      const spec: INewOccupationHierarchyPairSpec = {
        parentId,
        parentType,
        childId,
        childType,
      };
      const parentEntity = await this.validateParentChild(modelId, spec);

      const createdPairs = await this.occupationHierarchyRepository.createMany(modelId, [spec]);

      if (createdPairs.length === 0) {
        throw new OccupationParentValidationError(
          ParentForOccupationValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT
        );
      }

      return parentEntity;
    } catch (error: unknown) {
      if (error instanceof OccupationParentValidationError) throw error;
      throw new OccupationParentValidationError(
        ParentForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_PARENT
      );
    }
  }

  async replaceParent(
    modelId: string,
    childId: string,
    childType: OccupationHierarchyChildType,
    parentId: string,
    parentType: OccupationHierarchyParentType
  ): Promise<IOccupation | IOccupationGroup> {
    try {
      const spec: INewOccupationHierarchyPairSpec = {
        parentId,
        parentType,
        childId,
        childType,
      };
      const parentEntity = await this.validateParentChild(modelId, spec);

      const updatedPair = await this.occupationHierarchyRepository.replaceParent(modelId, spec);
      if (!updatedPair) {
        throw new OccupationParentValidationError(
          ParentForOccupationValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT
        );
      }

      return parentEntity;
    } catch (error: unknown) {
      if (error instanceof OccupationParentValidationError) throw error;
      throw new OccupationParentValidationError(
        ParentForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_PARENT
      );
    }
  }
}
