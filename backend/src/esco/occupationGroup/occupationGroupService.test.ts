import { OccupationGroupService } from "./occupationGroupService";
import { IOccupationGroupService, OccupationGroupModelValidationError } from "./occupationGroupService.type";
import {
  ModalForOccupationGroupValidationErrorCode,
  INewOccupationGroupSpecWithoutImportId,
  IOccupationGroup,
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
      // AND the modal validation fails (model not found)
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

      // THEN expect repository.findPaginated to have been called with the given parameters
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, expect.any(Object), { _id: -1 }, 11);
      // AND expect the returned paginated result
      expect(actual.items).toHaveLength(10);
      expect(actual.nextCursor).toEqual({ _id: mockItems[10].id, createdAt: mockItems[10].createdAt });
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

      // AND expect repository.findPaginated to have been called with the decoded cursor sort
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, expect.any(Object), { _id: -1 }, 11);
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

      // THEN expect repository.findPaginate to have been called with the ascending sort
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, {}, { _id: 1 }, 11);
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
      expect(actual).toEqual(ModalForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED);
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
      expect(actual).toEqual(ModalForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB);

      // AND console.error was called
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error validating model for occupation group:", givenError);

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
