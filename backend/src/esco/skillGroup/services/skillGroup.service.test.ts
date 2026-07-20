import { SkillGroupService } from "./skillGroup.service";
import {
  ISkillGroupService,
  ISkillGroupPaginatedFilter,
  SkillGroupModelValidationError,
  SetSkillGroupParentError,
  SetSkillGroupParentErrorCode,
} from "./skillGroup.service.type";
import {
  ModelForSkillGroupValidationErrorCode,
  ISkillGroup,
  ISkillGroupChild,
  ISkillGroupReference,
} from "../_shared/skillGroup.types";
import { ISkillGroupRepository } from "../repository/SkillGroup.repository";
import { ISkillHierarchyRepository } from "esco/skillHierarchy/skillHierarchyRepository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { getTestSkillGroupCode } from "_test_utilities/mockSkillGroupCode";
import { ObjectTypes } from "esco/common/objectTypes";

// Mock the module at the top level
jest.mock("server/repositoryRegistry/repositoryRegistry");
const mockGetRepositoryRegistry = getRepositoryRegistry as jest.MockedFunction<typeof getRepositoryRegistry>;

describe("Test the SkillGroupService", () => {
  let service: ISkillGroupService;
  let mockRepository: jest.Mocked<ISkillGroupRepository>;
  let mockSkillHierarchyRepository: jest.Mocked<ISkillHierarchyRepository>;

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
      findHistoryReferencesByUUIDs: jest.fn(),
    } as unknown as jest.Mocked<ISkillGroupRepository>;

    mockSkillHierarchyRepository = {
      hierarchyModel: {} as unknown as mongoose.Model<unknown>,
      skillModel: {} as unknown as mongoose.Model<unknown>,
      skillGroupModel: {} as unknown as mongoose.Model<unknown>,
      createMany: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<ISkillHierarchyRepository>;

    service = new SkillGroupService(mockRepository, mockSkillHierarchyRepository);
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
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, getMockStringId(10), undefined);
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
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, getMockStringId(10), undefined);
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
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, undefined, undefined);
      // AND expect the returned result
      expect(actual.items).toHaveLength(5);
    });
    test("should forward children filter when provided", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = true;
      const givenFilter: ISkillGroupPaginatedFilter = {
        childrenIds: `${getMockStringId(2)};${getMockStringId(3)}`,
        childrenType: ObjectTypes.SkillGroup,
      };

      const mockItems = Array.from(
        { length: 2 },
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

      // WHEN calling service.findPaginated with a children filter
      await service.findPaginated(givenModelId, undefined, givenLimit, givenDesc, givenFilter);

      // THEN expect repository.findPaginated to have been called with the filter
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, undefined, givenFilter);
    });

    test("should forward the root filter when provided", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = true;
      // AND a filter requesting only root skillGroups
      const givenFilter: ISkillGroupPaginatedFilter = {
        root: true,
      };

      mockRepository.findPaginated.mockResolvedValue([]);

      // WHEN calling service.findPaginated with a root filter
      await service.findPaginated(givenModelId, undefined, givenLimit, givenDesc, givenFilter);

      // THEN expect repository.findPaginated to have been called with the root filter
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, undefined, givenFilter);
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
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, givenCursorId, undefined);
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
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(
        givenModelId,
        givenLimit + 1,
        -1,
        getMockStringId(10),
        undefined
      );
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
    test("should call repository.findParents with limit and return paginated result", async () => {
      const givenModelId = getMockStringId(0);
      const givenParentId = getMockStringId(1);
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

      const actual = await service.findParents(givenModelId, givenParentId, 20);

      expect(mockRepository.findParents).toHaveBeenCalledWith(givenModelId, givenParentId, 21, undefined);
      expect(actual).toEqual({ items: expectedParents, nextCursor: null });
    });
    test("should return empty items and null nextCursor when no parents", async () => {
      const givenModelId = getMockStringId(0);
      const givenId = getMockStringId(1);
      mockRepository.findParents.mockResolvedValue([]);

      const actual = await service.findParents(givenModelId, givenId, 20);

      expect(mockRepository.findParents).toHaveBeenCalledWith(givenModelId, givenId, 21, undefined);
      expect(actual).toEqual({ items: [], nextCursor: null });
    });
    test("should return nextCursor when more items exist", async () => {
      const givenModelId = getMockStringId(0);
      const givenId = getMockStringId(1);
      const item1 = {
        id: getMockStringId(2),
        modelId: givenModelId,
        code: getTestSkillGroupCode(100),
        UUID: getRandomString(10),
        preferredLabel: getRandomString(10),
        altLabels: [],
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date(),
        parents: [],
        UUIDHistory: [],
        children: [],
        originUri: "",
        description: "",
        scopeNote: "",
        importId: "",
      };
      const item2 = { ...item1, id: getMockStringId(3), createdAt: new Date("2024-01-02") };
      mockRepository.findParents.mockResolvedValue([item1, item2]);

      const actual = await service.findParents(givenModelId, givenId, 1);

      expect(mockRepository.findParents).toHaveBeenCalledWith(givenModelId, givenId, 2, undefined);
      expect(actual.items).toHaveLength(1);
      expect(actual.items[0]).toEqual(item1);
      expect(actual.nextCursor).toEqual({ _id: item1.id, createdAt: item1.createdAt });
    });
    test("should pass cursor to repository when provided", async () => {
      mockRepository.findParents.mockResolvedValue([]);
      await service.findParents(getMockStringId(0), getMockStringId(1), 10, getMockStringId(5));
      expect(mockRepository.findParents).toHaveBeenCalledWith(
        getMockStringId(0),
        getMockStringId(1),
        11,
        getMockStringId(5)
      );
    });
  });
  describe("findChildren", () => {
    test("should call repository.findChildren with limit and return paginated result", async () => {
      const givenModelId = getMockStringId(0);
      const givenParentId = getMockStringId(1);
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

      const actual = await service.findChildren(givenModelId, givenParentId, 20);

      expect(mockRepository.findChildren).toHaveBeenCalledWith(givenModelId, givenParentId, 21, undefined);
      expect(actual).toEqual({ items: [expectedChildren], nextCursor: null });
    });

    test("should return empty items and null nextCursor when no children", async () => {
      const givenModelId = getMockStringId(0);
      const givenId = getMockStringId(1);
      mockRepository.findChildren.mockResolvedValue([]);
      const actual = await service.findChildren(givenModelId, givenId, 20);
      expect(mockRepository.findChildren).toHaveBeenCalledWith(givenModelId, givenId, 21, undefined);
      expect(actual).toEqual({ items: [], nextCursor: null });
    });

    test("should return nextCursor when more children exist", async () => {
      const givenModelId = getMockStringId(0);
      const givenParentId = getMockStringId(1);
      const child1: ISkillGroupChild = {
        id: getMockStringId(2),
        parentId: givenParentId,
        UUID: getRandomString(10),
        UUIDHistory: [],
        originUri: "",
        description: "",
        preferredLabel: "",
        altLabels: [],
        modelId: givenModelId,
        objectType: ObjectTypes.SkillGroup,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date(),
      };
      const child2 = { ...child1, id: getMockStringId(3), createdAt: new Date("2024-01-02") };
      mockRepository.findChildren.mockResolvedValue([child1, child2]);

      const actual = await service.findChildren(givenModelId, givenParentId, 1);

      expect(mockRepository.findChildren).toHaveBeenCalledWith(givenModelId, givenParentId, 2, undefined);
      expect(actual.items).toHaveLength(1);
      expect(actual.items[0]).toEqual(child1);
      expect(actual.nextCursor).toEqual({ _id: child1.id, createdAt: child1.createdAt });
    });

    test("should fall back to current date when the last child has no createdAt", async () => {
      const givenModelId = getMockStringId(0);
      const givenParentId = getMockStringId(1);
      const child1 = {
        id: getMockStringId(2),
        parentId: givenParentId,
        UUID: getRandomString(10),
        UUIDHistory: [],
        originUri: "",
        description: "",
        preferredLabel: "",
        altLabels: [],
        modelId: givenModelId,
        objectType: ObjectTypes.SkillGroup,
      } as unknown as ISkillGroupChild;
      const child2 = { ...child1, id: getMockStringId(3) };
      mockRepository.findChildren.mockResolvedValue([child1, child2]);

      const actual = await service.findChildren(givenModelId, givenParentId, 1);

      expect(mockRepository.findChildren).toHaveBeenCalledWith(givenModelId, givenParentId, 2, undefined);
      expect(actual.items).toHaveLength(1);
      expect(actual.nextCursor).not.toBeNull();
      expect(actual.nextCursor?.createdAt).toBeInstanceOf(Date);
    });

    test("should pass cursor to repository when provided", async () => {
      mockRepository.findChildren.mockResolvedValue([]);
      await service.findChildren(getMockStringId(0), getMockStringId(1), 10, getMockStringId(5));
      expect(mockRepository.findChildren).toHaveBeenCalledWith(
        getMockStringId(0),
        getMockStringId(1),
        11,
        getMockStringId(5)
      );
    });
  });

  describe("setParent", () => {
    function givenSkillGroup(id: string, modelId: string): ISkillGroup {
      return {
        id,
        modelId,
        code: getTestSkillGroupCode(100),
        UUID: getRandomString(10),
        preferredLabel: getRandomString(10),
        altLabels: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        parents: [],
        UUIDHistory: [],
        children: [],
        originUri: "",
        description: "",
        scopeNote: "",
        importId: "",
      };
    }

    function mockModelValidation(modelId: string, errorCode: ModelForSkillGroupValidationErrorCode | null) {
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest
            .fn()
            .mockResolvedValue(
              errorCode === ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID
                ? null
                : errorCode === ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED
                ? { id: modelId, released: true }
                : { id: modelId, released: false }
            ),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);
    }

    test("should create hierarchy entry and return parent when child and parent exist", async () => {
      // GIVEN a model that is valid
      const givenModelId = getMockStringId(1);
      const givenChildId = getMockStringId(2);
      const givenParentId = getMockStringId(3);
      mockModelValidation(givenModelId, null);

      // AND the child and parent skill groups exist
      const child = givenSkillGroup(givenChildId, givenModelId);
      const parent = givenSkillGroup(givenParentId, givenModelId);
      mockRepository.findById.mockResolvedValueOnce(child);
      mockRepository.findById.mockResolvedValueOnce(parent);

      // WHEN setting the parent
      const actual = await service.setParent({
        childId: givenChildId,
        parentId: givenParentId,
        parentType: ObjectTypes.SkillGroup,
        modelId: givenModelId,
      });

      // THEN the hierarchy entry is created
      expect(mockSkillHierarchyRepository.createMany).toHaveBeenCalledWith(givenModelId, [
        {
          childId: givenChildId,
          childType: ObjectTypes.SkillGroup,
          parentId: givenParentId,
          parentType: ObjectTypes.SkillGroup,
        },
      ]);
      // AND the parent is returned
      expect(actual).toBe(parent);
    });

    test("should throw SkillGroupModelValidationError when model is not found", async () => {
      // GIVEN a model that does not exist
      const givenModelId = getMockStringId(1);
      mockModelValidation(givenModelId, ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID);

      // WHEN calling setParent
      const promise = service.setParent({
        childId: getMockStringId(2),
        parentId: getMockStringId(3),
        parentType: ObjectTypes.SkillGroup,
        modelId: givenModelId,
      });

      // THEN it throws the error
      await expect(promise).rejects.toThrow(SkillGroupModelValidationError);
    });

    test("should throw SkillGroupModelValidationError when model is released", async () => {
      // GIVEN a released model
      const givenModelId = getMockStringId(1);
      mockModelValidation(givenModelId, ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED);

      // WHEN calling setParent
      const promise = service.setParent({
        childId: getMockStringId(2),
        parentId: getMockStringId(3),
        parentType: ObjectTypes.SkillGroup,
        modelId: givenModelId,
      });

      // THEN it throws the error
      await expect(promise).rejects.toThrow(SkillGroupModelValidationError);
    });

    test("should throw SetSkillGroupParentError when child is not found", async () => {
      // GIVEN a valid model
      const givenModelId = getMockStringId(1);
      mockModelValidation(givenModelId, null);

      // AND the child does not exist
      mockRepository.findById.mockResolvedValue(null);

      // WHEN calling setParent
      const promise = service.setParent({
        childId: getMockStringId(2),
        parentId: getMockStringId(3),
        parentType: ObjectTypes.SkillGroup,
        modelId: givenModelId,
      });

      // THEN it throws CHILD_NOT_FOUND
      await expect(promise).rejects.toThrow(SetSkillGroupParentError);
      await expect(promise).rejects.toMatchObject({ code: SetSkillGroupParentErrorCode.CHILD_NOT_FOUND });
    });

    test("should throw SetSkillGroupParentError when child belongs to a different model", async () => {
      // GIVEN a valid model
      const givenModelId = getMockStringId(1);
      mockModelValidation(givenModelId, null);

      // AND the child belongs to a different model
      const child = givenSkillGroup(getMockStringId(2), getMockStringId(99));
      mockRepository.findById.mockResolvedValueOnce(child);

      // WHEN calling setParent
      const promise = service.setParent({
        childId: child.id,
        parentId: getMockStringId(3),
        parentType: ObjectTypes.SkillGroup,
        modelId: givenModelId,
      });

      // THEN it throws CHILD_NOT_FOUND
      await expect(promise).rejects.toThrow(SetSkillGroupParentError);
      await expect(promise).rejects.toMatchObject({ code: SetSkillGroupParentErrorCode.CHILD_NOT_FOUND });
    });

    test("should throw SetSkillGroupParentError when parent is not found", async () => {
      // GIVEN a valid model
      const givenModelId = getMockStringId(1);
      mockModelValidation(givenModelId, null);

      // AND the child exists but the parent does not
      const child = givenSkillGroup(getMockStringId(2), givenModelId);
      mockRepository.findById.mockResolvedValueOnce(child);
      mockRepository.findById.mockResolvedValueOnce(null);

      // WHEN calling setParent
      const promise = service.setParent({
        childId: child.id,
        parentId: getMockStringId(3),
        parentType: ObjectTypes.SkillGroup,
        modelId: givenModelId,
      });

      // THEN it throws PARENT_NOT_FOUND
      await expect(promise).rejects.toThrow(SetSkillGroupParentError);
      await expect(promise).rejects.toMatchObject({ code: SetSkillGroupParentErrorCode.PARENT_NOT_FOUND });
    });

    test("should throw SetSkillGroupParentError when parent belongs to a different model", async () => {
      // GIVEN a valid model
      const givenModelId = getMockStringId(1);
      mockModelValidation(givenModelId, null);

      // AND the child exists but the parent belongs to a different model
      const child = givenSkillGroup(getMockStringId(2), givenModelId);
      const parent = givenSkillGroup(getMockStringId(3), getMockStringId(99));
      mockRepository.findById.mockResolvedValueOnce(child);
      mockRepository.findById.mockResolvedValueOnce(parent);

      // WHEN calling setParent
      const promise = service.setParent({
        childId: child.id,
        parentId: parent.id,
        parentType: ObjectTypes.SkillGroup,
        modelId: givenModelId,
      });

      // THEN it throws PARENT_NOT_FOUND
      await expect(promise).rejects.toThrow(SetSkillGroupParentError);
      await expect(promise).rejects.toMatchObject({ code: SetSkillGroupParentErrorCode.PARENT_NOT_FOUND });
    });
  });

  describe("getHistory", () => {
    // A skill group's UUIDHistory holds its OWN past UUIDs; the service resolves each to the group's
    // reference (as it was in that model) + its modelId, then fetches that model and strips it to a reference.
    function givenModelWithId(n: number, modelId: string): IModelInfo {
      return { ...getIModelInfoMockData(n), id: modelId };
    }

    function givenReference(uuid: string): ISkillGroupReference {
      return {
        id: getMockStringId(Math.floor(Math.random() * 100000)),
        UUID: uuid,
        code: getRandomString(5),
        preferredLabel: getRandomString(10),
        objectType: ObjectTypes.SkillGroup,
      };
    }

    function expectedModelReference(model: IModelInfo) {
      return {
        id: model.id,
        UUID: model.UUID,
        name: model.name,
        version: model.version,
        localeShortCode: model.locale.shortCode,
      };
    }

    function mockModelInfoRepository(overrides: Record<string, unknown>) {
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelsByIds: jest.fn().mockResolvedValue([]),
          releaseModel: jest.fn(),
          getHistory: jest.fn().mockResolvedValue([]),
          ...overrides,
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);
    }

    test("should return null when the skill group does not exist", async () => {
      // GIVEN the skill group does not exist
      mockRepository.findById.mockResolvedValue(null);
      mockModelInfoRepository({});

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect null and no further lookups
      expect(actual).toBeNull();
      expect(mockRepository.findHistoryReferencesByUUIDs).not.toHaveBeenCalled();
    });

    test("should return an empty array when the skill group has an empty UUIDHistory", async () => {
      // GIVEN a skill group with an empty UUIDHistory
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [] } as unknown as ISkillGroup);
      mockModelInfoRepository({});

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect an empty array and no further lookups
      expect(actual).toEqual([]);
      expect(mockRepository.findHistoryReferencesByUUIDs).not.toHaveBeenCalled();
    });

    test("should resolve entity ref + stripped model per UUID, preserve UUIDHistory order, and skip unresolved UUIDs", async () => {
      // GIVEN a skill group whose own UUIDHistory has two resolvable UUIDs with a non-existent one in between
      const givenUuidA = randomUUID();
      const givenUuidMissing = randomUUID();
      const givenUuidB = randomUUID();
      mockRepository.findById.mockResolvedValue({
        UUIDHistory: [givenUuidA, givenUuidMissing, givenUuidB],
      } as unknown as ISkillGroup);

      // AND uuidA/uuidB resolve to skill group references in models A and B (missing UUID resolves to nulls)
      const givenModelAId = getMockStringId(10);
      const givenModelBId = getMockStringId(20);
      const givenRefA = givenReference(givenUuidA);
      const givenRefB = givenReference(givenUuidB);
      mockRepository.findHistoryReferencesByUUIDs.mockResolvedValue([
        { UUID: givenUuidA, modelId: givenModelAId, reference: givenRefA },
        { UUID: givenUuidMissing, modelId: null, reference: null },
        { UUID: givenUuidB, modelId: givenModelBId, reference: givenRefB },
      ]);

      // AND the models are fetched by id (returned out of order to prove ordering comes from UUIDHistory)
      const givenModelA = givenModelWithId(1, givenModelAId);
      const givenModelB = givenModelWithId(2, givenModelBId);
      mockModelInfoRepository({
        getModelsByIds: jest.fn().mockResolvedValue([givenModelB, givenModelA]),
        releaseModel: jest.fn(),
      });

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect one entry per resolvable UUID in UUIDHistory order (A before B), missing skipped
      expect(actual).toEqual([
        { entity: givenRefA, model: expectedModelReference(givenModelA) },
        { entity: givenRefB, model: expectedModelReference(givenModelB) },
      ]);
      // AND resolution uses single batched queries (no N+1): UUIDs -> refs+modelIds, then modelIds -> models
      expect(mockRepository.findHistoryReferencesByUUIDs).toHaveBeenCalledTimes(1);
      expect(mockRepository.findHistoryReferencesByUUIDs).toHaveBeenCalledWith([
        givenUuidA,
        givenUuidMissing,
        givenUuidB,
      ]);
    });

    test("should return a model at most once even if several history UUIDs map to the same model", async () => {
      // GIVEN two of the skill group's historical UUIDs resolve to the SAME model
      const givenUuid1 = randomUUID();
      const givenUuid2 = randomUUID();
      mockRepository.findById.mockResolvedValue({
        UUIDHistory: [givenUuid1, givenUuid2],
      } as unknown as ISkillGroup);
      const givenModelId = getMockStringId(10);
      mockRepository.findHistoryReferencesByUUIDs.mockResolvedValue([
        { UUID: givenUuid1, modelId: givenModelId, reference: givenReference(givenUuid1) },
        { UUID: givenUuid2, modelId: givenModelId, reference: givenReference(givenUuid2) },
      ]);
      const givenModel = givenModelWithId(1, givenModelId);
      mockModelInfoRepository({
        getModelsByIds: jest.fn().mockResolvedValue([givenModel]),
        releaseModel: jest.fn(),
      });

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN the model appears only once (the first history UUID that maps to it wins)
      expect(actual).toHaveLength(1);
      expect(actual![0].model).toEqual(expectedModelReference(givenModel));
    });

    test("should skip a UUID whose model no longer exists", async () => {
      // GIVEN a UUID that resolves to a reference + modelId, but the model itself is gone
      const givenUuid = randomUUID();
      const givenModelId = getMockStringId(10);
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [givenUuid] } as unknown as ISkillGroup);
      mockRepository.findHistoryReferencesByUUIDs.mockResolvedValue([
        { UUID: givenUuid, modelId: givenModelId, reference: givenReference(givenUuid) },
      ]);
      mockModelInfoRepository({
        getModelsByIds: jest.fn().mockResolvedValue([]), // model not found
        releaseModel: jest.fn(),
      });

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN the entry is skipped
      expect(actual).toEqual([]);
    });
  });
});
