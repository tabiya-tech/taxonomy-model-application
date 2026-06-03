import { ISkillWithRelation } from "esco/occupations/_shared/occupation.types";
import { IOccupationRepository } from "esco/occupations/repository/occupation.repository";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { IOccupationToSkillRelationRepository } from "esco/occupationToSkillRelation/occupationToSkillRelationRepository";
import {
  IOccupationToSkillRelationService,
  SkillForOccupationValidationErrorCode,
  OccupationSkillValidationError,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.service.types";
import { SignallingValueLabel, ObjectTypes } from "esco/common/objectTypes";
import {
  OccupationToSkillRelationType,
  INewOccupationToSkillPairSpec,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

export class OccupationToSkillRelationService implements IOccupationToSkillRelationService {
  private readonly occupationRepository: IOccupationRepository;
  private readonly skillRepository: ISkillRepository;
  private readonly occupationToSkillRelationRepository: IOccupationToSkillRelationRepository;

  constructor(
    occupationRepository: IOccupationRepository,
    skillRepository: ISkillRepository,
    occupationToSkillRelationRepository: IOccupationToSkillRelationRepository
  ) {
    this.occupationRepository = occupationRepository;
    this.skillRepository = skillRepository;
    this.occupationToSkillRelationRepository = occupationToSkillRelationRepository;
  }

  async addSkill(
    modelId: string,
    requiringOccupationId: string,
    requiredSkillId: string,
    relationType: OccupationToSkillRelationType,
    signallingValueLabel: SignallingValueLabel,
    signallingValue: number | null
  ): Promise<ISkillWithRelation> {
    try {
      // 1. Fetch the child occupation (requiring entity)
      const child = await this.occupationRepository.findById(requiringOccupationId);
      if (!child || child.modelId !== modelId) {
        throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND);
      }

      // 2. Fetch the required skill to ensure it exists
      const skill = await this.skillRepository.findById(requiredSkillId);
      if (!skill || skill.modelId !== modelId) {
        throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND);
      }

      // 3. Validate constraints on relationType and signallingValueLabel
      const isESCO = child.occupationType === ObjectTypes.ESCOOccupation;
      const hasRelation = relationType !== OccupationToSkillRelationType.NONE;
      const hasSignalling = signallingValueLabel !== SignallingValueLabel.NONE;

      if (isESCO) {
        if (hasSignalling) {
          throw new OccupationSkillValidationError(
            SkillForOccupationValidationErrorCode.INVALID_SIGNALLING_VALUE_LABEL
          );
        }
        if (!hasRelation) {
          throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE);
        }
      } else {
        if (hasRelation && hasSignalling) {
          throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.MUTUALLY_EXCLUSIVE_VALUES);
        }
        if (!hasRelation && !hasSignalling) {
          throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE);
        }
      }

      const spec: INewOccupationToSkillPairSpec = {
        requiringOccupationId,
        requiringOccupationType: child.occupationType as ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation,
        requiredSkillId,
        relationType,
        signallingValueLabel,
        signallingValue,
      };

      const createdRelations = await this.occupationToSkillRelationRepository.createMany(modelId, [spec]);

      if (createdRelations.length === 0) {
        throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE);
      }

      return { ...skill, relationType, signallingValue, signallingValueLabel };
    } catch (error: unknown) {
      if (error instanceof OccupationSkillValidationError) throw error;
      throw new OccupationSkillValidationError(
        SkillForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION
      );
    }
  }
}
