import { OccupationService } from "./occupation.service";
import {
  IOccupationService,
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "./occupation.service.types";
import { INewOccupationSpecWithoutImportId, IOccupation } from "../_shared/occupation.types";
import { IOccupationRepository } from "../repository/occupation.repository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { ObjectTypes } from "esco/common/objectTypes";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import { randomUUID } from "crypto";
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
      findModelIdsByUUIDs: jest.fn(),
      findParent: jest.fn(),
      findChildren: jest.fn(),
      findSkillsForOccupation: jest.fn(),
    } as unknown as jest.Mocked<IOccupationRepository>;

    mockModelRepository = {
      getModelById: jest.fn(),
      getModelsByIds: jest.fn(),
      getHistory: jest.fn(),
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

      // WHEN calling service.validateModelForOccupation
      const actual = await service.validateModelForOccupation(givenModelId);

      // THEN expect it to return invalid with error message
      expect(actual).toEqual(ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB);
    });
  });

  describe("getParent", () => {
    test("should call repository.findParent with correct arguments", async () => {
      // GIVEN a modelId and occupationId
      const modelId = getMockStringId(1);
      const occupationId = getMockStringId(2);
      // AND repository returns some result
      const expectedResult = { id: "parent_1" } as IOccupation;
      (mockRepository.findParent as jest.Mock).mockResolvedValue(expectedResult);

      // WHEN calling getParent
      const result = await service.getParent(modelId, occupationId);

      // THEN expect repository to be called correctly
      expect(mockRepository.findParent).toHaveBeenCalledWith(modelId, occupationId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("getChildren", () => {
    test("should call repository.findChildren with limit + 1", async () => {
      // GIVEN a modelId, occupationId, limit, and cursor
      const modelId = getMockStringId(1);
      const occupationId = getMockStringId(2);
      const limit = 10;
      const cursor = getMockStringId(3);
      // AND repository returns limit + 1 items (meaning there is a next page)
      const mockItems = Array.from(
        { length: limit + 1 },
        (_, i) =>
          ({
            id: `child_${i}`,
            createdAt: new Date(),
          }) as IOccupation
      );
      (mockRepository.findChildren as jest.Mock).mockResolvedValue(mockItems);

      // WHEN calling getChildren
      const result = await service.getChildren(modelId, occupationId, cursor, limit);

      // THEN expect repository called with limit + 1
      expect(mockRepository.findChildren).toHaveBeenCalledWith(modelId, occupationId, limit + 1, cursor);

      // AND result should handle pagination logic
      expect(result.items).toHaveLength(limit); // sliced
      expect(result.nextCursor).toBeDefined();
      expect(result.nextCursor?._id).toEqual(mockItems[limit - 1].id);
    });

    test("should return null cursor if no more items", async () => {
      // GIVEN less items than limit
      const modelId = getMockStringId(1);
      const occupationId = getMockStringId(2);
      const limit = 10;
      const mockItems = [{ id: "child_1", createdAt: new Date() } as IOccupation];
      (mockRepository.findChildren as jest.Mock).mockResolvedValue(mockItems);

      // WHEN calling getChildren
      const result = await service.getChildren(modelId, occupationId, undefined, limit);

      // THEN
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("getSkills", () => {
    test("should call repository.findSkillsForOccupation with limit + 1", async () => {
      // GIVEN a modelId, occupationId, limit, and cursor
      const modelId = getMockStringId(1);
      const occupationId = getMockStringId(2);
      const limit = 10;
      const cursor = getMockStringId(3);
      // AND repository returns limit + 1 items (meaning there is a next page)
      const mockItems = Array.from({ length: limit + 1 }, (_, i) => ({
        id: `skill_${i}`,
        createdAt: new Date(),
      }));
      (mockRepository.findSkillsForOccupation as jest.Mock).mockResolvedValue(mockItems);

      // WHEN calling getSkills
      const result = await service.getSkills(modelId, occupationId, cursor, limit);

      // THEN expect repository called with limit + 1
      expect(mockRepository.findSkillsForOccupation).toHaveBeenCalledWith(modelId, occupationId, limit + 1, cursor);

      // AND result should handle pagination logic
      expect(result.items).toHaveLength(limit); // sliced
      expect(result.nextCursor).toBeDefined();
      expect(result.nextCursor?._id).toEqual(mockItems[limit - 1].id);
    });

    test("should return null cursor if no more skills", async () => {
      // GIVEN less items than limit
      const modelId = getMockStringId(1);
      const occupationId = getMockStringId(2);
      const limit = 10;
      const mockItems = [{ id: "skill_1", createdAt: new Date() }];
      (mockRepository.findSkillsForOccupation as jest.Mock).mockResolvedValue(mockItems);

      // WHEN calling getSkills
      const result = await service.getSkills(modelId, occupationId, undefined, limit);

      // THEN
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("getHistory", () => {
    // An occupation's UUIDHistory holds its OWN past UUIDs; the service resolves each to the occupation
    // with that UUID, reads its modelId, then fetches that model. This helper builds a model with a given id.
    function givenModelWithId(n: number, modelId: string, uuidHistory: string[]): IModelInfo {
      return {
        ...getIModelInfoMockData(n),
        id: modelId,
        UUID: uuidHistory[0],
        UUIDHistory: uuidHistory,
      };
    }

    test("should return null when the occupation does not exist", async () => {
      // GIVEN the occupation does not exist
      mockRepository.findById.mockResolvedValue(null);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect null and no further lookups
      expect(actual).toBeNull();
      expect(mockRepository.findModelIdsByUUIDs).not.toHaveBeenCalled();
      expect(mockModelRepository.getModelsByIds).not.toHaveBeenCalled();
    });

    test("should return an empty array when the occupation has an empty UUIDHistory", async () => {
      // GIVEN an occupation with an empty UUIDHistory
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [] } as unknown as IOccupation);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect an empty array and no further lookups
      expect(actual).toEqual([]);
      expect(mockRepository.findModelIdsByUUIDs).not.toHaveBeenCalled();
      expect(mockModelRepository.getModelsByIds).not.toHaveBeenCalled();
    });

    test("should resolve UUID->modelId->model, preserve UUIDHistory order, and skip unresolved UUIDs", async () => {
      // GIVEN an occupation whose own UUIDHistory has two resolvable UUIDs with a non-existent one in between
      const givenUuidA = randomUUID();
      const givenUuidMissing = randomUUID();
      const givenUuidB = randomUUID();
      mockRepository.findById.mockResolvedValue({
        UUIDHistory: [givenUuidA, givenUuidMissing, givenUuidB],
      } as unknown as IOccupation);

      // AND uuidA/uuidB resolve to occupations in models A and B respectively (missing UUID resolves to nothing)
      const givenModelAId = getMockStringId(10);
      const givenModelBId = getMockStringId(20);
      mockRepository.findModelIdsByUUIDs.mockResolvedValue([
        // returned out of input order to prove ordering comes from UUIDHistory
        { UUID: givenUuidB, modelId: givenModelBId },
        { UUID: givenUuidA, modelId: givenModelAId },
      ]);

      // AND the models are fetched by id (returned out of order)
      const givenModelAHistoryUuid = randomUUID();
      const givenModelBHistoryUuid = randomUUID();
      const givenModelA = givenModelWithId(1, givenModelAId, [givenModelAHistoryUuid]);
      const givenModelB = givenModelWithId(2, givenModelBId, [givenModelBHistoryUuid]);
      mockModelRepository.getModelsByIds.mockResolvedValue([givenModelB, givenModelA]);

      // AND the models' own modelHistory references resolve
      mockModelRepository.getHistory.mockResolvedValue([
        {
          id: givenModelA.id,
          UUID: givenModelAHistoryUuid,
          name: givenModelA.name,
          version: givenModelA.version,
          localeShortCode: givenModelA.locale.shortCode,
        },
        {
          id: givenModelB.id,
          UUID: givenModelBHistoryUuid,
          name: givenModelB.name,
          version: givenModelB.version,
          localeShortCode: givenModelB.locale.shortCode,
        },
      ]);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect the two models in the occupation's UUIDHistory order (A before B), missing skipped
      expect(actual).not.toBeNull();
      expect(actual).toHaveLength(2);
      expect(actual![0].model).toEqual(givenModelA);
      expect(actual![1].model).toEqual(givenModelB);
      // AND each entry carries the resolved modelHistory details for its model's own UUIDHistory
      expect(actual![0].modelHistoryDetails).toEqual([
        {
          id: givenModelA.id,
          UUID: givenModelAHistoryUuid,
          name: givenModelA.name,
          version: givenModelA.version,
          localeShortCode: givenModelA.locale.shortCode,
        },
      ]);
      // AND resolution uses single batched queries (no N+1): UUIDs -> modelIds, then modelIds -> models
      expect(mockRepository.findModelIdsByUUIDs).toHaveBeenCalledTimes(1);
      expect(mockRepository.findModelIdsByUUIDs).toHaveBeenCalledWith([givenUuidA, givenUuidMissing, givenUuidB]);
      expect(mockModelRepository.getModelsByIds).toHaveBeenCalledTimes(1);
      expect(mockModelRepository.getModelsByIds).toHaveBeenCalledWith([givenModelBId, givenModelAId]);
    });

    test("should return a model at most once even if several history UUIDs map to the same model", async () => {
      // GIVEN two of the occupation's historical UUIDs resolve to the SAME model
      const givenUuid1 = randomUUID();
      const givenUuid2 = randomUUID();
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [givenUuid1, givenUuid2] } as unknown as IOccupation);
      const givenModelId = getMockStringId(10);
      mockRepository.findModelIdsByUUIDs.mockResolvedValue([
        { UUID: givenUuid1, modelId: givenModelId },
        { UUID: givenUuid2, modelId: givenModelId },
      ]);
      const givenModel = givenModelWithId(1, givenModelId, [randomUUID()]);
      mockModelRepository.getModelsByIds.mockResolvedValue([givenModel]);
      mockModelRepository.getHistory.mockResolvedValue([]);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN the model appears only once
      expect(actual).toHaveLength(1);
      expect(actual![0].model).toEqual(givenModel);
    });

    test("should fall back to null reference fields when a model's UUIDHistory entry is not resolved", async () => {
      // GIVEN an occupation resolving to one model whose own UUIDHistory contains an unresolved UUID
      const givenUuid = randomUUID();
      const givenModelId = getMockStringId(10);
      const givenResolvedHistoryUuid = randomUUID();
      const givenUnresolvedHistoryUuid = randomUUID();
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [givenUuid] } as unknown as IOccupation);
      mockRepository.findModelIdsByUUIDs.mockResolvedValue([{ UUID: givenUuid, modelId: givenModelId }]);
      const givenModel = givenModelWithId(1, givenModelId, [givenResolvedHistoryUuid, givenUnresolvedHistoryUuid]);
      mockModelRepository.getModelsByIds.mockResolvedValue([givenModel]);
      // AND getHistory only resolves the first of the model's UUIDHistory entries
      mockModelRepository.getHistory.mockResolvedValue([
        {
          id: givenModel.id,
          UUID: givenResolvedHistoryUuid,
          name: givenModel.name,
          version: givenModel.version,
          localeShortCode: givenModel.locale.shortCode,
        },
      ]);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN the unresolved history UUID is represented with null fields
      expect(actual![0].modelHistoryDetails).toEqual([
        {
          id: givenModel.id,
          UUID: givenResolvedHistoryUuid,
          name: givenModel.name,
          version: givenModel.version,
          localeShortCode: givenModel.locale.shortCode,
        },
        { id: null, UUID: givenUnresolvedHistoryUuid, name: null, version: null, localeShortCode: null },
      ]);
    });
  });
});
