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
import { isNewSkillHierarchyPairSpecValid } from "esco/skillHierarchy/skillHierarchyValidation";

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

  private async findEntityByType(
    id: string,
    type: SkillHierarchyParentType | SkillHierarchyChildType
  ): Promise<ISkill | ISkillGroup | null> {
    if (type === ObjectTypes.SkillGroup) {
      return this.skillGroupRepository.findById(id);
    }
    return this.skillRepository.findById(id);
  }

  private async validateParentChild(modelId: string, spec: INewSkillHierarchyPairSpec): Promise<ISkill | ISkillGroup> {
    const parentEntity = await this.findEntityByType(spec.parentId, spec.parentType);
    if (!parentEntity || parentEntity.modelId !== modelId) {
      throw new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND);
    }

    const childEntity = await this.findEntityByType(spec.childId, spec.childType);
    if (!childEntity || childEntity.modelId !== modelId) {
      throw new SkillParentValidationError(ParentForSkillValidationErrorCode.SKILL_NOT_FOUND);
    }

    const existingIds = new Map<string, ObjectTypes[]>([
      [spec.parentId, [spec.parentType]],
      [spec.childId, [spec.childType]],
    ]);

    if (!isNewSkillHierarchyPairSpecValid(spec, existingIds)) {
      throw new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT);
    }

    return parentEntity;
  }

  async setParent(
    modelId: string,
    childId: string,
    childType: SkillHierarchyChildType,
    parentId: string,
    parentType: SkillHierarchyParentType
  ): Promise<ISkill | ISkillGroup> {
    try {
      const spec: INewSkillHierarchyPairSpec = {
        parentId,
        parentType,
        childId,
        childType,
      };

      const parentEntity = await this.validateParentChild(modelId, spec);

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

  async updateParent(
    modelId: string,
    childId: string,
    childType: SkillHierarchyChildType,
    parentId: string,
    parentType: SkillHierarchyParentType
  ): Promise<ISkill | ISkillGroup | null> {
    try {
      const spec: INewSkillHierarchyPairSpec = {
        parentId,
        parentType,
        childId,
        childType,
      };

      const parentEntity = await this.validateParentChild(modelId, spec);

      const updatedPair = await this.skillHierarchyRepository.updateParent(modelId, spec);

      if (!updatedPair) {
        return null;
      }

      return parentEntity;
    } catch (error: unknown) {
      if (error instanceof SkillParentValidationError) throw error;
      throw new SkillParentValidationError(ParentForSkillValidationErrorCode.DB_FAILED_TO_UPDATE_SKILL_PARENT_RELATION);
    }
  }
}
