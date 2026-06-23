import { SkillToSkillRelationService } from "./skillToSkillRelation.service";
import {
  SkillToSkillRelationValidationErrorCode,
  SkillToSkillRelationValidationError,
} from "./skillToSkillRelation.service.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ISkill } from "esco/skill/_shared/skill.types";
import { getISkillMockData } from "esco/skill/_shared/testDataHelper";
import {
  INewSkillToSkillPairSpec,
  ISkillToSkillRelationPair,
  SkillToSkillRelationType,
} from "./skillToSkillRelation.types";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { ISkillToSkillRelationRepository } from "./skillToSkillRelationRepository";
import { MongooseModelName } from "esco/common/mongooseModelNames";

type MockSkillRepository = jest.Mocked<Pick<ISkillRepository, "findById">>;
type MockSkillToSkillRelationRepository = jest.Mocked<Pick<ISkillToSkillRelationRepository, "createMany">>;

describe("SkillToSkillRelationService", () => {
  let skillToSkillRelationService: SkillToSkillRelationService;
  let mockSkillRepository: MockSkillRepository;
  let mockSkillToSkillRelationRepository: MockSkillToSkillRelationRepository;

  beforeEach(() => {
    mockSkillRepository = {
      findById: jest.fn(),
    };
    mockSkillToSkillRelationRepository = {
      createMany: jest.fn(),
    };

    skillToSkillRelationService = new SkillToSkillRelationService(
      mockSkillRepository as unknown as ISkillRepository,
      mockSkillToSkillRelationRepository as unknown as ISkillToSkillRelationRepository
    );
  });

  describe("addRelatedSkill", () => {
    test("should successfully add a related skill", async () => {
      // GIVEN that a taxonomy model exists
      const givenModelId = getMockStringId(1);
      // AND a valid requiring skill exists in the model
      const givenRequiringSkillId = getMockStringId(2);
      const givenMockRequiringSkill = getISkillMockData(1) as ISkill;
      givenMockRequiringSkill.id = givenRequiringSkillId;
      givenMockRequiringSkill.modelId = givenModelId;

      // AND a valid required skill exists in the same model
      const givenRequiredSkillId = getMockStringId(3);
      const givenMockRequiredSkill = getISkillMockData(2) as ISkill;
      givenMockRequiredSkill.id = givenRequiredSkillId;
      givenMockRequiredSkill.modelId = givenModelId;

      // AND they are to be linked with an essential relation type
      const givenRelationType = SkillToSkillRelationType.ESSENTIAL;

      // AND the repository can successfully retrieve both skills
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === givenRequiringSkillId) return Promise.resolve(givenMockRequiringSkill);
        if (id === givenRequiredSkillId) return Promise.resolve(givenMockRequiredSkill);
        return Promise.resolve(null);
      });

      // AND the relation repository will successfully create the relation
      mockSkillToSkillRelationRepository.createMany.mockResolvedValue([
        {
          id: getMockStringId(10),
          modelId: givenModelId,
          requiringSkillId: givenRequiringSkillId,
          requiringSkillDocModel: MongooseModelName.Skill,
          requiredSkillId: givenRequiredSkillId,
          requiredSkillDocModel: MongooseModelName.Skill,
          relationType: givenRelationType,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ISkillToSkillRelationPair,
      ]);

      // WHEN the relation is added between the two skills
      const actualResult = await skillToSkillRelationService.addRelatedSkill(
        givenModelId,
        givenRequiringSkillId,
        givenRequiredSkillId,
        givenRelationType
      );

      // THEN expect the newly populated related skill to be returned
      expect(actualResult).toEqual({ ...givenMockRequiredSkill, relationType: givenRelationType });
      // AND expect the repository to have been called to create the new relation
      expect(mockSkillToSkillRelationRepository.createMany).toHaveBeenCalledWith(givenModelId, [
        {
          requiringSkillId: givenRequiringSkillId,
          requiredSkillId: givenRequiredSkillId,
          relationType: givenRelationType,
        } as INewSkillToSkillPairSpec,
      ]);
    });

    test("should throw SKILL_NOT_FOUND if requiring skill does not exist", async () => {
      // GIVEN that a taxonomy model exists
      const givenModelId = getMockStringId(1);
      // AND an ID for a requiring skill
      const givenRequiringSkillId = getMockStringId(2);
      // AND an ID for a required skill
      const givenRequiredSkillId = getMockStringId(3);
      // AND a specified relation type
      const givenRelationType = SkillToSkillRelationType.OPTIONAL;

      // AND the requiring skill cannot be found in the database
      mockSkillRepository.findById.mockResolvedValue(null);

      // WHEN an attempt is made to add the related skill
      const actualResultPromise = skillToSkillRelationService.addRelatedSkill(
        givenModelId,
        givenRequiringSkillId,
        givenRequiredSkillId,
        givenRelationType
      );

      // THEN expect an error indicating the skill was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    test("should throw RELATED_SKILL_NOT_FOUND if required skill does not exist", async () => {
      // GIVEN that a taxonomy model exists
      const givenModelId = getMockStringId(1);
      // AND a valid requiring skill exists
      const givenRequiringSkillId = getMockStringId(2);
      const givenMockRequiringSkill = getISkillMockData(1) as ISkill;
      givenMockRequiringSkill.id = givenRequiringSkillId;
      givenMockRequiringSkill.modelId = givenModelId;

      // AND an ID for a required skill is provided
      const givenRequiredSkillId = getMockStringId(3);
      // AND an essential relation type
      const givenRelationType = SkillToSkillRelationType.ESSENTIAL;

      // AND the database returns the requiring skill but fails to find the required skill
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === givenRequiringSkillId) return Promise.resolve(givenMockRequiringSkill);
        return Promise.resolve(null);
      });

      // WHEN an attempt is made to link the skills
      const actualResultPromise = skillToSkillRelationService.addRelatedSkill(
        givenModelId,
        givenRequiringSkillId,
        givenRequiredSkillId,
        givenRelationType
      );

      // THEN expect an error indicating the related skill was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATED_SKILL_NOT_FOUND)
      );
    });

    test("should throw SKILL_NOT_FOUND if requiring skill modelId does not match", async () => {
      // GIVEN that a taxonomy model exists
      const givenModelId = getMockStringId(1);
      // AND a requiring skill belongs to a different model
      const givenRequiringSkillId = getMockStringId(2);
      const givenMockRequiringSkill = getISkillMockData(1) as ISkill;
      givenMockRequiringSkill.id = givenRequiringSkillId;
      givenMockRequiringSkill.modelId = getMockStringId(4);

      // AND a required skill ID is provided
      const givenRequiredSkillId = getMockStringId(3);
      // AND an essential relation type
      const givenRelationType = SkillToSkillRelationType.ESSENTIAL;

      // AND the database successfully retrieves the requiring skill
      mockSkillRepository.findById.mockResolvedValue(givenMockRequiringSkill);

      // WHEN an attempt is made to link the skills under the initial model
      const actualResultPromise = skillToSkillRelationService.addRelatedSkill(
        givenModelId,
        givenRequiringSkillId,
        givenRequiredSkillId,
        givenRelationType
      );

      // THEN expect an error indicating the skill was not found since the model IDs mismatched
      await expect(actualResultPromise).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    test("should throw RELATED_SKILL_NOT_FOUND if required skill modelId does not match", async () => {
      // GIVEN that a taxonomy model exists
      const givenModelId = getMockStringId(1);

      // AND a valid requiring skill exists in the model
      const givenRequiringSkillId = getMockStringId(2);
      const givenMockRequiringSkill = getISkillMockData(1) as ISkill;
      givenMockRequiringSkill.id = givenRequiringSkillId;
      givenMockRequiringSkill.modelId = givenModelId;

      // AND a required skill exists but belongs to a different model
      const givenRequiredSkillId = getMockStringId(3);
      const givenMockRequiredSkill = getISkillMockData(2) as ISkill;
      givenMockRequiredSkill.id = givenRequiredSkillId;
      givenMockRequiredSkill.modelId = getMockStringId(4);

      // AND an essential relation type
      const givenRelationType = SkillToSkillRelationType.ESSENTIAL;

      // AND the database retrieves both skills
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === givenRequiringSkillId) return Promise.resolve(givenMockRequiringSkill);
        if (id === givenRequiredSkillId) return Promise.resolve(givenMockRequiredSkill);
        return Promise.resolve(null);
      });

      // WHEN an attempt is made to link the skills under the initial model
      const actualResultPromise = skillToSkillRelationService.addRelatedSkill(
        givenModelId,
        givenRequiringSkillId,
        givenRequiredSkillId,
        givenRelationType
      );

      // THEN expect an error indicating the related skill was not found due to a model ID mismatch
      await expect(actualResultPromise).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATED_SKILL_NOT_FOUND)
      );
    });

    test("should throw RELATION_CODE_INCONSISTENT if createMany returns empty", async () => {
      // GIVEN that a taxonomy model exists
      const givenModelId = getMockStringId(1);

      // AND a valid requiring skill exists in the model
      const givenRequiringSkillId = getMockStringId(2);
      const givenMockRequiringSkill = getISkillMockData(1) as ISkill;
      givenMockRequiringSkill.id = givenRequiringSkillId;
      givenMockRequiringSkill.modelId = givenModelId;

      // AND a valid required skill exists in the model
      const givenRequiredSkillId = getMockStringId(3);
      const givenMockRequiredSkill = getISkillMockData(2) as ISkill;
      givenMockRequiredSkill.id = givenRequiredSkillId;
      givenMockRequiredSkill.modelId = givenModelId;

      // AND an essential relation type
      const givenRelationType = SkillToSkillRelationType.ESSENTIAL;

      // AND the database successfully retrieves both skills
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === givenRequiringSkillId) return Promise.resolve(givenMockRequiringSkill);
        if (id === givenRequiredSkillId) return Promise.resolve(givenMockRequiredSkill);
        return Promise.resolve(null);
      });

      // AND the relation database creation unexpectedly returns an empty result
      mockSkillToSkillRelationRepository.createMany.mockResolvedValue([]);

      // WHEN an attempt is made to link the skills
      const actualResultPromise = skillToSkillRelationService.addRelatedSkill(
        givenModelId,
        givenRequiringSkillId,
        givenRequiredSkillId,
        givenRelationType
      );

      // THEN expect an error indicating the relation code is inconsistent
      await expect(actualResultPromise).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATION_CODE_INCONSISTENT)
      );
    });

    test("should throw DB_FAILED_TO_CREATE_RELATION if repository throws unknown error", async () => {
      // GIVEN that a taxonomy model exists
      const givenModelId = getMockStringId(1);

      // AND a valid requiring skill exists in the model
      const givenRequiringSkillId = getMockStringId(2);
      const givenMockRequiringSkill = getISkillMockData(1) as ISkill;
      givenMockRequiringSkill.id = givenRequiringSkillId;
      givenMockRequiringSkill.modelId = givenModelId;

      // AND a valid required skill exists in the model
      const givenRequiredSkillId = getMockStringId(3);
      const givenMockRequiredSkill = getISkillMockData(2) as ISkill;
      givenMockRequiredSkill.id = givenRequiredSkillId;
      givenMockRequiredSkill.modelId = givenModelId;

      // AND an essential relation type
      const givenRelationType = SkillToSkillRelationType.ESSENTIAL;

      // AND the database successfully retrieves both skills
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === givenRequiringSkillId) return Promise.resolve(givenMockRequiringSkill);
        if (id === givenRequiredSkillId) return Promise.resolve(givenMockRequiredSkill);
        return Promise.resolve(null);
      });

      // AND the relation database throws an unexpected error during creation
      mockSkillToSkillRelationRepository.createMany.mockRejectedValue(new Error("DB Error"));

      // WHEN an attempt is made to link the skills
      const actualResultPromise = skillToSkillRelationService.addRelatedSkill(
        givenModelId,
        givenRequiringSkillId,
        givenRequiredSkillId,
        givenRelationType
      );

      // THEN expect an error indicating the database failed to create the relation
      await expect(actualResultPromise).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.DB_FAILED_TO_CREATE_RELATION)
      );
    });

    test("should throw DB_FAILED_TO_CREATE_RELATION if findById throws unknown error", async () => {
      // GIVEN that a taxonomy model exists
      const givenModelId = getMockStringId(1);
      // AND an ID for a requiring skill
      const givenRequiringSkillId = getMockStringId(2);
      // AND an ID for a required skill
      const givenRequiredSkillId = getMockStringId(3);
      // AND an essential relation type
      const givenRelationType = SkillToSkillRelationType.ESSENTIAL;

      // AND the database throws an unexpected error while retrieving a skill
      mockSkillRepository.findById.mockRejectedValue(new Error("DB Error"));

      // WHEN an attempt is made to link the skills
      const actualResultPromise = skillToSkillRelationService.addRelatedSkill(
        givenModelId,
        givenRequiringSkillId,
        givenRequiredSkillId,
        givenRelationType
      );

      // THEN expect an error indicating the database failed to create the relation
      await expect(actualResultPromise).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.DB_FAILED_TO_CREATE_RELATION)
      );
    });
  });
});
