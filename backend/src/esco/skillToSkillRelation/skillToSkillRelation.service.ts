import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { ISkillToSkillRelationRepository } from "esco/skillToSkillRelation/skillToSkillRelationRepository";
import {
  ISkillToSkillRelationService,
  SkillToSkillRelationValidationErrorCode,
  SkillToSkillRelationValidationError,
} from "./skillToSkillRelation.service.types";
import { INewSkillToSkillPairSpec, SkillToSkillRelationType } from "./skillToSkillRelation.types";
import { ISkill } from "esco/skill/_shared/skill.types";

export class SkillToSkillRelationService implements ISkillToSkillRelationService {
  constructor(
    private readonly skillRepository: ISkillRepository,
    private readonly skillToSkillRelationRepository: ISkillToSkillRelationRepository
  ) {}

  async addRelatedSkill(
    modelId: string,
    requiringSkillId: string,
    requiredSkillId: string,
    relationType: string
  ): Promise<ISkill & { relationType: SkillToSkillRelationType }> {
    // 1. Validate relationType
    if (relationType !== SkillToSkillRelationType.ESSENTIAL && relationType !== SkillToSkillRelationType.OPTIONAL) {
      throw new SkillToSkillRelationValidationError(
        SkillToSkillRelationValidationErrorCode.RELATION_TYPE_NOT_SUPPORTED
      );
    }

    // 2. Fetch the requiring skill
    const requiringSkill = await this.skillRepository.findById(requiringSkillId);
    if (!requiringSkill || requiringSkill.modelId !== modelId) {
      throw new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.SKILL_NOT_FOUND);
    }

    // 3. Fetch the required skill
    const requiredSkill = await this.skillRepository.findById(requiredSkillId);
    if (!requiredSkill || requiredSkill.modelId !== modelId) {
      throw new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATED_SKILL_NOT_FOUND);
    }

    // 4. Create the relationship
    const newRelationSpec: INewSkillToSkillPairSpec = {
      requiringSkillId: requiringSkillId,
      requiredSkillId: requiredSkillId,
      relationType: relationType as SkillToSkillRelationType,
    };

    try {
      const createdRelations = await this.skillToSkillRelationRepository.createMany(modelId, [newRelationSpec]);

      if (createdRelations.length === 0) {
        throw new SkillToSkillRelationValidationError(
          SkillToSkillRelationValidationErrorCode.RELATION_CODE_INCONSISTENT
        );
      }
    } catch (error: unknown) {
      if (error instanceof SkillToSkillRelationValidationError) {
        throw error;
      }
      throw new SkillToSkillRelationValidationError(
        SkillToSkillRelationValidationErrorCode.DB_FAILED_TO_CREATE_RELATION
      );
    }

    // 5. Return the populated entity
    return {
      ...requiredSkill,
      relationType: relationType as SkillToSkillRelationType,
    };
  }
}
