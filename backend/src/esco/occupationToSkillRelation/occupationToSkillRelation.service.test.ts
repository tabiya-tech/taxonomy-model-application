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

  describe("addSkill", () => {
    test("should successfully add ESCO skill relationship", async () => {
      // GIVEN that a taxonomy model exists
      const givenModelId = getMockStringId(1);
      // AND a valid occupation exists in the model
      const givenOccupationId = getMockStringId(2);
      const mockChild = {
        ...getIOccupationMockData(2),
        _id: new mongoose.Types.ObjectId(givenOccupationId),
        id: givenOccupationId,
        modelId: givenModelId,
        occupationType: ObjectTypes.ESCOOccupation,
      };

      // AND a valid skill exists in the same model
      const givenSkillId = getMockStringId(3);
      const mockSkill = {
        ...getISkillMockData(3),
        _id: new mongoose.Types.ObjectId(givenSkillId),
        id: givenSkillId,
        modelId: givenModelId,
      };

      // AND the repository can successfully retrieve both
      occupationRepositoryMock.findById.mockResolvedValue(mockChild);
      skillRepositoryMock.findById.mockResolvedValue(mockSkill);

      // AND the relation repository will successfully create the relation
      relationRepositoryMock.createMany.mockResolvedValue([{}]);

      // WHEN the skill relation is added to the occupation
      const result = await service.addSkill(
        givenModelId,
        givenOccupationId,
        givenSkillId,
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect the newly populated skill to be returned
      expect(result.id).toEqual(givenSkillId);
      expect(result.relationType).toEqual(OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL);
      // AND expect the repository to have been called to create the new relation
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
      // GIVEN that a taxonomy model exists
      // AND a valid occupation exists in the model
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
        occupationType: ObjectTypes.ESCOOccupation,
      });
      // AND a valid skill exists in the model
      skillRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
      });
      // AND the relation database creation unexpectedly returns an empty result
      relationRepositoryMock.createMany.mockResolvedValue([]);

      // WHEN an attempt is made to link the skill to the occupation
      const actualResultPromise = service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect an error indicating the relation type is invalid or creation failed
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE)
      );
    });

    test("should throw DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION when createMany fails", async () => {
      // GIVEN that a taxonomy model exists
      // AND a valid occupation exists in the model
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
        occupationType: ObjectTypes.ESCOOccupation,
      });
      // AND a valid skill exists in the model
      skillRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
      });
      // AND the relation database throws an unexpected error during creation
      relationRepositoryMock.createMany.mockRejectedValue(new Error("Database write error"));

      // WHEN an attempt is made to link the skill to the occupation
      const actualResultPromise = service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect an error indicating the database failed to create the relation
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(
          SkillForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION
        )
      );
    });

    test("should throw OCCUPATION_NOT_FOUND when requiring occupation is not found", async () => {
      // GIVEN that a taxonomy model exists
      // AND the occupation cannot be found in the database
      occupationRepositoryMock.findById.mockResolvedValue(null);

      // WHEN an attempt is made to add the skill
      const actualResultPromise = service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect an error indicating the occupation was not found
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND)
      );
    });

    test("should throw OCCUPATION_NOT_FOUND when requiring occupation has wrong modelId", async () => {
      // GIVEN that a taxonomy model exists
      // AND an occupation exists but belongs to a different model
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(999),
        occupationType: ObjectTypes.ESCOOccupation,
      });

      // WHEN an attempt is made to add the skill under the initial model
      const actualResultPromise = service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect an error indicating the occupation was not found since the model IDs mismatched
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.OCCUPATION_NOT_FOUND)
      );
    });

    test("should throw SKILL_NOT_FOUND if skill is not found before relation creation", async () => {
      // GIVEN that a taxonomy model exists
      // AND a valid occupation exists in the model
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
        occupationType: ObjectTypes.ESCOOccupation,
      });
      // AND the relation creation would succeed
      relationRepositoryMock.createMany.mockResolvedValue([{}]);
      // AND the required skill cannot be found in the database
      skillRepositoryMock.findById.mockResolvedValue(null);

      // WHEN an attempt is made to link the skill to the occupation
      const actualResultPromise = service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect an error indicating the skill was not found
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    test("should throw SKILL_NOT_FOUND if skill has wrong modelId before relation creation", async () => {
      // GIVEN that a taxonomy model exists
      // AND a valid occupation exists in the model
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
        occupationType: ObjectTypes.ESCOOccupation,
      });
      // AND the relation creation would succeed
      relationRepositoryMock.createMany.mockResolvedValue([{}]);
      // AND a skill exists but belongs to a different model
      skillRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(999), // wrong modelId
      });

      // WHEN an attempt is made to link the skill to the occupation
      const actualResultPromise = service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect an error indicating the skill was not found due to a model ID mismatch
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    test("should throw INVALID_SIGNALLING_VALUE_LABEL if ESCOOccupation has signalling value", async () => {
      // GIVEN that a taxonomy model exists
      // AND an ESCO occupation exists
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
        occupationType: ObjectTypes.ESCOOccupation,
      });
      // AND a valid skill exists
      skillRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
      });

      // WHEN an attempt is made to link them with a signalling value
      const actualResultPromise = service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.HIGH,
        null
      );

      // THEN expect a validation error indicating invalid signalling value label
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_SIGNALLING_VALUE_LABEL)
      );
    });

    test("should throw INVALID_RELATION_TYPE if ESCOOccupation has relationType NONE", async () => {
      // GIVEN that a taxonomy model exists
      // AND an ESCO occupation exists
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
        occupationType: ObjectTypes.ESCOOccupation,
      });
      // AND a valid skill exists
      skillRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
      });

      // WHEN an attempt is made to link them with relation type NONE
      const actualResultPromise = service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationToSkillRelationType.NONE,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect a validation error indicating invalid relation type
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE)
      );
    });

    test("should throw MUTUALLY_EXCLUSIVE_VALUES if LocalOccupation has both relationType and signalling value", async () => {
      // GIVEN that a taxonomy model exists
      // AND a local occupation exists
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
        occupationType: ObjectTypes.LocalOccupation,
      });
      // AND a valid skill exists
      skillRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
      });

      // WHEN an attempt is made to link them with BOTH a relation type and a signalling value
      const actualResultPromise = service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.HIGH,
        null
      );

      // THEN expect an error indicating mutually exclusive values
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.MUTUALLY_EXCLUSIVE_VALUES)
      );
    });

    test("should throw INVALID_RELATION_TYPE if LocalOccupation has neither relationType nor signalling value", async () => {
      // GIVEN that a taxonomy model exists
      // AND a local occupation exists
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
        occupationType: ObjectTypes.LocalOccupation,
      });
      // AND a valid skill exists
      skillRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
      });

      // WHEN an attempt is made to link them without specifying either a relation type or a signalling value
      const actualResultPromise = service.addSkill(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationToSkillRelationType.NONE,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect a validation error indicating invalid relation type
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE)
      );
    });
  });

  describe("addOccupation", () => {
    test("should successfully add ESCO skill relationship", async () => {
      // GIVEN that a taxonomy model exists
      // AND a valid occupation exists in the model
      const mockOccupation = getIOccupationMockData();
      // AND a valid skill exists in the same model
      const mockSkill = getISkillMockData(1, mockOccupation.modelId);

      // AND the repository can successfully retrieve both
      occupationRepositoryMock.findById.mockResolvedValue(mockOccupation);
      skillRepositoryMock.findById.mockResolvedValue(mockSkill);
      // AND the relation repository will successfully create the relation
      relationRepositoryMock.createMany.mockResolvedValue([{}]);

      // WHEN the occupation relation is added to the skill
      const result = await service.addOccupation(
        mockOccupation.modelId,
        mockSkill.id,
        mockOccupation.id,
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect the newly populated occupation to be returned
      expect(result).toMatchObject({
        ...mockOccupation,
        relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
        signallingValueLabel: SignallingValueLabel.NONE,
        signallingValue: null,
      });

      // AND expect the repository to have been called to create the new relation
      expect(relationRepositoryMock.createMany).toHaveBeenCalledWith(mockOccupation.modelId, [
        {
          requiringOccupationId: mockOccupation.id,
          requiringOccupationType: mockOccupation.occupationType,
          requiredSkillId: mockSkill.id,
          relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
          signallingValueLabel: SignallingValueLabel.NONE,
          signallingValue: null,
        },
      ]);
    });

    test("should throw INVALID_RELATION_TYPE when createMany returns empty array", async () => {
      // GIVEN that a taxonomy model exists
      // AND a valid ESCO occupation exists
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
        occupationType: ObjectTypes.ESCOOccupation,
      });
      // AND a valid skill exists
      skillRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
      });
      // AND the relation database creation unexpectedly returns an empty result
      relationRepositoryMock.createMany.mockResolvedValue([]);

      // WHEN an attempt is made to link the occupation to the skill
      const actualResultPromise = service.addOccupation(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect an error indicating the relation type is invalid or creation failed
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(SkillForOccupationValidationErrorCode.INVALID_RELATION_TYPE)
      );
    });

    test("should throw DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION when createMany fails with non-validation error", async () => {
      // GIVEN that a taxonomy model exists
      // AND a valid ESCO occupation exists
      occupationRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
        occupationType: ObjectTypes.ESCOOccupation,
      });
      // AND a valid skill exists
      skillRepositoryMock.findById.mockResolvedValue({
        modelId: getMockStringId(1),
      });
      // AND the relation database throws an unexpected error during creation
      relationRepositoryMock.createMany.mockRejectedValue(new Error("Database error"));

      // WHEN an attempt is made to link the occupation to the skill
      const actualResultPromise = service.addOccupation(
        getMockStringId(1),
        getMockStringId(2),
        getMockStringId(3),
        OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL as unknown as OccupationToSkillRelationType,
        SignallingValueLabel.NONE,
        null
      );

      // THEN expect an error indicating the database failed to create the relation
      await expect(actualResultPromise).rejects.toThrow(
        new OccupationSkillValidationError(
          SkillForOccupationValidationErrorCode.DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION
        )
      );
    });
  });
});
