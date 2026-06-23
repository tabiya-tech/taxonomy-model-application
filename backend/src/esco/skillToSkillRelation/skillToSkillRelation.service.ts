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
    relationType: SkillToSkillRelationType
  ): Promise<ISkill & { relationType: SkillToSkillRelationType }> {
    try {
      // 1. Fetch the requiring skill
      const requiringSkill = await this.skillRepository.findById(requiringSkillId);
      if (!requiringSkill || requiringSkill.modelId !== modelId) {
        throw new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.SKILL_NOT_FOUND);
      }

      // 2. Fetch the required skill
      const requiredSkill = await this.skillRepository.findById(requiredSkillId);
      if (!requiredSkill || requiredSkill.modelId !== modelId) {
        throw new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATED_SKILL_NOT_FOUND);
      }

      // 3. Create the relationship
      const newRelationSpec: INewSkillToSkillPairSpec = {
        requiringSkillId: requiringSkillId,
        requiredSkillId: requiredSkillId,
        relationType: relationType,
      };

      const createdRelations = await this.skillToSkillRelationRepository.createMany(modelId, [newRelationSpec]);

      if (createdRelations.length === 0) {
        throw new SkillToSkillRelationValidationError(
          SkillToSkillRelationValidationErrorCode.RELATION_CODE_INCONSISTENT
        );
      }

      // 4. Return the populated entity
      return {
        ...requiredSkill,
        relationType: relationType,
      };
    } catch (error: unknown) {
      if (error instanceof SkillToSkillRelationValidationError) {
        throw error;
      }
      throw new SkillToSkillRelationValidationError(
        SkillToSkillRelationValidationErrorCode.DB_FAILED_TO_CREATE_RELATION
      );
    }
  }
}
