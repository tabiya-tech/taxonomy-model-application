import { OccupationService } from "./occupation.service";
import {
  IOccupationService,
  ModelForOccupationValidationErrorCode,
  OccupationModelValidationError,
} from "./occupation.service.types";
import {
  INewOccupationSpecWithoutImportId,
  IOccupation,
  IPartialUpdateOccupationSpec,
  IUpdateOccupationSpec,
} from "../_shared/occupation.types";
import { IOccupationRepository } from "../repository/occupation.repository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { ObjectTypes } from "esco/common/objectTypes";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { IModelInfo } from "modelInfo/modelInfo.types";
import mongoose from "mongoose";
import { IEntityEmbeddingRepository } from "embeddings/entityEmbeddings/entityEmbeddingRepository";
import { IOccupationEmbeddingDoc } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IEmbeddingProcessStateRepository } from "embeddings/embeddingProcessState/embeddingProcessStateRepository";
import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";
import { EmbeddableField } from "embeddings/service/types";
import { IEmbeddingModelService } from "embeddings/models/modelsServiceTypes";
import { decodeCursor } from "../_shared/pagination/decodeCursor";
import { encodeCursor } from "../_shared/pagination/encodeCursor";
import { decodeSearchCursor, encodeSearchCursor } from "esco/common/searchCursor";
import { OccupationsEmbeddingsVectorSearchIndexName } from "embeddings/entityEmbeddings/vectorSearchIndex.constant";
import { getIOccupationMockData } from "../_shared/testDataHelper";

// Mock the module at the top level
// jest.mock("server/repositoryRegistry/repositoryRegistry");

