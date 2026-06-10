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

describe("OccupationToSkillRelationService Unit Tests", () => {
  let occupationRepositoryMock: {
    Model: {
      findOne: jest.Mock;
    };
  };
  let skillRepositoryMock: {
    Model: {
      findOne: jest.Mock;
    };
  };
  let relationRepositoryMock: {
    relationModel: {
      findOneAndUpdate: jest.Mock;
    };
  };

  let service: OccupationToSkillRelationService;

  beforeEach(() => {
    jest.clearAllMocks();

    occupationRepositoryMock = {
      Model: {
        findOne: jest.fn(),
      },
    };
    skillRepositoryMock = {
      Model: {
        findOne: jest.fn(),
      },
    };
    relationRepositoryMock = {
      relationModel: {
        findOneAndUpdate: jest.fn(),
      },
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
      occupationType: ObjectTypes.ESCOOccupation,
    };

    const mockSkill = {
      ...getISkillMockData(3),
      _id: new mongoose.Types.ObjectId(givenSkillId),
    };

    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    const mockSkillDoc = {
      ...mockSkill,
      toObject: jest.fn().mockReturnValue(mockSkill),
      exec: jest.fn(),
    };
    mockSkillDoc.exec.mockResolvedValue(mockSkillDoc);

    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);
    skillRepositoryMock.Model.findOne.mockReturnValueOnce(mockSkillDoc);

    const mockUpdateQuery = {
      exec: jest.fn().mockResolvedValue({}),
    };
    relationRepositoryMock.relationModel.findOneAndUpdate.mockReturnValue(mockUpdateQuery);

    const result = await service.addSkill(
      givenModelId,
      givenOccupationId,
      givenSkillId,
      OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
      SignallingValueLabel.NONE,
      null
    );

    expect(result.id).toEqual(givenSkillId);
    expect(result.relationType).toEqual(OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL);
  });

  test("should successfully add Local skill relationship with signallingValue of 0 and not convert it to null", async () => {
    const givenModelId = getMockStringId(1);
    const givenOccupationId = getMockStringId(2);
    const givenSkillId = getMockStringId(3);

    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(givenOccupationId),
      occupationType: ObjectTypes.LocalOccupation,
    };

    const mockSkill = {
      ...getISkillMockData(3),
      _id: new mongoose.Types.ObjectId(givenSkillId),
    };

    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    const mockSkillDoc = {
      ...mockSkill,
      toObject: jest.fn().mockReturnValue(mockSkill),
      exec: jest.fn(),
    };
    mockSkillDoc.exec.mockResolvedValue(mockSkillDoc);

    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);
    skillRepositoryMock.Model.findOne.mockReturnValueOnce(mockSkillDoc);

    const mockUpdateQuery = {
      exec: jest.fn().mockResolvedValue({}),
    };
    relationRepositoryMock.relationModel.findOneAndUpdate.mockReturnValue(mockUpdateQuery);

    const result = await service.addSkill(
      givenModelId,
      givenOccupationId,
      givenSkillId,
      OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE,
      SignallingValueLabel.HIGH,
      0
    );

    expect(result.id).toEqual(givenSkillId);
    expect(result.relationType).toEqual(OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE);
    expect(result.signallingValue).toEqual(0);
    expect(relationRepositoryMock.relationModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        signallingValue: 0,
      }),
      expect.anything()
    );
  });

  test("should throw OCCUPATION_NOT_FOUND when requiring occupation is not found", async () => {
    const mockChildDoc = {
      exec: jest.fn().mockResolvedValue(null),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValue(mockChildDoc);

    await expect(
      service.addSkill(getMockStringId(1), getMockStringId(2), getMockStringId(3), "essential", "", null)
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND));
  });

  test("should throw SKILL_NOT_FOUND when required skill is not found", async () => {
    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(getMockStringId(2)),
    };
    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);

    const mockSkillDoc = {
      exec: jest.fn().mockResolvedValue(null),
    };
    skillRepositoryMock.Model.findOne.mockReturnValueOnce(mockSkillDoc);

    await expect(
      service.addSkill(getMockStringId(1), getMockStringId(2), getMockStringId(3), "essential", "", null)
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND));
  });

  test("should throw INVALID_RELATION_TYPE when ESCO occupation lacks relationType", async () => {
    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(getMockStringId(2)),
      occupationType: ObjectTypes.ESCOOccupation,
    };
    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);

    const mockSkill = {
      ...getISkillMockData(3),
      _id: new mongoose.Types.ObjectId(getMockStringId(3)),
    };
    const mockSkillDoc = {
      ...mockSkill,
      exec: jest.fn().mockResolvedValue(mockSkill),
    };
    skillRepositoryMock.Model.findOne.mockReturnValueOnce(mockSkillDoc);

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE));
  });

  test("should throw INVALID_SIGNALLING_VALUE_LABEL when ESCO occupation has signallingValueLabel", async () => {
    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(getMockStringId(2)),
      occupationType: ObjectTypes.ESCOOccupation,
    };
    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);

    const mockSkill = {
      ...getISkillMockData(3),
      _id: new mongoose.Types.ObjectId(getMockStringId(3)),
    };
    const mockSkillDoc = {
      ...mockSkill,
      exec: jest.fn().mockResolvedValue(mockSkill),
    };
    skillRepositoryMock.Model.findOne.mockReturnValueOnce(mockSkillDoc);

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        SignallingValueLabel.HIGH,
        null
      )
    ).rejects.toThrow(
      new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_SIGNALLING_VALUE_LABEL)
    );
  });

  test("should throw MUTUALLY_EXCLUSIVE_VALUES when Local occupation has both relationType and signallingValueLabel", async () => {
    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(getMockStringId(2)),
      occupationType: ObjectTypes.LocalOccupation,
    };
    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);

    const mockSkill = {
      ...getISkillMockData(3),
      _id: new mongoose.Types.ObjectId(getMockStringId(3)),
    };
    const mockSkillDoc = {
      ...mockSkill,
      exec: jest.fn().mockResolvedValue(mockSkill),
    };
    skillRepositoryMock.Model.findOne.mockReturnValueOnce(mockSkillDoc);

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        SignallingValueLabel.HIGH,
        null
      )
    ).rejects.toThrow(
      new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.MUTUALLY_EXCLUSIVE_VALUES)
    );
  });

  test("should throw INVALID_RELATION_TYPE when Local occupation has neither relationType nor signallingValueLabel", async () => {
    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(getMockStringId(2)),
      occupationType: ObjectTypes.LocalOccupation,
    };
    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);

    const mockSkill = {
      ...getISkillMockData(3),
      _id: new mongoose.Types.ObjectId(getMockStringId(3)),
    };
    const mockSkillDoc = {
      ...mockSkill,
      exec: jest.fn().mockResolvedValue(mockSkill),
    };
    skillRepositoryMock.Model.findOne.mockReturnValueOnce(mockSkillDoc);

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE));
  });

  test("should throw DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION when findOneAndUpdate fails", async () => {
    const mockChild = {
      ...getIOccupationMockData(2),
      _id: new mongoose.Types.ObjectId(getMockStringId(2)),
      occupationType: ObjectTypes.ESCOOccupation,
    };
    const mockChildDoc = {
      ...mockChild,
      exec: jest.fn().mockResolvedValue(mockChild),
    };
    occupationRepositoryMock.Model.findOne.mockReturnValueOnce(mockChildDoc);

    const mockSkill = {
      ...getISkillMockData(3),
      _id: new mongoose.Types.ObjectId(getMockStringId(3)),
    };
    const mockSkillDoc = {
      ...mockSkill,
      exec: jest.fn().mockResolvedValue(mockSkill),
    };
    skillRepositoryMock.Model.findOne.mockReturnValueOnce(mockSkillDoc);

    const mockUpdateQuery = {
      exec: jest.fn().mockRejectedValue(new Error("Database write error")),
    };
    relationRepositoryMock.relationModel.findOneAndUpdate.mockReturnValue(mockUpdateQuery);

    await expect(
      service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        SignallingValueLabel.NONE,
        null
      )
    ).rejects.toThrow(
      new OccupationSkillValidationError(
        SkillForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION
      )
    );
  });
});
