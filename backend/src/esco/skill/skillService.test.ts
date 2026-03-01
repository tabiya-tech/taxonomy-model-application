import { SkillService } from "./skillService";
import { ISkillService } from "./skillService.type";
import { ISkill, ModelForSkillValidationErrorCode } from "./skills.types";
import { ISkillRepository } from "./skillRepository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getISkillMockData } from "./testDataHelper";
import { IModelInfo } from "modelInfo/modelInfo.types";
import mongoose from "mongoose";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";

interface ITestingSkillService {
  findPaginatedRelation<T>(
    fetchFn: () => Promise<T[]>,
    limit: number
  ): Promise<{ items: T[]; nextCursor: { _id: string; createdAt: Date } | null }>;
}

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
      findParents: jest.fn(),
      findChildren: jest.fn(),
      findOccupationsForSkill: jest.fn(),
      findRelatedSkills: jest.fn(),
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
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, {
        id: getMockStringId(10),
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
      });
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
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, {
        id: getMockStringId(10),
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
      });
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
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, givenCursor);
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

  describe("getParents", () => {
    test("should call repository.findParents and return results", async () => {
      // GIVEN modelId and skillId
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      // AND repository returns parents
      const expectedParents = [getISkillMockData()];
      mockRepository.findParents.mockResolvedValue(expectedParents);

      // WHEN calling service.getParents
      const actual = await service.getParents(givenModelId, givenSkillId, 100);

      expect(mockRepository.findParents).toHaveBeenCalledWith(givenModelId, givenSkillId, 101, undefined);
      expect(actual).toEqual({ items: expectedParents, nextCursor: null });
    });

    test("should return empty array when no parents", async () => {
      mockRepository.findParents.mockResolvedValue([]);

      const actual = await service.getParents(getMockStringId(1), getMockStringId(2), 100);

      expect(actual).toEqual({ items: [], nextCursor: null });
    });

    test("should return nextCursor when there are more parents", async () => {
      // GIVEN modelId and skillId
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      // AND repository returns more items than limit
      const expectedParents = [
        { ...getISkillMockData(), id: getMockStringId(1), createdAt: new Date() },
        { ...getISkillMockData(), id: getMockStringId(2), createdAt: new Date() },
        { ...getISkillMockData(), id: getMockStringId(3), createdAt: new Date() },
      ];
      mockRepository.findParents.mockResolvedValue(expectedParents);

      // WHEN calling service.getParents
      const actual = await service.getParents(givenModelId, givenSkillId, 2);

      expect(mockRepository.findParents).toHaveBeenCalledWith(givenModelId, givenSkillId, 3, undefined);
      expect(actual.items).toHaveLength(2);
      expect(actual.nextCursor).toEqual({ _id: getMockStringId(2), createdAt: expectedParents[1].createdAt });
    });
  });

  describe("getChildren", () => {
    test("should call repository.findChildren and return results", async () => {
      // GIVEN modelId and skillId
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      // AND repository returns children
      const expectedChildren = [getISkillMockData()];
      mockRepository.findChildren.mockResolvedValue(expectedChildren);

      // WHEN calling service.getChildren
      const actual = await service.getChildren(givenModelId, givenSkillId, 100);

      // THEN expect repository.findChildren to have been called with correct parameters
      expect(mockRepository.findChildren).toHaveBeenCalledWith(givenModelId, givenSkillId, 101, undefined);
      // AND expect returned children
      expect(actual).toEqual({ items: expectedChildren, nextCursor: null });
    });

    test("should return nextCursor when there are more children", async () => {
      // GIVEN modelId and skillId
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenLimit = 1;
      // AND repository returns more items than limit
      const expectedChildren = [
        { ...getISkillMockData(), id: getMockStringId(3), createdAt: new Date("2023-01-01T00:00:00.000Z") },
        { ...getISkillMockData(), id: getMockStringId(4), createdAt: new Date("2023-01-01T00:00:00.000Z") },
      ];
      mockRepository.findChildren.mockResolvedValue(expectedChildren);

      // WHEN calling service.getChildren
      const actual = await service.getChildren(givenModelId, givenSkillId, givenLimit);

      // THEN expect returned children with nextCursor
      expect(actual.items).toHaveLength(1);
      expect(actual.nextCursor).toEqual({ _id: getMockStringId(3), createdAt: expectedChildren[0].createdAt });
    });
  });

  describe("getOccupations", () => {
    test("should call repository.findOccupationsForSkill and return results", async () => {
      // GIVEN modelId and skillId
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      // AND repository returns occupations
      const expectedOccupations = [{ id: getMockStringId(3) }];
      mockRepository.findOccupationsForSkill.mockResolvedValue(
        expectedOccupations as unknown as OccupationToSkillReferenceWithRelationType<IOccupationReference>[]
      );

      // WHEN calling service.getOccupations
      const actual = await service.getOccupations(givenModelId, givenSkillId, 100);

      // THEN expect repository.findOccupationsForSkill to have been called with correct parameters
      expect(mockRepository.findOccupationsForSkill).toHaveBeenCalledWith(givenModelId, givenSkillId, 101, undefined);
      // AND expect returned occupations
      expect(actual).toEqual({ items: expectedOccupations, nextCursor: null });
    });

    test("should return nextCursor when there are more occupations", async () => {
      // GIVEN modelId and skillId
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenLimit = 1;
      // AND repository returns more items than limit
      const expectedOccupations = [
        { id: getMockStringId(3), createdAt: new Date("2023-01-01T00:00:00.000Z") },
        { id: getMockStringId(4), createdAt: new Date("2023-01-01T00:00:00.000Z") },
      ];
      mockRepository.findOccupationsForSkill.mockResolvedValue(
        expectedOccupations as unknown as OccupationToSkillReferenceWithRelationType<IOccupationReference>[]
      );

      // WHEN calling service.getOccupations
      const actual = await service.getOccupations(givenModelId, givenSkillId, givenLimit);

      // THEN expect returned occupations with nextCursor
      expect(actual.items).toHaveLength(1);
      expect(actual.nextCursor).toEqual({ _id: getMockStringId(3), createdAt: expectedOccupations[0].createdAt });
    });
  });

  describe("getRelatedSkills", () => {
    test("should call repository.findRelatedSkills and return results", async () => {
      // GIVEN modelId and skillId
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      // AND repository returns related skills
      const expectedRelatedSkills = [{ id: getMockStringId(3) }];
      mockRepository.findRelatedSkills.mockResolvedValue(
        expectedRelatedSkills as unknown as SkillToSkillReferenceWithRelationType<ISkill>[]
      );

      // WHEN calling service.getRelatedSkills
      const actual = await service.getRelatedSkills(givenModelId, givenSkillId, 100);

      // THEN expect repository.findRelatedSkills to have been called with correct parameters
      expect(mockRepository.findRelatedSkills).toHaveBeenCalledWith(givenModelId, givenSkillId, 101, undefined);
      // AND expect returned related skills
      expect(actual).toEqual({ items: expectedRelatedSkills, nextCursor: null });
    });

    test("should return nextCursor when there are more related skills", async () => {
      // GIVEN modelId and skillId
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenLimit = 1;
      // AND repository returns more items than limit
      const expectedRelatedSkills = [
        {
          id: getMockStringId(3),
          createdAt: new Date("2023-01-01T00:00:00.000Z"),
          relationId: getMockStringId(3),
        },
        {
          id: getMockStringId(4),
          createdAt: new Date("2023-01-01T00:00:00.000Z"),
        },
      ];
      mockRepository.findRelatedSkills.mockResolvedValue(
        expectedRelatedSkills as unknown as SkillToSkillReferenceWithRelationType<ISkill>[]
      );

      // WHEN calling service.getRelatedSkills
      const actual = await service.getRelatedSkills(givenModelId, givenSkillId, givenLimit);

      expect(actual.items).toHaveLength(1);
      expect(actual.nextCursor).toEqual({ _id: getMockStringId(3), createdAt: expectedRelatedSkills[0].createdAt });
    });

    test("should use current date as cursor createdAt when last item has relationId but no createdAt", async () => {
      // GIVEN more items than the limit, last item has relationId but no createdAt
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenLimit = 1;
      const expectedRelatedSkills = [
        {
          id: getMockStringId(3),
          relationId: getMockStringId(9),
          // no createdAt
        },
        {
          id: getMockStringId(4),
        },
      ];
      mockRepository.findRelatedSkills.mockResolvedValue(
        expectedRelatedSkills as unknown as SkillToSkillReferenceWithRelationType<ISkill>[]
      );

      // WHEN calling service.getRelatedSkills
      const givenBefore = new Date();
      const actual = await service.getRelatedSkills(givenModelId, givenSkillId, givenLimit);

      // THEN expect nextCursor to use the relationId and fallback to current date for createdAt
      expect(actual.items).toHaveLength(1);
      expect(actual.nextCursor).not.toBeNull();
      expect(actual.nextCursor!._id).toBe(getMockStringId(9));
      expect(actual.nextCursor!.createdAt).toBeInstanceOf(Date);
      expect(actual.nextCursor!.createdAt.getTime()).toBeGreaterThanOrEqual(givenBefore.getTime());
    });

    test("should return null nextCursor when there are more items but last item has no relationId", async () => {
      // GIVEN more items than the limit, but without a relationId on the last item
      const givenModelId = getMockStringId(1);
      const givenSkillId = getMockStringId(2);
      const givenLimit = 1;
      const expectedRelatedSkills = [
        {
          id: getMockStringId(3),
          createdAt: new Date("2023-01-01T00:00:00.000Z"),
          // no relationId
        },
        {
          id: getMockStringId(4),
        },
      ];
      mockRepository.findRelatedSkills.mockResolvedValue(
        expectedRelatedSkills as unknown as SkillToSkillReferenceWithRelationType<ISkill>[]
      );

      // WHEN calling service.getRelatedSkills
      const actual = await service.getRelatedSkills(givenModelId, givenSkillId, givenLimit);

      // THEN expect items to be sliced but nextCursor to be null (no relationId to use as cursor)
      expect(actual.items).toHaveLength(1);
      expect(actual.nextCursor).toBeNull();
    });

    test("should use current date when item handles no createdAt", async () => {
      // GIVEN an item without createdAt
      const givenItems = [{ id: "foo" }, { id: "bar" }];
      // AND a fetch method that returns these items
      const fetchFn = jest.fn().mockResolvedValue(givenItems);

      // WHEN calling the private findPaginatedRelation with limit 1
      const result = await (service as unknown as ITestingSkillService).findPaginatedRelation(fetchFn, 1);

      // THEN expect the current date or something close to it
      expect(result.nextCursor).not.toBeNull();
      expect(result.nextCursor!.createdAt).toBeInstanceOf(Date);
      expect(result.nextCursor!._id).toBe(givenItems[0].id);
    });
  });
});
