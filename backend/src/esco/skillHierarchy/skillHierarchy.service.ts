import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { ISkill } from "esco/skill/_shared/skill.types";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { ISkillGroupRepository } from "esco/skillGroup/repository/SkillGroup.repository";
import { ISkillHierarchyRepository } from "esco/skillHierarchy/skillHierarchyRepository";
import {
  ISkillHierarchyService,
  ParentForSkillValidationErrorCode,
  SkillParentValidationError,
} from "esco/skillHierarchy/skillHierarchy.service.types";
import { ObjectTypes } from "esco/common/objectTypes";
import {
  SkillHierarchyParentType,
  SkillHierarchyChildType,
  INewSkillHierarchyPairSpec,
} from "esco/skillHierarchy/skillHierarchy.types";

export class SkillHierarchyService implements ISkillHierarchyService {
  private readonly skillRepository: ISkillRepository;
  private readonly skillGroupRepository: ISkillGroupRepository;
  private readonly skillHierarchyRepository: ISkillHierarchyRepository;

  constructor(
    skillRepository: ISkillRepository,
    skillGroupRepository: ISkillGroupRepository,
    skillHierarchyRepository: ISkillHierarchyRepository
  ) {
    this.skillRepository = skillRepository;
    this.skillGroupRepository = skillGroupRepository;
    this.skillHierarchyRepository = skillHierarchyRepository;
  }

  async setParent(
    modelId: string,
    childId: string,
    childType: SkillHierarchyChildType,
    parentId: string,
    parentType: SkillHierarchyParentType
  ): Promise<ISkill | ISkillGroup> {
    try {
      let parentEntity: ISkill | ISkillGroup | null = null;
      if (parentType === ObjectTypes.SkillGroup) {
        parentEntity = await this.skillGroupRepository.findById(parentId);
      } else {
        parentEntity = await this.skillRepository.findById(parentId);
      }

      if (!parentEntity || parentEntity.modelId !== modelId) {
        throw new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND);
      }

      let childEntity: ISkill | ISkillGroup | null = null;
      if (childType === ObjectTypes.SkillGroup) {
        childEntity = await this.skillGroupRepository.findById(childId);
      } else {
        childEntity = await this.skillRepository.findById(childId);
      }

      if (!childEntity || childEntity.modelId !== modelId) {
        throw new SkillParentValidationError(ParentForSkillValidationErrorCode.SKILL_NOT_FOUND);
      }

      const spec: INewSkillHierarchyPairSpec = {
        parentId,
        parentType,
        childId,
        childType,
      };

      const createdPairs = await this.skillHierarchyRepository.createMany(modelId, [spec]);

      if (createdPairs.length === 0) {
        throw new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT);
      }

      return parentEntity;
    } catch (error: unknown) {
      if (error instanceof SkillParentValidationError) throw error;
      throw new SkillParentValidationError(ParentForSkillValidationErrorCode.DB_FAILED_TO_CREATE_SKILL_PARENT);
    }
  }
}
