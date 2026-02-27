import { SkillGroupService } from "./skillGroupService";
import { ISkillGroupService } from "./skillGroupService.type";
import { ModelForSkillGroupValidationErrorCode, ISkillGroup, ISkillGroupChild } from "./skillGroup.types";
import { ISkillGroupRepository } from "./skillGroupRepository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IModelInfo } from "modelInfo/modelInfo.types";
import mongoose from "mongoose";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";
import { ObjectTypes } from "esco/common/objectTypes";

// Mock the module at the top level
jest.mock("server/repositoryRegistry/repositoryRegistry");
const mockGetRepositoryRegistry = getRepositoryRegistry as jest.MockedFunction<typeof getRepositoryRegistry>;

describe("Test the SkillGroupService", () => {
  let service: ISkillGroupService;
  let mockRepository: jest.Mocked<ISkillGroupRepository>;

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
    } as unknown as jest.Mocked<ISkillGroupRepository>;

    service = new SkillGroupService(mockRepository);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("findById", () => {
    test("should call repository.findById with the given id", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);
      // AND the repository returns an skillGroup
      const expectedSkillGroup: ISkillGroup = {
        id: givenId,
        modelId: getMockStringId(1),
        code: getTestSkillGroupCode(100),
        UUID: getRandomString(10),
        preferredLabel: getRandomString(10),
        altLabels: [getRandomString(5)],
        createdAt: new Date(),
        updatedAt: new Date(),
        parents: [],
        UUIDHistory: [],
        children: [],
        originUri: getRandomString(15),
        description: getRandomString(20),
        scopeNote: getRandomString(30),
        importId: getRandomString(10),
      };

      mockRepository.findById.mockResolvedValue(expectedSkillGroup);

      // WHEN calling service.findById
      const actual = await service.findById(givenId);

      // THEN expect repository.findById to have been called with the given id
      expect(mockRepository.findById).toHaveBeenCalledWith(givenId);
      // AND the returned skillGroup to be the expected one
      expect(actual).toBe(expectedSkillGroup);
    });

    test("should return null if repository.findById returns null", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);

      // AND the repository returns null
      mockRepository.findById.mockResolvedValue(null);

      // WHEN calling service.findById
      const actual = await service.findById(givenId);

      // THEN expect repository.findById to have been called with the given id
      expect(mockRepository.findById).toHaveBeenCalledWith(givenId);
      // AND the returned skillGroup to be null
      expect(actual).toBeNull();
    });

    test("should throw if repository.findById throws", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);
      // AND the repository.findById throws
      mockRepository.findById.mockRejectedValue(new Error("Repository error"));

      // WHEN calling service.findById
      const promise = service.findById(givenId);
      // THEN expect it to throw the same error
      await expect(promise).rejects.toThrow("Repository error");
    });
  });

  describe("findPaginated", () => {
    test("should call repository.findPaginated with the given parameters and return paginated results", async () => {
      //GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = true;
      //AND the repository returns (limit + 1 to check for next page)
      const mockItems = Array.from(
        { length: 11 },
        (_, i) =>
          ({
            id: getMockStringId(i + 1),
            modelId: getMockStringId(1),
            code: getTestSkillGroupCode(100),
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            altLabels: [getRandomString(5)],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
            parents: [],
            UUIDHistory: [],
            children: [],
            originUri: getRandomString(15),
            description: getRandomString(20),
            scopeNote: getRandomString(30),
            importId: "",
          }) as ISkillGroup
      );
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        { id: getMockStringId(10), createdAt: new Date("2023-01-01T00:00:00.000Z") },
        givenLimit,
        givenDesc
      );

      // THEN expect repository.findPaginated to have been called with the correct parameters
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, getMockStringId(10));
      // AND expect the returned paginated result
      expect(actual.items).toHaveLength(10);
      expect(actual.nextCursor).toEqual({
        _id: mockItems[9].id,
        createdAt: mockItems[9].createdAt,
      });
    });
    test("should return null nextCursor if there is no next page", async () => {
      //GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = true;
      //AND the repository returns (limit + 1 to check for next page)
      const mockItems = Array.from(
        { length: 6 },
        (_, i) =>
          ({
            id: getMockStringId(i + 1),
            modelId: givenModelId,
            code: getTestSkillGroupCode(100),
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            altLabels: [getRandomString(5)],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
            parents: [],
            UUIDHistory: [],
            children: [],

            originUri: getRandomString(15),
            description: getRandomString(20),
            scopeNote: getRandomString(30),
            importId: "",
          }) as ISkillGroup
      );
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        { id: getMockStringId(10), createdAt: new Date("2023-01-01T00:00:00.000Z") },
        givenLimit,
        givenDesc
      );

      // THEN expect repository.findPaginated to have been called with the correct parameters
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, getMockStringId(10));
      // AND expect the returned paginated result
      expect(actual.items).toHaveLength(6);
      expect(actual.nextCursor).toBeNull();
    });
    test("should handle ascending sort order", async () => {
      //GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = false;
      //AND the repository returns (limit + 1 to check for next page)
      const mockItems = Array.from(
        { length: 5 },
        (_, i) =>
          ({
            id: getMockStringId(i + 1),
            modelId: givenModelId,
            code: getTestSkillGroupCode(100),
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            altLabels: [getRandomString(5)],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
            parents: [],
            UUIDHistory: [],
            children: [],

            originUri: getRandomString(15),
            description: getRandomString(20),
            scopeNote: getRandomString(30),
            importId: "",
          }) as ISkillGroup
      );
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated with desc=false
      const actual = await service.findPaginated(givenModelId, undefined, givenLimit, givenDesc);

      // THEN expect repository.findPaginated to have been called with the ascending sort
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, undefined);
      // AND expect the returned result
      expect(actual.items).toHaveLength(5);
    });

    test("should build ascending cursor filter when cursor is provided", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = false;
      const givenCursorId = getMockStringId(10);

      // AND the repository returns some items
      const mockItems = Array.from({ length: 3 }, (_, i) => ({
        id: getMockStringId(i + 1),
        modelId: givenModelId,
        code: getTestSkillGroupCode(100),
        UUID: getRandomString(10),
        preferredLabel: getRandomString(10),
        altLabels: [getRandomString(5)],
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date(),
        parents: [],
        UUIDHistory: [],
        children: [],
        originUri: getRandomString(15),
        description: getRandomString(20),
        scopeNote: getRandomString(30),
        importId: "",
      })) as ISkillGroup[];
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated with desc=false and a cursor
      await service.findPaginated(
        givenModelId,
        { id: givenCursorId, createdAt: new Date("2023-01-01T00:00:00.000Z") },
        givenLimit,
        givenDesc
      );

      // THEN expect repository.findPaginated to have been called with cursorId for ascending cursor
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, givenCursorId);
    });

    test("should handle descending sort order", async () => {
      //GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = true;
      //AND the repository returns (limit + 1 to check for next page)
      const mockItems = Array.from(
        { length: 6 },
        (_, i) =>
          ({
            id: getMockStringId(i + 2),
            modelId: givenModelId,
            code: getTestSkillGroupCode(100),
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            altLabels: [getRandomString(5)],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
            parents: [],
            UUIDHistory: [],
            children: [],
            originUri: getRandomString(15),
            description: getRandomString(20),
            scopeNote: getRandomString(30),
            importId: "",
          }) as ISkillGroup
      );
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated with desc=true
      const actual = await service.findPaginated(
        givenModelId,
        {
          id: getMockStringId(10),
          createdAt: new Date("2023-01-01T00:00:00.000Z"),
        },
        givenLimit,
        givenDesc
      );

      // THEN expect repository.findPaginate to have been called with the descending sort
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, givenLimit + 1, -1, getMockStringId(10));
      // AND expect the returned result
      expect(actual.items).toHaveLength(6);
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
  describe("validateModelForOccupationGroup", () => {
    test("should return valid when model exists and is not released", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      // AND the model exists and is not released
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockResolvedValue({
            id: givenModelId,
            released: false,
          } as IModelInfo),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);

      // WHEN calling service.validateModelForSkillGroup
      const actual = await service.validateModelForSkillGroup(givenModelId);

      // THEN expect it to return valid
      expect(actual).toEqual(null);
    });

    test("should return invalid when model does not exist", async () => {
      // GIVEN a modelId
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      // AND the model does not exists
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockResolvedValue(null),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);

      // WHEN calling service.validateModelForSkillGroup
      const actual = await service.validateModelForSkillGroup(givenModelId);

      // THEN expect it to return invalid due to released model
      expect(actual).toEqual(ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID);
    });
    test("should return invalid when model is released", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      // AND the model exists and is released
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockResolvedValue({
            id: givenModelId,
            released: true,
          } as IModelInfo),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);
      // WHEN calling service.validateModelForSkillGroup
      const actual = await service.validateModelForSkillGroup(givenModelId);
      // THEN expect it to return invalid due to released model
      expect(actual).toEqual(ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED);
    });
    test("should return invalid when getModelById throws", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);
      // AND getModelById throws an error
      const givenError = new Error("Database error");
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockRejectedValue(givenError),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);
      // AND console.error is mocked to suppress output
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // WHEN calling service.validateModelForSkillGroup
      const actual = await service.validateModelForSkillGroup(givenModelId);

      // THEN expect it to return invalid due to error
      expect(actual).toEqual(ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB);

      // AND console.error was called
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error validating model for skill group:", givenError);

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe("findParents", () => {
    test("should call repository.findParents with the given id and return the result", async () => {
      // GIVEN an id
      const givenParentId = getMockStringId(1);
      // AND the repository returns some parents
      const expectedParents: ISkillGroup[] = [
        {
          id: getMockStringId(2),
          modelId: getMockStringId(1),
          code: getTestSkillGroupCode(100),
          UUID: getRandomString(10),
          preferredLabel: getRandomString(10),
          altLabels: [getRandomString(5)],
          createdAt: new Date(),
          updatedAt: new Date(),
          parents: [],
          UUIDHistory: [],
          children: [],
          originUri: getRandomString(15),
          description: getRandomString(20),
          scopeNote: getRandomString(30),
          importId: getRandomString(10),
        },
      ];
      mockRepository.findParents.mockResolvedValue(expectedParents);

      // WHEN calling service.findParents
      const actual = await service.findParents(givenParentId);

      // THEN expect repository.findParents to have been called with the given id
      expect(mockRepository.findParents).toHaveBeenCalledWith(givenParentId);
      // AND the returned parents to be the expected ones
      expect(actual).toEqual(expectedParents);
    });
    test("should return empty array if repository.findParents return an empty array for the given skillGroup", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);
      //AND the repository returns empty array
      mockRepository.findParents.mockResolvedValue([]);

      // WHEN calling service.findParents
      const actual = await service.findParents(givenId);

      // THEN expect repository.findParents to have been called with the given id
      expect(mockRepository.findParents).toHaveBeenCalledWith(givenId);
      // AND the returned parents to be an empty array
      expect(actual).toEqual([]);
    });
  });
  describe("findChildren", () => {
    test("should call repository.findChildren with the given id and return the result", async () => {
      // GIVEN an id
      const givenParentId = getMockStringId(1);

      // AND the repository returns skill group children
      const givenId = getMockStringId(10);
      const expectedChildren: ISkillGroupChild = {
        id: getMockStringId(2),
        parentId: givenParentId,
        UUID: getRandomString(10),
        UUIDHistory: [],
        originUri: getRandomString(15),
        description: getRandomString(20),
        preferredLabel: getRandomString(10),
        altLabels: [getRandomString(5)],
        modelId: givenId,
        objectType: ObjectTypes.SkillGroup,
        code: getTestSkillGroupCode(100),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findChildren.mockResolvedValue([expectedChildren]);

      // WHEN calling service.findChildren
      const actual = await service.findChildren(givenParentId);

      // THEN expect repository.findChildren to have been called with the given id
      expect(mockRepository.findChildren).toHaveBeenCalledWith(givenParentId);
      // AND the returned children to be the expected ones
      expect(actual).toEqual([expectedChildren]);
    });

    test("should return empty array if repository.findChildren return an empty array for the given skillGroup", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);
      // AND the repository returns empty array
      mockRepository.findChildren.mockResolvedValue([]);
      // WHEN calling service.findChildren
      const actual = await service.findChildren(givenId);
      // THEN expect repository.findChildren to have been called with the given id
      expect(mockRepository.findChildren).toHaveBeenCalledWith(givenId);
      // AND the returned children to be an empty array
      expect(actual).toEqual([]);
    });
  });
});
