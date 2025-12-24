import { OccupationService } from "./occupationService";
import {
  IOccupationService,
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "./occupationService.types";
import { INewOccupationSpecWithoutImportId, IOccupation } from "./occupation.types";
import { IOccupationRepository } from "./occupationRepository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { ObjectTypes } from "esco/common/objectTypes";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { IModelInfo } from "modelInfo/modelInfo.types";
import mongoose from "mongoose";

// Mock the module at the top level
// jest.mock("server/repositoryRegistry/repositoryRegistry");

describe("Test the OccupationService", () => {
  let service: IOccupationService;
  let mockRepository: jest.Mocked<IOccupationRepository>;
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
      getOccupationByUUID: jest.fn(),
    } as unknown as jest.Mocked<IOccupationRepository>;

    mockModelRepository = {
      getModelById: jest.fn(),
    } as unknown as jest.Mocked<IModelRepository>;

    service = new OccupationService(mockRepository, mockModelRepository);
  });

  describe("create", () => {
    test("should call repository.create with the given spec when model validation passes", async () => {
      // GIVEN a new occupation spec
      const givenSpec: INewOccupationSpecWithoutImportId = {
        modelId: getMockStringId(1),
        preferredLabel: getRandomString(10),
        code: getRandomString(5),
        altLabels: [getRandomString(5)],
        description: getRandomString(20),
        definition: getRandomString(20),
        scopeNote: getRandomString(20),
        regulatedProfessionNote: getRandomString(20),
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: false,
        originUri: getRandomString(10),
        occupationGroupCode: getRandomString(5),
        UUIDHistory: [],
      };

      // AND the model validation passes
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenSpec.modelId,
        released: false,
      } as unknown as IModelInfo);

      // AND the repository returns a created occupation
      const expectedOccupation: IOccupation = {
        ...givenSpec,
        id: getMockStringId(2),
        UUID: getRandomString(10),
        parent: null,
        children: [],
        requiresSkills: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        importId: "",
      };
      mockRepository.create.mockResolvedValue(expectedOccupation);

      // WHEN calling service.create
      const actual = await service.create(givenSpec);

      // THEN expect repository.create to be called with the spec
      expect(mockRepository.create).toHaveBeenCalledWith(givenSpec);
      // AND expect the returned occupation
      expect(actual).toEqual(expectedOccupation);
    });

    test("should throw if model validation fails", async () => {
      // GIVEN a new occupation spec
      const givenSpec: INewOccupationSpecWithoutImportId = {
        modelId: getMockStringId(1),
        preferredLabel: getRandomString(10),
        code: getRandomString(5),
        altLabels: [getRandomString(5)],
        description: getRandomString(20),
        definition: getRandomString(20),
        scopeNote: getRandomString(20),
        regulatedProfessionNote: getRandomString(20),
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: false,
        originUri: getRandomString(10),
        occupationGroupCode: getRandomString(5),
        UUIDHistory: [],
      };

      // AND the model validation fails (model not found)
      mockModelRepository.getModelById.mockResolvedValue(null);

      // WHEN calling service.create
      // THEN expect it to throw an error
      await expect(service.create(givenSpec)).rejects.toThrow(OccupationModelValidationError);
    });

    test("should throw if model validation fails due to released model", async () => {
      // GIVEN a new occupation spec
      const givenSpec: INewOccupationSpecWithoutImportId = {
        modelId: getMockStringId(1),
        preferredLabel: getRandomString(10),
        code: getRandomString(5),
        altLabels: [getRandomString(5)],
        description: getRandomString(20),
        definition: getRandomString(20),
        scopeNote: getRandomString(20),
        regulatedProfessionNote: getRandomString(20),
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: false,
        originUri: getRandomString(10),
        occupationGroupCode: getRandomString(5),
        UUIDHistory: [],
      };

      // AND the model validation fails (model is released)
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenSpec.modelId,
        released: true,
      } as unknown as IModelInfo);

      // WHEN calling service.create
      // THEN expect it to throw an error
      await expect(service.create(givenSpec)).rejects.toThrow(OccupationModelValidationError);
    });

    test("should throw if repository.create throws", async () => {
      // GIVEN a new occupation spec
      const givenSpec: INewOccupationSpecWithoutImportId = {
        modelId: getMockStringId(1),
        preferredLabel: getRandomString(10),
        code: getRandomString(5),
        altLabels: [getRandomString(5)],
        description: getRandomString(20),
        definition: getRandomString(20),
        scopeNote: getRandomString(20),
        regulatedProfessionNote: getRandomString(20),
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: false,
        originUri: getRandomString(10),
        occupationGroupCode: getRandomString(5),
        UUIDHistory: [],
      };

      // AND the model validation passes
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenSpec.modelId,
        released: false,
      } as unknown as IModelInfo);

      // AND the repository throws an error
      const givenError = new Error("Repository error");
      mockRepository.create.mockRejectedValue(givenError);

      // WHEN calling service.create
      const promise = service.create(givenSpec);

      // THEN expect it to throw the error
      await expect(promise).rejects.toThrow(givenError);
    });
  });

  describe("findById", () => {
    test("should call repository.findById with the given id", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);

      // AND the repository returns an occupation
      const expectedOccupation: IOccupation = {
        id: givenId,
        modelId: getMockStringId(2),
        UUID: getRandomString(10),
        preferredLabel: getRandomString(10),
        code: getRandomString(5),
        altLabels: [getRandomString(5)],
        description: getRandomString(20),
        definition: getRandomString(20),
        scopeNote: getRandomString(20),
        regulatedProfessionNote: getRandomString(20),
        occupationType: ObjectTypes.ESCOOccupation,
        isLocalized: false,
        originUri: getRandomString(10),
        occupationGroupCode: getRandomString(5),
        UUIDHistory: [],
        importId: "",
        parent: null,
        children: [],
        requiresSkills: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValue(expectedOccupation);

      // WHEN calling service.findById
      const actual = await service.findById(givenId);

      // THEN expect repository.findById to be called with the id
      expect(mockRepository.findById).toHaveBeenCalledWith(givenId);
      // AND expect the returned occupation
      expect(actual).toEqual(expectedOccupation);
    });

    test("should return null if repository.findById returns null", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);

      // AND the repository returns null
      mockRepository.findById.mockResolvedValue(null);

      // WHEN calling service.findById
      const actual = await service.findById(givenId);

      // THEN expect repository.findById to be called with the id
      expect(mockRepository.findById).toHaveBeenCalledWith(givenId);
      // AND expect null to be returned
      expect(actual).toBeNull();
    });

    test("should throw if repository.findById throws", async () => {
      // GIVEN an id
      const givenId = getMockStringId(1);

      // AND the repository throws an error
      const givenError = new Error("Repository error");
      mockRepository.findById.mockRejectedValue(givenError);

      // WHEN calling service.findById
      const promise = service.findById(givenId);

      // THEN expect it to throw the error
      await expect(promise).rejects.toThrow(givenError);
    });
  });

  describe("findPaginated", () => {
    test("should call repository.findPaginated with the given parameters and return paginated results", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const _givenCursor = Buffer.from(
        JSON.stringify({
          id: getMockStringId(10),
          createdAt: new Date("2023-01-01T00:00:00.000Z").toISOString(),
        })
      ).toString("base64");
      const givenLimit = 10;
      const givenDesc = true;

      // AND the repository returns items (limit + 1 to check for next page)
      const mockItems = Array.from(
        { length: 11 },
        (_, i) =>
          ({
            id: getMockStringId(i + 2),
            modelId: givenModelId,
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            code: getRandomString(5),
            altLabels: [getRandomString(5)],
            description: getRandomString(20),
            definition: getRandomString(20),
            scopeNote: getRandomString(20),
            regulatedProfessionNote: getRandomString(20),
            occupationType: ObjectTypes.ESCOOccupation,
            isLocalized: false,
            originUri: getRandomString(10),
            occupationGroupCode: getRandomString(5),
            UUIDHistory: [],
            importId: "",
            parent: null,
            children: [],
            requiresSkills: [],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
          }) as IOccupation
      );
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        { id: getMockStringId(10), createdAt: new Date("2023-01-01T00:00:00.000Z") },
        givenLimit,
        givenDesc
      );

      // THEN expect repository.findPaginated to be called with the parameters
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, getMockStringId(10));
      // AND expect the returned result to have items and nextCursor
      expect(actual.items).toHaveLength(10);
      expect(actual.nextCursor).toEqual({ _id: mockItems[9].id, createdAt: mockItems[9].createdAt });
    });

    test("should decode cursor and call repository.findPaginated with correct sort", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const _givenCursor = Buffer.from(
        JSON.stringify({
          id: getMockStringId(10),
          createdAt: new Date("2023-01-01T00:00:00.000Z").toISOString(),
        })
      ).toString("base64");
      const givenLimit = 10;
      const givenDesc = true;

      // AND the repository returns items (limit + 1 to check for next page)
      const mockItems = Array.from(
        { length: 6 },
        (_, i) =>
          ({
            id: getMockStringId(i + 2),
            modelId: givenModelId,
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            code: getRandomString(5),
            altLabels: [getRandomString(5)],
            description: getRandomString(20),
            definition: getRandomString(20),
            scopeNote: getRandomString(20),
            regulatedProfessionNote: getRandomString(20),
            occupationType: ObjectTypes.ESCOOccupation,
            isLocalized: false,
            originUri: getRandomString(10),
            occupationGroupCode: getRandomString(5),
            UUIDHistory: [],
            importId: "",
            parent: null,
            children: [],
            requiresSkills: [],
            createdAt: new Date("2023-01-01T00:00:00.000Z"),
            updatedAt: new Date(),
          }) as IOccupation
      );
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        { id: getMockStringId(10), createdAt: new Date("2023-01-01T00:00:00.000Z") },
        givenLimit,
        givenDesc
      );

      // AND expect repository.findPaginated to be called with the parameters
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, getMockStringId(10));
      // AND expect the returned result to have items and nextCursor
      expect(actual.items).toHaveLength(6);
      expect(actual.nextCursor).toBeNull();
    });

    test("should handle ascending sort order", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenCursor = { id: getMockStringId(2), createdAt: new Date("2023-01-01T00:00:00.000Z") };
      const givenLimit = 10;
      const givenDesc = false; // ascending

      // AND the repository returns items
      const mockItems = Array.from(
        { length: 5 },
        (_, i) =>
          ({
            id: getMockStringId(i + 2),
            modelId: givenModelId,
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            code: getRandomString(5),
            altLabels: [getRandomString(5)],
            description: getRandomString(20),
            definition: getRandomString(20),
            scopeNote: getRandomString(20),
            regulatedProfessionNote: getRandomString(20),
            occupationType: ObjectTypes.ESCOOccupation,
            isLocalized: false,
            originUri: getRandomString(10),
            occupationGroupCode: getRandomString(5),
            UUIDHistory: [],
            importId: "",
            parent: null,
            children: [],
            requiresSkills: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }) as IOccupation
      );
      mockRepository.findPaginated.mockResolvedValue(mockItems);

      // WHEN calling service.findPaginated with desc=false and cursor
      const actual = await service.findPaginated(givenModelId, givenCursor, givenLimit, givenDesc);

      // THEN expect repository.findPaginated to be called with ascending sort and correct cursor
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, givenCursor.id);
      // AND expect the returned result
      expect(actual.items).toHaveLength(5);
    });

    test("should return null nextCursor when no more items", async () => {
      // GIVEN parameters
      const givenModelId = getMockStringId(1);
      const givenLimit = 10;

      // AND the repository returns exactly the limit number of items
      const mockItems = Array.from(
        { length: 10 },
        (_, i) =>
          ({
            id: getMockStringId(i + 2),
            modelId: givenModelId,
            UUID: getRandomString(10),
            preferredLabel: getRandomString(10),
            code: getRandomString(5),
            altLabels: [getRandomString(5)],
            description: getRandomString(20),
            definition: getRandomString(20),
            scopeNote: getRandomString(20),
            regulatedProfessionNote: getRandomString(20),
            occupationType: ObjectTypes.ESCOOccupation,
            isLocalized: false,
            originUri: getRandomString(10),
            occupationGroupCode: getRandomString(5),
            UUIDHistory: [],
            importId: "",
            parent: null,
            children: [],
            requiresSkills: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }) as IOccupation
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

      // AND the repository throws an error
      const givenError = new Error("Repository error");
      mockRepository.findPaginated.mockRejectedValue(givenError);

      // WHEN calling service.findPaginated
      const promise = service.findPaginated(givenModelId, undefined, givenLimit);

      // THEN expect it to throw the error
      await expect(promise).rejects.toThrow(givenError);
    });
  });

  describe("validateModelForOccupation", () => {
    test("should return valid when model exists and is not released", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);

      // AND the model exists and is not released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenModelId,
        released: false,
      } as unknown as IModelInfo);

      // WHEN calling service.validateModelForOccupation
      const actual = await service.validateModelForOccupation(givenModelId);

      // THEN expect it to return valid
      expect(actual).toEqual(null);
    });

    test("should return invalid when model does not exist", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);

      // AND the model does not exist
      mockModelRepository.getModelById.mockResolvedValue(null);

      // WHEN calling service.validateModelForOccupation
      const actual = await service.validateModelForOccupation(givenModelId);

      // THEN expect it to return invalid with error message
      expect(actual).toEqual(ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID);
    });

    test("should return invalid when model is released", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);

      // AND the model exists but is released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenModelId,
        released: true,
      } as unknown as IModelInfo);

      // WHEN calling service.validateModelForOccupation
      const actual = await service.validateModelForOccupation(givenModelId);

      // THEN expect it to return invalid with error message
      expect(actual).toEqual(ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED);
    });

    test("should return invalid when getModelById throws", async () => {
      // GIVEN a modelId
      const givenModelId = getMockStringId(1);

      // AND getModelById throws an error
      const givenError = new Error("Database error");
      mockModelRepository.getModelById.mockRejectedValue(givenError);

      // AND console.error is mocked to suppress output
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // WHEN calling service.validateModelForOccupation
      const actual = await service.validateModelForOccupation(givenModelId);

      // THEN expect it to return invalid with error message
      expect(actual).toEqual(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB);
      // AND console.error was called
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to validate model for occupation creation", givenError);

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
