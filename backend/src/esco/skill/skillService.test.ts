import { SkillService } from "./skillService";
import { ISkillService } from "./skillService.type";
import { ISkill, ModelForSkillValidationErrorCode } from "./skills.types";
import { ISkillRepository } from "./skillRepository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getISkillMockData } from "./testDataHelper";
import { IModelInfo } from "modelInfo/modelInfo.types";
import mongoose from "mongoose";
import { IModelRepository } from "modelInfo/modelInfoRepository";

describe("Test the SkillService", () => {
  let service: ISkillService;
  let mockRepository: jest.Mocked<ISkillRepository>;
  let mockModelRepository: jest.Mocked<IModelRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = {
      Model: {} as unknown as mongoose.Model<unknown>,
      create: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findPaginated: jest.fn(),
    } as unknown as jest.Mocked<ISkillRepository>;

    mockModelRepository = {
      getModelById: jest.fn(),
    } as unknown as jest.Mocked<IModelRepository>;

    service = new SkillService(mockRepository, mockModelRepository);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("findById", () => {
    test("should call repository.findById with the given id", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);
      // AND the repository returns a skill
      const expectedSkill: ISkill = getISkillMockData();
      expectedSkill.id = givenId;

      mockRepository.findById.mockResolvedValue(expectedSkill);

      // WHEN calling service.findById
      const actual = await service.findById(givenId);

      // THEN expect repository.findById to have been called with the id
      expect(mockRepository.findById).toHaveBeenCalledWith(givenId);

      // AND expect the returned skill
      expect(actual).toEqual(expectedSkill);
    });

    test("should return null if repository.findById returns null", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);

      // AND the repository returns null
      mockRepository.findById.mockResolvedValue(null);

      // WHEN calling service.findById
      const actual = await service.findById(givenId);

      // THEN expect repository.findById to have been called with the id
      expect(mockRepository.findById).toHaveBeenCalledWith(givenId);

      // AND expect null to be returned
      expect(actual).toBeNull();
    });

    test("should throw if repository.findById throws", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);

      // AND the repository.findById throws an error
      const givenError = new Error("Repository error");
      mockRepository.findById.mockRejectedValue(givenError);

      // WHEN calling service.findById
      const promise = service.findById(givenId);

      // THEN expect it to throw the same error
      await expect(promise).rejects.toThrow(givenError);
    });
  });

  describe("findPaginated", () => {
    test("should call repository.findPaginated with the given parameters and return paginated results", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = true;
      // AND the repository returns (limit + 1 to check for next page)
      const mockItems = Array.from({ length: 11 }, (_, i) => {
        const skill = getISkillMockData();
        skill.id = getMockStringId(i + 2);
        skill.modelId = givenModelId;
        skill.createdAt = new Date("2023-01-01T00:00:00.000Z");
        return skill;
      });
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        { id: getMockStringId(10), createdAt: new Date("2023-01-01T00:00:00.000Z") },
        givenLimit,
        givenDesc
      );

      // THEN expect repository.findPaginated to have been called with the given parameters
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, getMockStringId(10));
      // AND expect the returned paginated result
      expect(actual.items).toHaveLength(10);
      expect(actual.nextCursor).toEqual({ _id: mockItems[9].id, createdAt: mockItems[9].createdAt });
    });

    test("should decode cursor and call repository.findPaginated with decoded cursor sort", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = true;
      // AND the repository returns (limit + 1 to check for next page)
      const mockItems = Array.from({ length: 6 }, (_, i) => {
        const skill = getISkillMockData();
        skill.id = getMockStringId(i + 2);
        skill.modelId = givenModelId;
        skill.createdAt = new Date("2023-01-01T00:00:00.000Z");
        return skill;
      });

      mockRepository.findPaginated.mockResolvedValue(mockItems);
      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        {
          id: getMockStringId(10),
          createdAt: new Date("2023-01-01T00:00:00.000Z"),
        },
        givenLimit,
        givenDesc
      );

      // AND expect repository.findPaginated to have been called with the decoded cursor sort
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, getMockStringId(10));
      //AND expect the returned paginated result
      expect(actual.items).toHaveLength(6);
      expect(actual.nextCursor).toBeNull();
    });

    test("should handle ascending sort order", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = false;

      // AND the repository returns mocked items
      const mockItems = Array.from({ length: 5 }, (_, i) => {
        const skill = getISkillMockData();
        skill.id = getMockStringId(i + 2);
        skill.modelId = givenModelId;
        return skill;
      });
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated with desc=false
      const actual = await service.findPaginated(givenModelId, undefined, givenLimit, givenDesc);

      // THEN expect repository.findPaginated to have been called with the ascending sort
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, undefined);
      // AND expect the returned result
      expect(actual.items).toHaveLength(5);
    });

    test("should handle ascending sort order with cursor", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = false;
      const givenCursor = { id: getMockStringId(10), createdAt: new Date() };

      mockRepository.findPaginated.mockResolvedValue([]);

      // WHEN calling service.findPaginated with desc=false and cursor
      await service.findPaginated(givenModelId, givenCursor, givenLimit, givenDesc);

      // THEN expect repository.findPaginated to have been called with the ascending sort and correct cursor
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, givenCursor.id);
    });

    test("should return null nextCursor when no more items", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;

      // AND the repository returns less than limit number of items
      const mockItems = Array.from({ length: 10 }, (_, i) => {
        const skill = getISkillMockData();
        skill.id = getMockStringId(i + 2);
        skill.modelId = givenModelId;
        return skill;
      });
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(givenModelId, undefined, givenLimit);

      // THEN expect nextCursor to be null
      expect(actual.nextCursor).toBeNull();
    });

    test("should throw if repository.findPaginated throws", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      // AND the repository.findPaginated throws an error
      const givenError = new Error("Repository error");
      mockRepository.findPaginated.mockRejectedValue(givenError);

      // WHEN calling service.findPaginated
      const promise = service.findPaginated(givenModelId, undefined, givenLimit);

      // THEN expect it to throw the same error
      await expect(promise).rejects.toThrow(givenError);
    });
  });

  describe("validateModelForSkill", () => {
    test("should return null when model exists and is not released", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      // AND the model exists and is not released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenModelId,
        released: false,
      } as unknown as IModelInfo);

      // WHEN calling service.validateModelForSkill
      const actual = await service.validateModelForSkill(givenModelId);

      // THEN expect it to return null
      expect(actual).toEqual(null);
      // AND expect the modelRepository to have been called
      expect(mockModelRepository.getModelById).toHaveBeenCalledWith(givenModelId);
    });

    test("should return MODEL_NOT_FOUND_BY_ID when model does not exist", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      // AND the model does not exist
      mockModelRepository.getModelById.mockResolvedValue(null);

      // WHEN calling service.validateModelForSkill
      const actual = await service.validateModelForSkill(givenModelId);

      // THEN expect it to return MODEL_NOT_FOUND_BY_ID
      expect(actual).toEqual(ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID);
    });

    test("should return MODEL_IS_RELEASED when model is released", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      // AND the model exists but is released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenModelId,
        released: true,
      } as unknown as IModelInfo);

      // WHEN calling service.validateModelForSkill
      const actual = await service.validateModelForSkill(givenModelId);

      // THEN expect it to return MODEL_IS_RELEASED
      expect(actual).toEqual(ModelForSkillValidationErrorCode.MODEL_IS_RELEASED);
    });

    test("should return FAILED_TO_FETCH_FROM_DB when getModelById throws", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      // AND getModelById throws an error
      const givenError = new Error("Database error");
      mockModelRepository.getModelById.mockRejectedValue(givenError);

      // AND console.error is mocked
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // WHEN calling service.validateModelForSkill
      const actual = await service.validateModelForSkill(givenModelId);

      // THEN expect it to return FAILED_TO_FETCH_FROM_DB
      expect(actual).toEqual(ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error validating model for skill:", givenError);

      consoleErrorSpy.mockRestore();
    });
  });
});
