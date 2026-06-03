import { OccupationToSkillRelationService } from "./occupationToSkillRelation.service";
import {
  SkillForOccupationValidationErrorCode,
  OccupationSkillValidationError,
} from "./occupationToSkillRelation.service.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { getIOccupationMockData } from "esco/occupations/_shared/testDataHelper";
import { getISkillMockData } from "esco/skill/_shared/testDataHelper";
import { IOccupationRepository } from "esco/occupations/repository/occupation.repository";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { IOccupationToSkillRelationRepository } from "esco/occupationToSkillRelation/occupationToSkillRelationRepository";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import mongoose from "mongoose";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

describe("OccupationToSkillRelationService Unit Tests", () => {
  let occupationRepositoryMock: {
    findById: jest.Mock;
  };
  let skillRepositoryMock: {
    findById: jest.Mock;
  };
  let relationRepositoryMock: {
    createMany: jest.Mock;
  };

  let service: OccupationToSkillRelationService;

  beforeEach(() => {
    jest.clearAllMocks();

    occupationRepositoryMock = {
      findById: jest.fn(),
    };
    skillRepositoryMock = {
      findById: jest.fn(),
    };
    relationRepositoryMock = {
      createMany: jest.fn(),
    };

    service = new OccupationToSkillRelationService(
      occupationRepositoryMock as unknown as IOccupationRepository,
      skillRepositoryMock as unknown as ISkillRepository,
      relationRepositoryMock as unknown as IOccupationToSkillRelationRepository
    );
  });

  test("should successfully add ESCO skill relationship", async () => {
    const givenModelId = getMockStringId(1);
    const givenOccupationId = getMockStringId(2);
    const givenSkillId = getMockStringId(3);

    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(givenOccupationId),
      id: givenOccupationId,
      modelId: givenModelId,
      occupationType: ObjectTypes.ESCOOccupation,
    };

    const mockSkill = {
      ...getISkillMockData(3),
      _id: new mongoose.Types.ObjectId(givenSkillId),
      id: givenSkillId,
      modelId: givenModelId,
    };

    occupationRepositoryMock.findById.mockResolvedValue(mockChild);
    skillRepositoryMock.findById.mockResolvedValue(mockSkill);
    relationRepositoryMock.createMany.mockResolvedValue([{}]);

    const result = await service.addSkill(
      givenModelId,
      givenOccupationId,
      givenSkillId,
      OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
      SignallingValueLabel.NONE,
      null
    );

    expect(result.id).toEqual(givenSkillId);
    expect(result.relationType).toEqual(OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL);
    expect(relationRepositoryMock.createMany).toHaveBeenCalledWith(givenModelId, [
      {
        requiringOccupationId: givenOccupationId,
        requiringOccupationType: ObjectTypes.ESCOOccupation,
        requiredSkillId: givenSkillId,
        relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        signallingValueLabel: SignallingValueLabel.NONE,
        signallingValue: null,
      },
    ]);
  });

  test("should throw INVALID_RELATION_TYPE when createMany returns empty array", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
      occupationType: ObjectTypes.ESCOOccupation,
    });
    skillRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
    });
    relationRepositoryMock.createMany.mockResolvedValue([]);

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE));
  });

  test("should throw DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION when createMany fails", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
      occupationType: ObjectTypes.ESCOOccupation,
    });
    skillRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
    });
    relationRepositoryMock.createMany.mockRejectedValue(new Error("Database write error"));

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(
      new OccupationSkillValidationError(
        SkillForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION
      )
    );
  });

  test("should throw OCCUPATION_NOT_FOUND when requiring occupation is not found", async () => {
    occupationRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND));
  });

  test("should throw OCCUPATION_NOT_FOUND when requiring occupation has wrong modelId", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(999),
      occupationType: ObjectTypes.ESCOOccupation,
    });

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND));
  });

  test("should throw SKILL_NOT_FOUND if skill is not found before relation creation", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
      occupationType: ObjectTypes.ESCOOccupation,
    });
    relationRepositoryMock.createMany.mockResolvedValue([{}]);
    skillRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND));
  });

  test("should throw SKILL_NOT_FOUND if skill has wrong modelId before relation creation", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
      occupationType: ObjectTypes.ESCOOccupation,
    });
    relationRepositoryMock.createMany.mockResolvedValue([{}]);
    skillRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(999), // wrong modelId
    });

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND));
  });

  test("should throw INVALID_SIGNALLING_VALUE_LABEL if ESCOOccupation has signalling value", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
      occupationType: ObjectTypes.ESCOOccupation,
    });
    skillRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
    });

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.HIGH,
        null
      )
    ).rejects.toThrow(
      new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_SIGNALLING_VALUE_LABEL)
    );
  });

  test("should throw INVALID_RELATION_TYPE if ESCOOccupation has relationType NONE", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
      occupationType: ObjectTypes.ESCOOccupation,
    });
    skillRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
    });

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationToSkillRelationType.NONE,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE));
  });

  test("should throw MUTUALLY_EXCLUSIVE_VALUES if LocalOccupation has both relationType and signalling value", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
      occupationType: ObjectTypes.LocalOccupation,
    });
    skillRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
    });

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.HIGH,
        null
      )
    ).rejects.toThrow(
      new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.MUTUALLY_EXCLUSIVE_VALUES)
    );
  });

  test("should throw INVALID_RELATION_TYPE if LocalOccupation has neither relationType nor signalling value", async () => {
    occupationRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
      occupationType: ObjectTypes.LocalOccupation,
    });
    skillRepositoryMock.findById.mockResolvedValue({
      modelId: getMockStringId(1),
    });

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationToSkillRelationType.NONE,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE));
  });
});
