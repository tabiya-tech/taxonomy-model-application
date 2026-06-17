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
    it("should successfully add a related skill", async () => {
      const modelId = getMockStringId(1);
      const requiringSkillId = getMockStringId(2);
      const requiredSkillId = getMockStringId(3);
      const relationType = SkillToSkillRelationType.ESSENTIAL;

      const mockRequiringSkill = getISkillMockData(1) as ISkill;
      mockRequiringSkill.id = requiringSkillId;
      mockRequiringSkill.modelId = modelId;

      const mockRequiredSkill = getISkillMockData(2) as ISkill;
      mockRequiredSkill.id = requiredSkillId;
      mockRequiredSkill.modelId = modelId;

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === requiringSkillId) return Promise.resolve(mockRequiringSkill);
        if (id === requiredSkillId) return Promise.resolve(mockRequiredSkill);
        return Promise.resolve(null);
      });

      mockSkillToSkillRelationRepository.createMany.mockResolvedValue([
        {
          id: getMockStringId(10),
          modelId,
          requiringSkillId,
          requiringSkillDocModel: MongooseModelName.Skill,
          requiredSkillId,
          requiredSkillDocModel: MongooseModelName.Skill,
          relationType,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ISkillToSkillRelationPair,
      ]);

      const result = await skillToSkillRelationService.addRelatedSkill(
        modelId,
        requiringSkillId,
        requiredSkillId,
        relationType
      );

      expect(result).toEqual({ ...mockRequiredSkill, relationType });
      expect(mockSkillToSkillRelationRepository.createMany).toHaveBeenCalledWith(modelId, [
        {
          requiringSkillId,
          requiredSkillId,
          relationType,
        } as INewSkillToSkillPairSpec,
      ]);
    });

    it("should throw RELATION_TYPE_NOT_SUPPORTED if relationType is invalid", async () => {
      const modelId = getMockStringId(1);
      const requiringSkillId = getMockStringId(2);
      const requiredSkillId = getMockStringId(3);
      const relationType = "invalid";

      await expect(
        skillToSkillRelationService.addRelatedSkill(modelId, requiringSkillId, requiredSkillId, relationType)
      ).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATION_TYPE_NOT_SUPPORTED)
      );
    });

    it("should throw SKILL_NOT_FOUND if requiring skill does not exist", async () => {
      const modelId = getMockStringId(1);
      const requiringSkillId = getMockStringId(2);
      const requiredSkillId = getMockStringId(3);
      const relationType = SkillToSkillRelationType.OPTIONAL;

      mockSkillRepository.findById.mockResolvedValue(null);

      await expect(
        skillToSkillRelationService.addRelatedSkill(modelId, requiringSkillId, requiredSkillId, relationType)
      ).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    it("should throw RELATED_SKILL_NOT_FOUND if required skill does not exist", async () => {
      const modelId = getMockStringId(1);
      const requiringSkillId = getMockStringId(2);
      const requiredSkillId = getMockStringId(3);
      const relationType = SkillToSkillRelationType.ESSENTIAL;

      const mockRequiringSkill = getISkillMockData(1) as ISkill;
      mockRequiringSkill.id = requiringSkillId;
      mockRequiringSkill.modelId = modelId;

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === requiringSkillId) return Promise.resolve(mockRequiringSkill);
        return Promise.resolve(null);
      });

      await expect(
        skillToSkillRelationService.addRelatedSkill(modelId, requiringSkillId, requiredSkillId, relationType)
      ).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATED_SKILL_NOT_FOUND)
      );
    });

    it("should throw SKILL_NOT_FOUND if requiring skill modelId does not match", async () => {
      const modelId = getMockStringId(1);
      const requiringSkillId = getMockStringId(2);
      const requiredSkillId = getMockStringId(3);
      const relationType = SkillToSkillRelationType.ESSENTIAL;

      const mockRequiringSkill = getISkillMockData(1) as ISkill;
      mockRequiringSkill.id = requiringSkillId;
      mockRequiringSkill.modelId = getMockStringId(4); // different modelId

      mockSkillRepository.findById.mockResolvedValue(mockRequiringSkill);

      await expect(
        skillToSkillRelationService.addRelatedSkill(modelId, requiringSkillId, requiredSkillId, relationType)
      ).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    it("should throw RELATED_SKILL_NOT_FOUND if required skill modelId does not match", async () => {
      const modelId = getMockStringId(1);
      const requiringSkillId = getMockStringId(2);
      const requiredSkillId = getMockStringId(3);
      const relationType = SkillToSkillRelationType.ESSENTIAL;

      const mockRequiringSkill = getISkillMockData(1) as ISkill;
      mockRequiringSkill.id = requiringSkillId;
      mockRequiringSkill.modelId = modelId;

      const mockRequiredSkill = getISkillMockData(2) as ISkill;
      mockRequiredSkill.id = requiredSkillId;
      mockRequiredSkill.modelId = getMockStringId(4); // different modelId

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === requiringSkillId) return Promise.resolve(mockRequiringSkill);
        if (id === requiredSkillId) return Promise.resolve(mockRequiredSkill);
        return Promise.resolve(null);
      });

      await expect(
        skillToSkillRelationService.addRelatedSkill(modelId, requiringSkillId, requiredSkillId, relationType)
      ).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATED_SKILL_NOT_FOUND)
      );
    });

    it("should throw RELATION_CODE_INCONSISTENT if createMany returns empty", async () => {
      const modelId = getMockStringId(1);
      const requiringSkillId = getMockStringId(2);
      const requiredSkillId = getMockStringId(3);
      const relationType = SkillToSkillRelationType.ESSENTIAL;

      const mockRequiringSkill = getISkillMockData(1) as ISkill;
      mockRequiringSkill.id = requiringSkillId;
      mockRequiringSkill.modelId = modelId;

      const mockRequiredSkill = getISkillMockData(2) as ISkill;
      mockRequiredSkill.id = requiredSkillId;
      mockRequiredSkill.modelId = modelId;

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === requiringSkillId) return Promise.resolve(mockRequiringSkill);
        if (id === requiredSkillId) return Promise.resolve(mockRequiredSkill);
        return Promise.resolve(null);
      });

      mockSkillToSkillRelationRepository.createMany.mockResolvedValue([]);

      await expect(
        skillToSkillRelationService.addRelatedSkill(modelId, requiringSkillId, requiredSkillId, relationType)
      ).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.RELATION_CODE_INCONSISTENT)
      );
    });

    it("should throw DB_FAILED_TO_CREATE_RELATION if repository throws unknown error", async () => {
      const modelId = getMockStringId(1);
      const requiringSkillId = getMockStringId(2);
      const requiredSkillId = getMockStringId(3);
      const relationType = SkillToSkillRelationType.ESSENTIAL;

      const mockRequiringSkill = getISkillMockData(1) as ISkill;
      mockRequiringSkill.id = requiringSkillId;
      mockRequiringSkill.modelId = modelId;

      const mockRequiredSkill = getISkillMockData(2) as ISkill;
      mockRequiredSkill.id = requiredSkillId;
      mockRequiredSkill.modelId = modelId;

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === requiringSkillId) return Promise.resolve(mockRequiringSkill);
        if (id === requiredSkillId) return Promise.resolve(mockRequiredSkill);
        return Promise.resolve(null);
      });

      mockSkillToSkillRelationRepository.createMany.mockRejectedValue(new Error("DB Error"));

      await expect(
        skillToSkillRelationService.addRelatedSkill(modelId, requiringSkillId, requiredSkillId, relationType)
      ).rejects.toThrow(
        new SkillToSkillRelationValidationError(SkillToSkillRelationValidationErrorCode.DB_FAILED_TO_CREATE_RELATION)
      );
    });
  });
});
