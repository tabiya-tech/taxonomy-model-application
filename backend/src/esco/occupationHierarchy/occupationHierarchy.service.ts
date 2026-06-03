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

  async setParent(
    modelId: string,
    childId: string,
    childType: OccupationHierarchyChildType,
    parentId: string,
    parentType: OccupationHierarchyParentType
  ): Promise<IOccupation | IOccupationGroup> {
    try {
      let parentEntity: IOccupation | IOccupationGroup | null = null;
      if (parentType === ObjectTypes.ISCOGroup || parentType === ObjectTypes.LocalGroup) {
        parentEntity = await this.occupationGroupRepository.findById(parentId);
      } else {
        parentEntity = await this.occupationRepository.findById(parentId);
      }

      if (!parentEntity || parentEntity.modelId !== modelId) {
        throw new OccupationParentValidationError(ParentForOccupationValidationErrorCode.PARENT_NOT_FOUND);
      }

      const spec: INewOccupationHierarchyPairSpec = {
        parentId,
        parentType,
        childId,
        childType,
      };

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
}
