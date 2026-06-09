import { ISkillWithRelation } from "esco/occupations/_shared/occupation.types";
import { IOccupationRepository } from "esco/occupations/repository/occupation.repository";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { IOccupationToSkillRelationRepository } from "esco/occupationToSkillRelation/occupationToSkillRelationRepository";
import {
  IOccupationToSkillRelationService,
  SkillForOccupationValidationErrorCode,
  OccupationSkillValidationError,
} from "esco/occupationToSkillRelation/occupationToSkillRelation.service.types";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import mongoose from "mongoose";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { populateEmptySkillHierarchy } from "esco/skillHierarchy/populateFunctions";
import { populateEmptySkillToSkillRelation } from "esco/skillToSkillRelation/populateFunctions";
import { populateEmptyRequiredByOccupations } from "esco/occupationToSkillRelation/populateFunctions";

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
    relationType: string,
    signallingValueLabel: string,
    signallingValue: number | null
  ): Promise<ISkillWithRelation> {
    // 1. Fetch the child occupation (requiring entity)
    const child = await this.occupationRepository.Model.findOne({
      _id: requiringOccupationId,
      modelId: modelId,
    }).exec();
    if (!child) {
      throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND);
    }

    // 2. Fetch the required skill
    const skill = await this.skillRepository.Model.findOne({
      _id: requiredSkillId,
      modelId: modelId,
    }).exec();
    if (!skill) {
      throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND);
    }

    // 3. Validate type-specific relationship rules
    const isEsco = child.occupationType === ObjectTypes.ESCOOccupation;

    if (isEsco) {
      if (relationType === OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE) {
        throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE);
      }
      if (signallingValueLabel !== SignallingValueLabel.NONE) {
        throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_SIGNALLING_VALUE_LABEL);
      }
    } else {
      const hasRelation = relationType !== OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE;
      const hasSignalling = signallingValueLabel !== SignallingValueLabel.NONE;

      if (hasRelation && hasSignalling) {
        throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.MUTUALLY_EXCLUSIVE_VALUES);
      }
      if (!hasRelation && !hasSignalling) {
        throw new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE);
      }
    }

    // 4. Update/insert the relationship pair in DB
    try {
      const RelationModel = this.occupationToSkillRelationRepository.relationModel;
      await RelationModel.findOneAndUpdate(
        {
          modelId: new mongoose.Types.ObjectId(modelId),
          requiringOccupationId: new mongoose.Types.ObjectId(requiringOccupationId),
          requiredSkillId: new mongoose.Types.ObjectId(requiredSkillId),
        },
        {
          requiringOccupationType: child.occupationType,
          requiringOccupationDocModel: MongooseModelName.Occupation,
          requiredSkillDocModel: MongooseModelName.Skill,
          relationType: relationType as unknown as OccupationToSkillRelationType,
          signallingValueLabel: signallingValueLabel as unknown as SignallingValueLabel,
          signallingValue: signallingValue || null,
        },
        { upsert: true, new: true }
      ).exec();

      populateEmptySkillHierarchy(skill);
      populateEmptySkillToSkillRelation(skill);
      populateEmptyRequiredByOccupations(skill);

      return {
        ...skill.toObject(),
        relationType: relationType as unknown as OccupationToSkillRelationType,
        signallingValue: signallingValue || null,
        signallingValueLabel: signallingValueLabel as unknown as SignallingValueLabel,
      } as ISkillWithRelation;
    } catch (error: unknown) {
      throw new OccupationSkillValidationError(
        SkillForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION
      );
    }
  }
}
