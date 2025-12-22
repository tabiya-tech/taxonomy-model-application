import { OccupationGroupService } from "./occupationGroupService";
import { IOccupationGroupService, OccupationGroupModelValidationError } from "./occupationGroupService.type";
import {
  ModelForOccupationGroupValidationErrorCode,
  INewOccupationGroupSpecWithoutImportId,
  IOccupationGroup,
  IOccupationGroupChild,
} from "./OccupationGroup.types";
import { IOccupationGroupRepository } from "./OccupationGroupRepository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { ObjectTypes } from "esco/common/objectTypes";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IModelInfo } from "modelInfo/modelInfo.types";
import mongoose from "mongoose";
import { getNewISCOGroupSpecsWithoutImportId } from "esco/_test_utilities/getNewSpecs";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";

// Mock the module at the top level
jest.mock("server/repositoryRegistry/repositoryRegistry");
const mockGetRepositoryRegistry = getRepositoryRegistry as jest.MockedFunction<typeof getRepositoryRegistry>;

describe("Test the OccupationGroupService", () => {
  let service: IOccupationGroupService;
  let mockRepository: jest.Mocked<IOccupationGroupRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = {
      Model: {} as unknown as mongoose.Model<unknown>,
      create: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      findByImportId: jest.fn(),
      findAll: jest.fn(),
      findAllByImportId: jest.fn(),
      findPaginated: jest.fn(),
      getOccupationGroupByUUID: jest.fn(),
      findParent: jest.fn(),
      findChildren: jest.fn(),
      getHistory: jest.fn(),
    } as unknown as jest.Mocked<IOccupationGroupRepository>;

    service = new OccupationGroupService(mockRepository);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("create", () => {
    test("should call repository.create with the given spec when model validation passes", async () => {
      //GIVEN a new occupationGroup spec
      const givenSpec: INewOccupationGroupSpecWithoutImportId = getNewISCOGroupSpecsWithoutImportId();
      // AND the model validation passes
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockReturnValue({
            id: givenSpec.modelId,
            released: false,
          } as IModelInfo),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);

      // AND the repository returns a created occupationGroup
      const expectedOccupationGroup: IOccupationGroup = {
        ...givenSpec,
        id: getMockStringId(2),
        UUID: getRandomString(10),
        parent: null,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        importId: "",
      };
      mockRepository.create.mockResolvedValue(expectedOccupationGroup);

      // WHEN  calling service.create
      const actual = await service.create(givenSpec);

      // THEN expect repository.create to have been called with the given spec
      expect(mockRepository.create).toHaveBeenCalledWith(givenSpec);
      // AND expect the returned occupationGroup
      expect(actual).toEqual(expectedOccupationGroup);
    });

    test("should throw if model validation fails", async () => {
      // GIVEN  a new occupationGroup spec
      const givenSpec: INewOccupationGroupSpecWithoutImportId = getNewISCOGroupSpecsWithoutImportId();
      // AND the model validation fails (model not found)
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockResolvedValue(null),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);

      // WHEN calling service.create
      // THEN expect it to throw an error
      await expect(service.create(givenSpec)).rejects.toThrow(OccupationGroupModelValidationError);
    });

    test("should throw if model validation fails due to released model", async () => {
      // GIVEN a new occupationGroup spec
      const givenSpec: INewOccupationGroupSpecWithoutImportId = getNewISCOGroupSpecsWithoutImportId();
      // AND the model validation fails (model is released)
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockResolvedValue({
            id: givenSpec.modelId,
            released: true,
          } as IModelInfo),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);

      // WHEN calling service.create
      // THEN expect it to throw an error
      await expect(service.create(givenSpec)).rejects.toThrow(OccupationGroupModelValidationError);
    });
    test("should throw if repository.create throws", async () => {
      // GIVEN a new occupationGroup spec
      const givenSpec: INewOccupationGroupSpecWithoutImportId = getNewISCOGroupSpecsWithoutImportId();
      // AND the model validation passes
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockReturnValue({
            id: givenSpec.modelId,
            released: false,
          } as IModelInfo),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);

      // AND the repository.create throws an error
      const givenError = new Error("Repository error");
      mockRepository.create.mockRejectedValue(givenError);

      // WHEN calling service.create
      const promise = service.create(givenSpec);

      // THEN expect it to throw the same error
      await expect(promise).rejects.toThrow(givenError);
    });
  });

  describe("findParent", () => {
    test("should call repository.findParent with the given occupation group id", async () => {
      // GIVEN an id
      const givenParentId = getMockStringId(1);
      const givenId = getMockStringId(10);
      // AND the repository returns an occupationGroup with a parent
      const expectedOccupationGroup: IOccupationGroup = {
        id: givenParentId,
        modelId: getMockStringId(2),
        UUID: getRandomString(10),
        preferredLabel: getRandomString(10),
        code: getMockRandomISCOGroupCode(),
        altLabels: [getRandomString(5)],
        description: getRandomString(20),
        groupType: ObjectTypes.ISCOGroup,
        originUri: getRandomString(15),
        UUIDHistory: [],
        importId: "",
        parent: null,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findParent.mockResolvedValue(expectedOccupationGroup);

      const actual = await service.findParent(givenId);
      expect(mockRepository.findParent).toHaveBeenCalledWith(givenId);
      // AND expect the returned occupationGroup
      expect(actual).toEqual(expectedOccupationGroup);
    });

    test("should return null if repository.findParent returns null for the given occupation group", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);
      // AND the repository returns null
      mockRepository.findParent.mockResolvedValue(null); // 1st call

      // WHEN calling service.findParent
      const actual = await service.findParent(givenId);

      // THEN expect repository.findParent to have been called with the id
      expect(mockRepository.findParent).toHaveBeenCalledWith(givenId);

      // AND expect null to be returned
      expect(actual).toBeNull();
    });
    test("should return null if the occupation group has no parent", async () => {
      // GIVEN an id
      const givenId = getMockStringId(10);
      // AND the repository returns an occupationGroup with a parent
      const expectedOccupationGroup: IOccupationGroup = {
        id: givenId,
        modelId: getMockStringId(2),
        UUID: getRandomString(10),
        preferredLabel: getRandomString(10),
        code: getMockRandomISCOGroupCode(),
        altLabels: [getRandomString(5)],
        description: getRandomString(20),
        groupType: ObjectTypes.ISCOGroup,
        originUri: getRandomString(15),
        UUIDHistory: [],
        importId: "",
        parent: null,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // AND the repository returns occupationGroup with no parent first and null for the second
      mockRepository.findParent.mockResolvedValueOnce(null); // 1st call

      // WHEN calling service.findParent
      const actual = await service.findParent(givenId);

      // THEN expect repository.findById to have been called with the id
      expect(mockRepository.findParent).toHaveBeenCalledWith(expectedOccupationGroup.id);
      // AND expect null to be returned
      expect(actual).toBeNull();
    });
  });

  describe("findChildren", () => {
    test("should call repository.findChildren with the given occupation group id", async () => {
      // GIVEN an id
      const givenParentId = getMockStringId(1);
      // AND the repository returns occupation group children
      const givenId = getMockStringId(10);
      const expectedChildren: IOccupationGroupChild = {
        id: getMockStringId(2),
        parentId: givenParentId,
        UUID: getRandomString(10),
        UUIDHistory: [],
        originUri: getRandomString(15),
        code: getMockRandomISCOGroupCode(),
        description: getRandomString(20),
        preferredLabel: getRandomString(10),
        altLabels: [getRandomString(5)],
        objectType: ObjectTypes.ISCOGroup,
        modelId: givenId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findChildren.mockResolvedValue([expectedChildren]);

      const actual = await service.findChildren(givenParentId);
      expect(mockRepository.findChildren).toHaveBeenCalledWith(givenParentId);

      // AND expect the returned occupationGroup children
      expect(actual).toEqual([expectedChildren]);
    });
    test("should return empty array if repository.findChildren returns empty array for the given occupation group", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);
      // AND the repository returns empty array
      mockRepository.findChildren.mockResolvedValue([]); // 1st call

      // WHEN calling service.findChildren
      const actual = await service.findChildren(givenId);

      // THEN expect repository.findChildren to have been called with the id
      expect(mockRepository.findChildren).toHaveBeenCalledWith(givenId);
      // AND expect empty array to be returned
      expect(actual).toEqual([]);
    });
    test("should return empty array if the occupation group has no children", async () => {
      // GIVEN an id
      const givenParentId = getMockStringId(1);
      const givenId = getMockStringId(10);
      const expectedChildren: IOccupationGroupChild = {
        id: getMockStringId(2),
        parentId: givenParentId,
        UUID: getRandomString(10),
        UUIDHistory: [],
        originUri: getRandomString(15),
        code: getMockRandomISCOGroupCode(),
        description: getRandomString(20),
        preferredLabel: getRandomString(10),
        altLabels: [getRandomString(5)],
        objectType: ObjectTypes.ISCOGroup,
        modelId: givenId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // AND the repository returns empty array
      mockRepository.findChildren.mockResolvedValue([]); // 1st call

      // WHEN calling service.findChildren
      const actual = await service.findChildren(givenParentId);

      // THEN expect repository.findChildren to have been called with the id
      expect(mockRepository.findChildren).toHaveBeenCalledWith(expectedChildren.parentId);
      // AND expect empty array to be returned
      expect(actual).toEqual([]);
    });
  });

  describe("findById", () => {
    test("should call repository.findById with the given id", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);
      // AND the repository returns an occupationGroup
      const expectedOccupationGroup: IOccupationGroup = {
        id: givenId,
        modelId: getMockStringId(2),
        UUID: getRandomString(10),
        preferredLabel: getRandomString(10),
        code: getMockRandomISCOGroupCode(),
        altLabels: [getRandomString(5)],
        description: getRandomString(20),
        groupType: ObjectTypes.ISCOGroup,
        originUri: getRandomString(15),
        UUIDHistory: [],
        importId: "",
        parent: null,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(expectedOccupationGroup);

      // WHEN calling service.findById
      const actual = await service.findById(givenId);

      // THEN expect repository.findById to have been called with the id
      expect(mockRepository.findById).toHaveBeenCalledWith(givenId);

      // AND expect the returned occupationGroup
      expect(actual).toEqual(expectedOccupationGroup);
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
      const mockItems = Array.from(
        { length: 11 },
        (_, i) =>
          ({
            id: getMockStringId(i + 2),
            modelId: givenModelId,
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            code: getMockRandomISCOGroupCode(),
            altLabels: [getRandomString(5)],
            description: getRandomString(20),
            groupType: ObjectTypes.ISCOGroup,
            originUri: getRandomString(15),
            UUIDHistory: [],
            importId: "",
            parent: null,
            children: [],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
          }) as IOccupationGroup
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
      expect(actual.nextCursor).toEqual({ _id: mockItems[9].id, createdAt: mockItems[9].createdAt });
    });
    test("should call repository.findPaginated with the given parameters and reverse order parameter return paginated results in reverse order", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;
      const givenDesc = false;
      // AND the repository returns (limit + 1 to check for next page)
      const mockItems = Array.from(
        { length: 11 },
        (_, i) =>
          ({
            id: getMockStringId(i + 2),
            modelId: givenModelId,
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            code: getMockRandomISCOGroupCode(),
            altLabels: [getRandomString(5)],
            description: getRandomString(20),
            groupType: ObjectTypes.ISCOGroup,
            originUri: getRandomString(15),
            UUIDHistory: [],
            importId: "",
            parent: null,
            children: [],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
          }) as IOccupationGroup
      );
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        { id: getMockStringId(10), createdAt: new Date("2023-01-01T00:00:00.000Z") },
        givenLimit,
        givenDesc
      );

      // THEN expect repository.findPaginated to have been called with the given parameters
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, givenLimit + 1, 1, getMockStringId(10));
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
      const mockItems = Array.from(
        { length: 6 },
        (_, i) =>
          ({
            id: getMockStringId(i + 2),
            modelId: givenModelId,
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            code: getMockRandomISCOGroupCode(),
            altLabels: [getRandomString(5)],
            description: getRandomString(20),
            groupType: ObjectTypes.ISCOGroup,
            originUri: getRandomString(15),
            UUIDHistory: [],
            importId: "",
            parent: null,
            children: [],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
          }) as IOccupationGroup
      );

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

      // AND expect repository.findPaginated to have been called with the decoded cursor
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

      // AND the repository.findPaginated throws an error
      const mockItems = Array.from(
        { length: 5 },
        (_, i) =>
          ({
            id: getMockStringId(i + 2),
            modelId: givenModelId,
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            code: getMockRandomISCOGroupCode(),
            altLabels: [getRandomString(5)],
            description: getRandomString(20),
            groupType: ObjectTypes.ISCOGroup,
            originUri: getRandomString(15),
            UUIDHistory: [],
            importId: "",
            parent: null,
            children: [],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
          }) as IOccupationGroup
      );
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated with desc=false
      const actual = await service.findPaginated(givenModelId, undefined, givenLimit, givenDesc);

      // THEN expect repository.findPaginated to have been called with the ascending sort
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, undefined);
      // AND expect the returned result
      expect(actual.items).toHaveLength(5);
    });

    test("should return null nextCursor when no more items", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;

      // AND the repository returns less than limit number of items
      const mockItems = Array.from(
        { length: 10 },
        (_, i) =>
          ({
            id: getMockStringId(i + 2),
            modelId: givenModelId,
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            code: getMockRandomISCOGroupCode(),
            altLabels: [getRandomString(5)],
            description: getRandomString(20),
            groupType: ObjectTypes.ISCOGroup,
            originUri: getRandomString(15),
            UUIDHistory: [],
            importId: "",
            parent: null,
            children: [],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
          }) as IOccupationGroup
      );
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

  describe("validateModelForOccupationGroup", () => {
    test("should return valid when model exists and is not released", async () => {
      // GIVEN  a modelId
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

      // WHEN calling service.validateModelForOccupationGroup
      const actual = await service.validateModelForOccupationGroup(givenModelId);

      // THEN expect it to return valid
      expect(actual).toEqual(null);
    });

    test("should return invalid when model does not exist", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);

      // AND the model exists but is released
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockResolvedValue({
            id: givenModelId,
            released: true,
          } as IModelInfo),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);
      // WHEN calling service.validateModelForOccupationGroup
      const actual = await service.validateModelForOccupationGroup(givenModelId);

      // THEN expect it to return invalid due to released model
      expect(actual).toEqual(ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED);
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

      // WHEN calling service.validateModelForOccupationGroup
      const actual = await service.validateModelForOccupationGroup(givenModelId);

      // THEN expect it to return invalid due to error
      expect(actual).toEqual(ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB);

      // AND console.error was called
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error validating model for occupation group:", givenError);

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