describe("Test the OccupationService", () => {
  let service: IOccupationService;
  let mockRepository: jest.Mocked<IOccupationRepository>;
  let mockModelRepository: jest.Mocked<IModelRepository>;
  let mockOccupationEmbeddingRepository: jest.Mocked<IEntityEmbeddingRepository<IOccupationEmbeddingDoc>>;
  let mockEmbeddingProcessStateRepository: jest.Mocked<IEmbeddingProcessStateRepository>;
  let mockEmbeddingModelService: jest.Mocked<IEmbeddingModelService>;
  let mockEmbeddingModelServiceFactory: jest.Mock<IEmbeddingModelService, [string]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = {
      Model: {} as unknown as mongoose.Model<unknown>,
      create: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findPaginated: jest.fn(),
      findByIds: jest.fn(),
      getOccupationByUUID: jest.fn(),
      findParent: jest.fn(),
      findChildren: jest.fn(),
      findSkillsForOccupation: jest.fn(),
      update: jest.fn(),
      patch: jest.fn(),
      findHistoryReferencesByUUIDs: jest.fn(),
    } as unknown as jest.Mocked<IOccupationRepository>;

    mockModelRepository = {
      getModelById: jest.fn(),
      getModelsByIds: jest.fn(),
    } as unknown as jest.Mocked<IModelRepository>;

    mockOccupationEmbeddingRepository = {
      Model: {} as unknown as mongoose.Model<unknown>,
      upsert: jest.fn(),
      findByEntity: jest.fn(),
      vectorSearch: jest.fn(),
    } as unknown as jest.Mocked<IEntityEmbeddingRepository<IOccupationEmbeddingDoc>>;

    mockEmbeddingProcessStateRepository = {
      create: jest.fn(),
      update: jest.fn(),
      incrementCounts: jest.fn(),
      findById: jest.fn(),
      findPendingByModelId: jest.fn(),
      findCompletedByModelId: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<IEmbeddingProcessStateRepository>;

    mockEmbeddingModelService = {
      generateEmbedding: jest.fn(),
      generateEmbeddingBatch: jest.fn(),
    } as unknown as jest.Mocked<IEmbeddingModelService>;
    mockEmbeddingModelServiceFactory = jest.fn().mockReturnValue(mockEmbeddingModelService);

    service = new OccupationService(
      mockRepository,
      mockModelRepository,
      mockOccupationEmbeddingRepository,
      mockEmbeddingProcessStateRepository,
      mockEmbeddingModelServiceFactory
    );
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

  describe("searchPaginated", () => {
    const givenSearchValue = "software engineer";
    const givenSearchFields = [EmbeddableField.preferredLabel, EmbeddableField.description];

    function givenOccupations(count: number, modelId: string): IOccupation[] {
      return Array.from({ length: count }, (_, i) => {
        const occupation = getIOccupationMockData(i + 2);
        occupation.id = getMockStringId(i + 2);
        occupation.modelId = modelId;
        occupation.createdAt = new Date("2023-01-01T00:00:00.000Z");
        return occupation;
      });
    }

    describe("regex search (unreleased model)", () => {
      test("should regex-search and return a keyset cursor when the model is not released", async () => {
        // GIVEN an unreleased model
        const givenModelId = getMockStringId(1);
        mockModelRepository.getModelById.mockResolvedValue({ released: false } as IModelInfo);
        // AND the repository returns limit + 1 matches to signal a next page
        const givenLimit = 2;
        const actualMatches = givenOccupations(givenLimit + 1, givenModelId);
        mockRepository.findPaginated.mockResolvedValue(actualMatches);

        // WHEN searching without a cursor
        const actual = await service.searchPaginated(
          givenModelId,
          givenSearchValue,
          givenSearchFields,
          undefined,
          givenLimit
        );

        // THEN expect the regex search to have been used (not the vector search)
        expect(mockRepository.findPaginated).toHaveBeenCalledWith(
          givenModelId,
          givenLimit + 1,
          -1,
          undefined,
          undefined,
          {
            value: givenSearchValue,
            fields: givenSearchFields,
          }
        );
        expect(mockOccupationEmbeddingRepository.vectorSearch).not.toHaveBeenCalled();
        // AND expect a page of `limit` items and a keyset nextCursor pointing at the last item
        expect(actual.items).toHaveLength(givenLimit);
        const decoded = decodeCursor(actual.nextCursor as string);
        expect(decoded.id).toEqual(actual.items[givenLimit - 1].id);
      });

      test("should return a null cursor when there is no next page", async () => {
        // GIVEN an unreleased model that returns fewer than limit + 1 matches
        const givenModelId = getMockStringId(1);
        mockModelRepository.getModelById.mockResolvedValue({ released: false } as IModelInfo);
        mockRepository.findPaginated.mockResolvedValue(givenOccupations(1, givenModelId));

        // WHEN searching
        const actual = await service.searchPaginated(givenModelId, givenSearchValue, givenSearchFields, undefined, 10);

        // THEN expect no next cursor
        expect(actual.nextCursor).toBeNull();
        expect(actual.items).toHaveLength(1);
      });

      test("should decode the given keyset cursor and forward its id to the repository", async () => {
        // GIVEN an unreleased model and a keyset cursor
        const givenModelId = getMockStringId(1);
        mockModelRepository.getModelById.mockResolvedValue({ released: false } as IModelInfo);
        mockRepository.findPaginated.mockResolvedValue([]);
        const givenCursor = encodeCursor(getMockStringId(50), new Date("2023-05-05T00:00:00.000Z"));

        // WHEN searching with the cursor
        await service.searchPaginated(givenModelId, givenSearchValue, givenSearchFields, givenCursor, 10);

        // THEN expect the decoded cursor id to have been forwarded to the repository
        expect(mockRepository.findPaginated).toHaveBeenCalledWith(
          givenModelId,
          11,
          -1,
          getMockStringId(50),
          undefined,
          {
            value: givenSearchValue,
            fields: givenSearchFields,
          }
        );
      });

      test("should fall back to regex when the model is released but has no completed embedding process", async () => {
        // GIVEN a released model without a completed embedding process
        const givenModelId = getMockStringId(1);
        mockModelRepository.getModelById.mockResolvedValue({ released: true } as IModelInfo);
        mockEmbeddingProcessStateRepository.findCompletedByModelId.mockResolvedValue(null);
        mockRepository.findPaginated.mockResolvedValue(givenOccupations(1, givenModelId));

        // WHEN searching
        const actual = await service.searchPaginated(givenModelId, givenSearchValue, givenSearchFields, undefined, 10);

        // THEN expect the regex search to have been used and no vector search attempted
        expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, undefined, undefined, {
          value: givenSearchValue,
          fields: givenSearchFields,
        });
        expect(mockOccupationEmbeddingRepository.vectorSearch).not.toHaveBeenCalled();
        expect(actual.items).toHaveLength(1);
      });
    });

    describe("vector search (released model)", () => {
      const givenEmbeddingServiceId = "embedding-service-id";

      beforeEach(() => {
        mockModelRepository.getModelById.mockResolvedValue({ released: true } as IModelInfo);
        mockEmbeddingProcessStateRepository.findCompletedByModelId.mockResolvedValue({
          embeddingServiceId: givenEmbeddingServiceId,
        } as IEmbeddingProcessState);
        mockEmbeddingModelService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      });

      test("should vector-search, hydrate the hits in ranked order and return an offset cursor", async () => {
        // GIVEN a released model whose embeddings exist
        const givenModelId = getMockStringId(1);
        const givenLimit = 2;
        // AND the vector search returns limit + 1 ranked hits (best first)
        const rankedOccupations = givenOccupations(givenLimit + 1, givenModelId);
        mockOccupationEmbeddingRepository.vectorSearch.mockResolvedValue(
          rankedOccupations.map((occupation, i) => ({ entityId: occupation.id, score: 1 - i * 0.1 }))
        );
        // AND findByIds returns the hydrated occupations in a DIFFERENT (unranked) order
        mockRepository.findByIds.mockResolvedValue([...rankedOccupations].reverse());

        // WHEN searching without a cursor
        const actual = await service.searchPaginated(
          givenModelId,
          givenSearchValue,
          givenSearchFields,
          undefined,
          givenLimit
        );

        // THEN expect the query value to have been embedded with the model's embedding service
        expect(mockEmbeddingModelServiceFactory).toHaveBeenCalledWith(givenEmbeddingServiceId);
        expect(mockEmbeddingModelService.generateEmbedding).toHaveBeenCalledWith(givenSearchValue);
        // AND the vector search to have been scoped to the model, service, fields and paginated by offset 0
        expect(mockOccupationEmbeddingRepository.vectorSearch).toHaveBeenCalledWith({
          indexName: OccupationsEmbeddingsVectorSearchIndexName,
          modelId: givenModelId,
          embeddingServiceId: givenEmbeddingServiceId,
          queryVector: [0.1, 0.2, 0.3],
          searchFields: givenSearchFields,
          limit: givenLimit + 1,
          offset: 0,
        });
        // AND the page to hold `limit` items ordered by relevance (the ranked-hit order, not findByIds order)
        expect(actual.items).toHaveLength(givenLimit);
        expect(actual.items.map((o) => o.id)).toEqual(rankedOccupations.slice(0, givenLimit).map((o) => o.id));
        // AND the nextCursor to be an offset cursor pointing at the next page
        expect(decodeSearchCursor(actual.nextCursor as string)).toEqual(givenLimit);
      });

      test("should apply the offset from the given cursor and advance it", async () => {
        // GIVEN a released model and an offset cursor (page 2)
        const givenModelId = getMockStringId(1);
        const givenLimit = 5;
        const givenCursor = encodeSearchCursor(5);
        const rankedOccupations = givenOccupations(givenLimit + 1, givenModelId);
        mockOccupationEmbeddingRepository.vectorSearch.mockResolvedValue(
          rankedOccupations.map((occupation, i) => ({ entityId: occupation.id, score: 1 - i * 0.1 }))
        );
        mockRepository.findByIds.mockResolvedValue(rankedOccupations);

        // WHEN searching with the cursor
        const actual = await service.searchPaginated(
          givenModelId,
          givenSearchValue,
          givenSearchFields,
          givenCursor,
          givenLimit
        );

        // THEN expect the offset to have been forwarded and advanced by `limit`
        expect(mockOccupationEmbeddingRepository.vectorSearch).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 5, limit: givenLimit + 1 })
        );
        expect(decodeSearchCursor(actual.nextCursor as string)).toEqual(10);
      });

      test("should return a null cursor when the vector search has no next page", async () => {
        // GIVEN a released model whose vector search returns fewer than limit + 1 hits
        const givenModelId = getMockStringId(1);
        const rankedOccupations = givenOccupations(2, givenModelId);
        mockOccupationEmbeddingRepository.vectorSearch.mockResolvedValue(
          rankedOccupations.map((occupation, i) => ({ entityId: occupation.id, score: 1 - i * 0.1 }))
        );
        mockRepository.findByIds.mockResolvedValue(rankedOccupations);

        // WHEN searching
        const actual = await service.searchPaginated(givenModelId, givenSearchValue, givenSearchFields, undefined, 10);

        // THEN expect no next cursor and all items returned
        expect(actual.nextCursor).toBeNull();
        expect(actual.items).toHaveLength(2);
      });
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

  describe("update", () => {
    const buildSpec = (): IUpdateOccupationSpec => ({
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
    });

    test("should call repository.update with the given spec when model validation passes", async () => {
      // GIVEN a full update spec
      const givenId = getMockStringId(2);
      const givenSpec = buildSpec();

      // AND the model is not released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenSpec.modelId,
        released: false,
      } as unknown as IModelInfo);

      // AND the repository returns the updated occupation
      const givenUpdatedOccupation: IOccupation = {
        ...givenSpec,
        id: givenId,
        UUID: getRandomString(10),
        parent: null,
        children: [],
        requiresSkills: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        importId: "",
      };
      mockRepository.update = jest.fn().mockResolvedValue(givenUpdatedOccupation);

      // WHEN calling service.update
      const actual = await service.update(givenId, givenSpec.modelId, givenSpec);

      // THEN expect repository.update to be called with the spec
      expect(mockRepository.update).toHaveBeenCalledWith(givenId, givenSpec.modelId, givenSpec);
      // AND expect the returned occupation
      expect(actual).toEqual(givenUpdatedOccupation);
    });

    test("should return null if repository.update returns null (occupation not found)", async () => {
      // GIVEN a full update spec
      const givenId = getMockStringId(2);
      const givenSpec = buildSpec();

      // AND the model is not released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenSpec.modelId,
        released: false,
      } as unknown as IModelInfo);

      // AND the repository returns null (occupation not found)
      mockRepository.update = jest.fn().mockResolvedValue(null);

      // WHEN calling service.update
      const actual = await service.update(givenId, givenSpec.modelId, givenSpec);

      // THEN expect null
      expect(actual).toBeNull();
    });

    test("should throw OccupationModelValidationError if model is not found", async () => {
      // GIVEN a full update spec
      const givenId = getMockStringId(2);
      const givenSpec = buildSpec();

      // AND the model does not exist
      mockModelRepository.getModelById.mockResolvedValue(null);

      // WHEN calling service.update
      // THEN expect it to throw
      await expect(service.update(givenId, givenSpec.modelId, givenSpec)).rejects.toThrow(
        OccupationModelValidationError
      );
    });

    test("should throw OccupationModelValidationError if model is released", async () => {
      // GIVEN a full update spec
      const givenId = getMockStringId(2);
      const givenSpec = buildSpec();

      // AND the model is released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenSpec.modelId,
        released: true,
      } as unknown as IModelInfo);

      // WHEN calling service.update
      // THEN expect it to throw
      await expect(service.update(givenId, givenSpec.modelId, givenSpec)).rejects.toThrow(
        OccupationModelValidationError
      );
    });

    test("should rethrow if repository.update throws", async () => {
      // GIVEN a full update spec
      const givenId = getMockStringId(2);
      const givenSpec = buildSpec();

      // AND the model is not released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenSpec.modelId,
        released: false,
      } as unknown as IModelInfo);

      // AND the repository throws
      const givenError = new Error("Repository error");
      mockRepository.update = jest.fn().mockRejectedValue(givenError);

      // WHEN calling service.update
      // THEN expect it to rethrow
      await expect(service.update(givenId, givenSpec.modelId, givenSpec)).rejects.toThrow(givenError);
    });
  });

  describe("patch", () => {
    test("should call repository.patch with the given partial spec when model validation passes", async () => {
      // GIVEN a partial patch spec (only preferredLabel)
      const givenId = getMockStringId(2);
      const givenModelId = getMockStringId(1);
      const givenSpec: IPartialUpdateOccupationSpec = { preferredLabel: getRandomString(10) };

      // AND the model is not released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenModelId,
        released: false,
      } as unknown as IModelInfo);

      // AND the repository returns the updated occupation
      const givenUpdatedOccupation: IOccupation = {
        id: givenId,
        modelId: givenModelId,
        UUID: getRandomString(10),
        preferredLabel: givenSpec.preferredLabel!,
        code: getRandomString(5),
        altLabels: [],
        description: getRandomString(10),
        definition: getRandomString(10),
        scopeNote: getRandomString(10),
        regulatedProfessionNote: getRandomString(10),
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
      mockRepository.patch = jest.fn().mockResolvedValue(givenUpdatedOccupation);

      // WHEN calling service.patch
      const actual = await service.patch(givenId, givenModelId, givenSpec);

      // THEN expect repository.patch to be called with the spec
      expect(mockRepository.patch).toHaveBeenCalledWith(givenId, givenModelId, givenSpec);
      // AND expect the returned occupation
      expect(actual).toEqual(givenUpdatedOccupation);
    });

    test("should return null if repository.patch returns null (occupation not found)", async () => {
      // GIVEN a partial patch spec
      const givenId = getMockStringId(2);
      const givenModelId = getMockStringId(1);
      const givenSpec: IPartialUpdateOccupationSpec = { description: "Updated" };

      // AND the model is not released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenModelId,
        released: false,
      } as unknown as IModelInfo);

      // AND the repository returns null
      mockRepository.patch = jest.fn().mockResolvedValue(null);

      // WHEN calling service.patch
      const actual = await service.patch(givenId, givenModelId, givenSpec);

      // THEN expect null
      expect(actual).toBeNull();
    });

    test("should throw OccupationModelValidationError if model is released", async () => {
      // GIVEN a partial patch spec
      const givenId = getMockStringId(2);
      const givenModelId = getMockStringId(1);
      const givenSpec: IPartialUpdateOccupationSpec = { preferredLabel: "Label" };

      // AND the model is released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenModelId,
        released: true,
      } as unknown as IModelInfo);

      // WHEN calling service.patch
      // THEN expect it to throw
      await expect(service.patch(givenId, givenModelId, givenSpec)).rejects.toThrow(OccupationModelValidationError);
    });

    test("should throw OccupationModelValidationError if model is not found", async () => {
      // GIVEN a partial patch spec
      const givenId = getMockStringId(2);
      const givenModelId = getMockStringId(1);
      const givenSpec: IPartialUpdateOccupationSpec = { preferredLabel: "Label" };

      // AND the model does not exist
      mockModelRepository.getModelById.mockResolvedValue(null);

      // WHEN calling service.patch
      // THEN expect it to throw
      await expect(service.patch(givenId, givenModelId, givenSpec)).rejects.toThrow(OccupationModelValidationError);
    });

    test("should rethrow if repository.patch throws", async () => {
      // GIVEN a partial patch spec
      const givenId = getMockStringId(2);
      const givenModelId = getMockStringId(1);
      const givenSpec: IPartialUpdateOccupationSpec = { preferredLabel: "Label" };

      // AND the model is not released
      mockModelRepository.getModelById.mockResolvedValue({
        id: givenModelId,
        released: false,
      } as unknown as IModelInfo);

      // AND the repository throws
      const givenError = new Error("Repository patch error");
      mockRepository.patch = jest.fn().mockRejectedValue(givenError);

      // WHEN calling service.patch
      // THEN expect it to rethrow
      await expect(service.patch(givenId, givenModelId, givenSpec)).rejects.toThrow(givenError);
    });
  });

  describe("getHistory", () => {
    test("should return null if occupation not found", async () => {
      mockRepository.findById.mockResolvedValue(null);
      const actual = await service.getHistory(getMockStringId(1));
      expect(actual).toBeNull();
    });

    test("should return empty array if UUIDHistory is missing or empty", async () => {
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [] } as unknown as IOccupation);
      const actual = await service.getHistory(getMockStringId(1));
      expect(actual).toEqual([]);
    });

    test("should return history entries successfully", async () => {
      const uuid1 = "uuid-1";
      const uuid2 = "uuid-2";
      const uuid3 = "uuid-3";
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [uuid1, uuid2, uuid3] } as unknown as IOccupation);

      mockRepository.findHistoryReferencesByUUIDs.mockResolvedValue([
        {
          UUID: uuid1,
          modelId: getMockStringId(1),
          reference: { id: "ref-1", modelId: getMockStringId(1) } as unknown as IOccupation,
        },
        {
          UUID: uuid2,
          modelId: getMockStringId(2),
          reference: { id: "ref-2", modelId: getMockStringId(2) } as unknown as IOccupation,
        },
        { UUID: uuid3, modelId: null, reference: null }, // testing missing modelId / reference line 168
      ]);

      mockModelRepository.getModelsByIds.mockResolvedValue([
        {
          id: getMockStringId(1),
          name: "Model 1",
          UUID: "mock-uuid-1",
          version: "1.0",
          locale: { shortCode: "en" },
        } as IModelInfo,
        // Model 2 intentionally omitted to test missing model logic line 172
      ]);

      const actual = await service.getHistory(getMockStringId(1));

      expect(actual).toEqual([
        {
          entity: { id: "ref-1", modelId: getMockStringId(1) },
          model: {
            id: getMockStringId(1),
            name: "Model 1",
            localeShortCode: "en",
            UUID: "mock-uuid-1",
            version: "1.0",
          },
        },
      ]);
    });

    test("should skip duplicate models in history (seenModelIds)", async () => {
      const uuid1 = "uuid-1";
      const uuid2 = "uuid-2";
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [uuid1, uuid2] } as unknown as IOccupation);

      mockRepository.findHistoryReferencesByUUIDs.mockResolvedValue([
        {
          UUID: uuid1,
          modelId: getMockStringId(1),
          reference: { id: "ref-1", modelId: getMockStringId(1) } as unknown as IOccupation,
        },
        {
          UUID: uuid2,
          modelId: getMockStringId(1),
          reference: { id: "ref-2", modelId: getMockStringId(1) } as unknown as IOccupation,
        }, // Duplicate model
      ]);

      mockModelRepository.getModelsByIds.mockResolvedValue([
        {
          id: getMockStringId(1),
          name: "Model 1",
          UUID: "mock-uuid-1",
          version: "1.0",
          locale: { shortCode: "en" },
        } as IModelInfo,
      ]);

      const actual = await service.getHistory(getMockStringId(1));

      expect(actual).toEqual([
        {
          entity: { id: "ref-1", modelId: getMockStringId(1) },
          model: {
            id: getMockStringId(1),
            name: "Model 1",
            localeShortCode: "en",
            UUID: "mock-uuid-1",
            version: "1.0",
          },
        },
      ]);
    });

    test("should return empty array when UUIDHistory is undefined (nullish fallback)", async () => {
      // GIVEN an occupation whose UUIDHistory property is missing/undefined
      mockRepository.findById.mockResolvedValue({} as unknown as IOccupation);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN it should return an empty array (the ?? [] branch on line 152)
      expect(actual).toEqual([]);
      expect(mockRepository.findHistoryReferencesByUUIDs).not.toHaveBeenCalled();
    });

    test("should return empty history when all history references have null modelId", async () => {
      // GIVEN an occupation with UUIDs
      const uuid1 = "uuid-1";
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [uuid1] } as unknown as IOccupation);

      // AND all references have null modelId (so modelIds array will be empty)
      mockRepository.findHistoryReferencesByUUIDs.mockResolvedValue([{ UUID: uuid1, modelId: null, reference: null }]);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN getModelsByIds should NOT be called (empty modelIds branch on line 161)
      expect(mockModelRepository.getModelsByIds).not.toHaveBeenCalled();
      // AND result should be an empty history
      expect(actual).toEqual([]);
    });
  });
});
