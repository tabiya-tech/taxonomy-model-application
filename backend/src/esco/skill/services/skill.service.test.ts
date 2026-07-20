import "_test_utilities/consoleMock";
import { SkillService } from "../services/skill.service";
import { ISkillService } from "../services/skill.service.types";
import {
  ISkill,
  ModelForSkillValidationErrorCode,
  INewSkillSpecWithoutImportId,
  SkillType,
  ReuseLevel,
} from "../_shared/skill.types";
import { SkillModelValidationError } from "../services/skill.service.types";
import { ISkillRepository } from "../repository/skill.repository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getISkillMockData } from "../_shared/testDataHelper";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { IModelRepository } from "modelInfo/modelInfoRepository";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillReference } from "../_shared/skill.types";
import { IEntityEmbeddingRepository } from "embeddings/entityEmbeddings/entityEmbeddingRepository";
import { ISkillEmbeddingDoc } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IEmbeddingProcessStateRepository } from "embeddings/embeddingProcessState/embeddingProcessStateRepository";
import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";
import { EmbeddableField } from "embeddings/service/types";
import { IEmbeddingModelService } from "embeddings/models/modelsServiceTypes";
import { decodeCursor } from "esco/occupations/_shared/pagination/decodeCursor";
import { encodeCursor } from "esco/occupations/_shared/pagination/encodeCursor";
import { decodeSearchCursor, encodeSearchCursor } from "../_shared/searchCursor";
import { SkillsEmbeddingsVectorSearchIndexName } from "embeddings/entityEmbeddings/vectorSearchIndex.constant";

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
  let mockSkillEmbeddingRepository: jest.Mocked<IEntityEmbeddingRepository<ISkillEmbeddingDoc>>;
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
      findParents: jest.fn(),
      findChildren: jest.fn(),
      findOccupationsForSkill: jest.fn(),
      findRelatedSkills: jest.fn(),
      findHistoryReferencesByUUIDs: jest.fn(),
      update: jest.fn(),
      patch: jest.fn(),
    } as unknown as jest.Mocked<ISkillRepository>;

    mockModelRepository = {
      getModelById: jest.fn(),
      getModelsByIds: jest.fn(),
      releaseModel: jest.fn(),
      getHistory: jest.fn(),
    } as unknown as jest.Mocked<IModelRepository>;

    mockSkillEmbeddingRepository = {
      Model: {} as unknown as mongoose.Model<unknown>,
      upsert: jest.fn(),
      findByEntity: jest.fn(),
      vectorSearch: jest.fn(),
    } as unknown as jest.Mocked<IEntityEmbeddingRepository<ISkillEmbeddingDoc>>;

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

    service = new SkillService(
      mockRepository,
      mockModelRepository,
      mockSkillEmbeddingRepository,
      mockEmbeddingProcessStateRepository,
      mockEmbeddingModelServiceFactory
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("create", () => {
    test("should call repository.create when model is valid", async () => {
      const givenSpec: INewSkillSpecWithoutImportId = {
        modelId: getMockStringId(1),
        preferredLabel: "Test",
        originUri: "https://example.com",
        UUIDHistory: [],
        altLabels: [],
        definition: "",
        description: "",
        scopeNote: "",
        skillType: "skill/competence" as SkillType,
        reuseLevel: "cross-sector" as ReuseLevel,
        isLocalized: false,
      };
      const expectedSkill: ISkill = getISkillMockData(1, givenSpec.modelId);
      mockRepository.create.mockResolvedValue(expectedSkill);
      mockModelRepository.getModelById.mockResolvedValue({ released: false } as IModelInfo);

      const actual = await service.create(givenSpec);

      expect(mockModelRepository.getModelById).toHaveBeenCalledWith(givenSpec.modelId);
      expect(mockRepository.create).toHaveBeenCalledWith(givenSpec);
      expect(actual).toEqual(expectedSkill);
    });

    test("should throw SkillModelValidationError if model not found", async () => {
      const givenSpec: INewSkillSpecWithoutImportId = {
        modelId: getMockStringId(1),
        preferredLabel: "Test",
        originUri: "https://example.com",
        UUIDHistory: [],
        altLabels: [],
        definition: "",
        description: "",
        scopeNote: "",
        skillType: "skill/competence" as SkillType,
        reuseLevel: "cross-sector" as ReuseLevel,
        isLocalized: false,
      };
      mockModelRepository.getModelById.mockResolvedValue(null);

      await expect(service.create(givenSpec)).rejects.toThrow(SkillModelValidationError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    test("should throw SkillModelValidationError if model is released", async () => {
      const givenSpec: INewSkillSpecWithoutImportId = {
        modelId: getMockStringId(1),
        preferredLabel: "Test",
        originUri: "https://example.com",
        UUIDHistory: [],
        altLabels: [],
        definition: "",
        description: "",
        scopeNote: "",
        skillType: "skill/competence" as SkillType,
        reuseLevel: "cross-sector" as ReuseLevel,
        isLocalized: false,
      };
      mockModelRepository.getModelById.mockResolvedValue({ released: true } as IModelInfo);

      await expect(service.create(givenSpec)).rejects.toThrow(SkillModelValidationError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    test("should throw SkillModelValidationError when model DB fetch fails", async () => {
      const givenSpec: INewSkillSpecWithoutImportId = {
        modelId: getMockStringId(1),
        preferredLabel: "Test",
        originUri: "https://example.com",
        UUIDHistory: [],
        altLabels: [],
        definition: "",
        description: "",
        scopeNote: "",
        skillType: "skill/competence" as SkillType,
        reuseLevel: "cross-sector" as ReuseLevel,
        isLocalized: false,
      };
      mockModelRepository.getModelById.mockRejectedValue(new Error("DB error"));

      await expect(service.create(givenSpec)).rejects.toThrow(SkillModelValidationError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    test("should throw SkillModelValidationError if model validation fails during update", async () => {
      mockModelRepository.getModelById.mockResolvedValue(null);
      await expect(service.update(getMockStringId(1), getMockStringId(2), {} as never)).rejects.toThrow(
        SkillModelValidationError
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    test("should call repository.update when model validation passes", async () => {
      const givenId = getMockStringId(1);
      const givenModelId = getMockStringId(2);
      const givenSpec = {
        preferredLabel: "Updated",
        originUri: "https://example.com",
        altLabels: [],
        definition: "",
        description: "",
        scopeNote: "",
        skillType: "skill/competence" as SkillType,
        reuseLevel: "cross-sector" as ReuseLevel,
        modelId: givenModelId,
        UUIDHistory: [],
        isLocalized: false,
      };
      const expectedSkill: ISkill = getISkillMockData(1, givenModelId);
      mockModelRepository.getModelById.mockResolvedValue({ released: false } as IModelInfo);
      mockRepository.update.mockResolvedValue(expectedSkill);

      const actual = await service.update(givenId, givenModelId, givenSpec);

      expect(mockModelRepository.getModelById).toHaveBeenCalledWith(givenModelId);
      expect(mockRepository.update).toHaveBeenCalledWith(givenId, givenModelId, givenSpec);
      expect(actual).toEqual(expectedSkill);
    });
  });

  describe("patch", () => {
    test("should throw SkillModelValidationError if model validation fails during patch", async () => {
      mockModelRepository.getModelById.mockResolvedValue(null);
      await expect(service.patch(getMockStringId(1), getMockStringId(2), {} as never)).rejects.toThrow(
        SkillModelValidationError
      );
      expect(mockRepository.patch).not.toHaveBeenCalled();
    });

    test("should call repository.patch when model validation passes", async () => {
      const givenId = getMockStringId(1);
      const givenModelId = getMockStringId(2);
      const givenSpec = { preferredLabel: "Patched" };
      const expectedSkill: ISkill = getISkillMockData(1, givenModelId);
      mockModelRepository.getModelById.mockResolvedValue({ released: false } as IModelInfo);
      mockRepository.patch.mockResolvedValue(expectedSkill);

      const actual = await service.patch(givenId, givenModelId, givenSpec);

      expect(mockModelRepository.getModelById).toHaveBeenCalledWith(givenModelId);
      expect(mockRepository.patch).toHaveBeenCalledWith(givenId, givenModelId, givenSpec);
      expect(actual).toEqual(expectedSkill);
    });
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
      // AND an encoded keyset cursor
      const givenCursor = encodeCursor(getMockStringId(10), new Date("2023-01-01T00:00:00.000Z"));

      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        givenCursor,
        givenLimit,
        undefined,
        undefined,
        givenDesc
      );

      // THEN expect repository.findPaginated to have been called with the decoded cursor
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, {
        id: getMockStringId(10),
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
      });
      // AND expect the returned paginated result with an encoded keyset nextCursor
      expect(actual.items).toHaveLength(10);
      const actualDecodedNextCursor = decodeCursor(actual.nextCursor as string);
      expect(actualDecodedNextCursor.id).toEqual(mockItems[9].id);
      expect(actualDecodedNextCursor.createdAt).toEqual(mockItems[9].createdAt);
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
      // AND an encoded keyset cursor
      const givenCursor = encodeCursor(getMockStringId(10), new Date("2023-01-01T00:00:00.000Z"));
      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        givenCursor,
        givenLimit,
        undefined,
        undefined,
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
      const actual = await service.findPaginated(givenModelId, undefined, givenLimit, undefined, undefined, givenDesc);

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
      const givenCursorObj = { id: getMockStringId(10), createdAt: new Date("2023-01-01T00:00:00.000Z") };
      const givenCursor = encodeCursor(givenCursorObj.id, givenCursorObj.createdAt);

      mockRepository.findPaginated.mockResolvedValue([]);

      // WHEN calling service.findPaginated with desc=false and cursor
      await service.findPaginated(givenModelId, givenCursor, givenLimit, undefined, undefined, givenDesc);

      // THEN expect repository.findPaginated to have been called with the ascending sort and decoded cursor
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, givenCursorObj);
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

  describe("constructor", () => {
    test("should default the embedding model service factory when it is not provided", () => {
      // WHEN constructing the service without an explicit embedding model service factory
      // THEN expect it to construct without throwing (the default factory is wired in)
      expect(
        () =>
          new SkillService(
            mockRepository,
            mockModelRepository,
            mockSkillEmbeddingRepository,
            mockEmbeddingProcessStateRepository
          )
      ).not.toThrow();
    });
  });

  describe("findPaginated with a search value", () => {
    const givenSearchValue = "software engineer";
    const givenSearchFields = [EmbeddableField.preferredLabel, EmbeddableField.description];

    function givenSkills(count: number, modelId: string): ISkill[] {
      return Array.from({ length: count }, (_, i) => {
        const skill = getISkillMockData();
        skill.id = getMockStringId(i + 2);
        skill.modelId = modelId;
        skill.createdAt = new Date("2023-01-01T00:00:00.000Z");
        return skill;
      });
    }

    describe("regex search (unreleased model)", () => {
      test("should regex-search and return a keyset cursor when the model is not released", async () => {
        // GIVEN an unreleased model
        const givenModelId = getMockStringId(1);
        mockModelRepository.getModelById.mockResolvedValue({ released: false } as IModelInfo);
        // AND the repository returns limit + 1 matches to signal a next page
        const givenLimit = 2;
        const actualMatches = givenSkills(givenLimit + 1, givenModelId);
        mockRepository.findPaginated.mockResolvedValue(actualMatches);

        // WHEN searching without a cursor
        const actual = await service.findPaginated(
          givenModelId,
          undefined,
          givenLimit,
          givenSearchValue,
          givenSearchFields
        );

        // THEN expect the regex search to have been used (not the vector search)
        expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, givenLimit + 1, -1, undefined, {
          value: givenSearchValue,
          fields: givenSearchFields,
        });
        expect(mockSkillEmbeddingRepository.vectorSearch).not.toHaveBeenCalled();
        // AND expect a page of `limit` items and a keyset (id + createdAt) nextCursor
        expect(actual.items).toHaveLength(givenLimit);
        const decoded = decodeCursor(actual.nextCursor as string);
        expect(decoded.id).toEqual(actual.items[givenLimit - 1].id);
      });

      test("should return a null cursor when there is no next page", async () => {
        // GIVEN an unreleased model that returns fewer than limit + 1 matches
        const givenModelId = getMockStringId(1);
        mockModelRepository.getModelById.mockResolvedValue({ released: false } as IModelInfo);
        mockRepository.findPaginated.mockResolvedValue(givenSkills(1, givenModelId));

        // WHEN searching
        const actual = await service.findPaginated(givenModelId, undefined, 10, givenSearchValue, givenSearchFields);

        // THEN expect no next cursor
        expect(actual.nextCursor).toBeNull();
        expect(actual.items).toHaveLength(1);
      });

      test("should decode the given keyset cursor and pass it to the repository", async () => {
        // GIVEN an unreleased model and a keyset cursor
        const givenModelId = getMockStringId(1);
        mockModelRepository.getModelById.mockResolvedValue({ released: false } as IModelInfo);
        mockRepository.findPaginated.mockResolvedValue([]);
        const givenCursor = encodeCursor(getMockStringId(50), new Date("2023-05-05T00:00:00.000Z"));

        // WHEN searching with the cursor
        await service.findPaginated(givenModelId, givenCursor, 10, givenSearchValue, givenSearchFields);

        // THEN expect the decoded cursor to have been forwarded to the repository
        expect(mockRepository.findPaginated).toHaveBeenCalledWith(
          givenModelId,
          11,
          -1,
          { id: getMockStringId(50), createdAt: new Date("2023-05-05T00:00:00.000Z") },
          { value: givenSearchValue, fields: givenSearchFields }
        );
      });

      test("should fall back to regex when the model is released but has no completed embedding process", async () => {
        // GIVEN a released model without a completed embedding process
        const givenModelId = getMockStringId(1);
        mockModelRepository.getModelById.mockResolvedValue({ released: true } as IModelInfo);
        mockEmbeddingProcessStateRepository.findCompletedByModelId.mockResolvedValue(null);
        mockRepository.findPaginated.mockResolvedValue(givenSkills(1, givenModelId));

        // WHEN searching
        const actual = await service.findPaginated(givenModelId, undefined, 10, givenSearchValue, givenSearchFields);

        // THEN expect the regex search to have been used and no vector search attempted
        expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, undefined, {
          value: givenSearchValue,
          fields: givenSearchFields,
        });
        expect(mockSkillEmbeddingRepository.vectorSearch).not.toHaveBeenCalled();
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
        const rankedSkills = givenSkills(givenLimit + 1, givenModelId);
        mockSkillEmbeddingRepository.vectorSearch.mockResolvedValue(
          rankedSkills.map((skill, i) => ({ entityId: skill.id, score: 1 - i * 0.1 }))
        );
        // AND findByIds returns the hydrated skills in a DIFFERENT (unranked) order
        mockRepository.findByIds.mockResolvedValue([...rankedSkills].reverse());

        // WHEN searching without a cursor
        const actual = await service.findPaginated(
          givenModelId,
          undefined,
          givenLimit,
          givenSearchValue,
          givenSearchFields
        );

        // THEN expect the query value to have been embedded with the model's embedding service
        expect(mockEmbeddingModelServiceFactory).toHaveBeenCalledWith(givenEmbeddingServiceId);
        expect(mockEmbeddingModelService.generateEmbedding).toHaveBeenCalledWith(givenSearchValue);
        // AND the vector search to have been scoped to the model, service, fields and paginated by offset 0
        expect(mockSkillEmbeddingRepository.vectorSearch).toHaveBeenCalledWith({
          indexName: SkillsEmbeddingsVectorSearchIndexName,
          modelId: givenModelId,
          embeddingServiceId: givenEmbeddingServiceId,
          queryVector: [0.1, 0.2, 0.3],
          searchFields: givenSearchFields,
          limit: givenLimit + 1,
          offset: 0,
        });
        // AND the page to hold `limit` items ordered by relevance (the ranked-hit order, not findByIds order)
        expect(actual.items).toHaveLength(givenLimit);
        expect(actual.items.map((s) => s.id)).toEqual(rankedSkills.slice(0, givenLimit).map((s) => s.id));
        // AND the nextCursor to be an offset cursor pointing at the next page
        expect(decodeSearchCursor(actual.nextCursor as string)).toEqual(givenLimit);
      });

      test("should apply the offset from the given cursor and advance it", async () => {
        // GIVEN a released model and an offset cursor (page 2)
        const givenModelId = getMockStringId(1);
        const givenLimit = 5;
        const givenCursor = encodeSearchCursor(5);
        const rankedSkills = givenSkills(givenLimit + 1, givenModelId);
        mockSkillEmbeddingRepository.vectorSearch.mockResolvedValue(
          rankedSkills.map((skill, i) => ({ entityId: skill.id, score: 1 - i * 0.1 }))
        );
        mockRepository.findByIds.mockResolvedValue(rankedSkills);

        // WHEN searching with the cursor
        const actual = await service.findPaginated(
          givenModelId,
          givenCursor,
          givenLimit,
          givenSearchValue,
          givenSearchFields
        );

        // THEN expect the offset to have been forwarded and advanced by `limit`
        expect(mockSkillEmbeddingRepository.vectorSearch).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 5, limit: givenLimit + 1 })
        );
        expect(decodeSearchCursor(actual.nextCursor as string)).toEqual(10);
      });

      test("should return a null cursor when the vector search has no next page", async () => {
        // GIVEN a released model whose vector search returns fewer than limit + 1 hits
        const givenModelId = getMockStringId(1);
        const rankedSkills = givenSkills(2, givenModelId);
        mockSkillEmbeddingRepository.vectorSearch.mockResolvedValue(
          rankedSkills.map((skill, i) => ({ entityId: skill.id, score: 1 - i * 0.1 }))
        );
        mockRepository.findByIds.mockResolvedValue(rankedSkills);

        // WHEN searching
        const actual = await service.findPaginated(givenModelId, undefined, 10, givenSearchValue, givenSearchFields);

        // THEN expect no next cursor and all items returned
        expect(actual.nextCursor).toBeNull();
        expect(actual.items).toHaveLength(2);
      });
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

  describe("getHistory", () => {
    // A skill's UUIDHistory holds its OWN past UUIDs; the service resolves each to the skill's reference
    // (as it was in that model) + its modelId, then fetches that model and strips it to a reference.
    function givenModelWithId(n: number, modelId: string): IModelInfo {
      return { ...getIModelInfoMockData(n), id: modelId };
    }

    function givenReference(uuid: string): ISkillReference {
      return {
        id: getMockStringId(Math.floor(Math.random() * 100000)),
        UUID: uuid,
        preferredLabel: getRandomString(10),
        isLocalized: false,
        objectType: ObjectTypes.Skill,
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

    test("should return null when the skill does not exist", async () => {
      // GIVEN the skill does not exist
      mockRepository.findById.mockResolvedValue(null);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect null and no further lookups
      expect(actual).toBeNull();
      expect(mockRepository.findHistoryReferencesByUUIDs).not.toHaveBeenCalled();
      expect(mockModelRepository.getModelsByIds).not.toHaveBeenCalled();
    });

    test("should return an empty array when the skill has an empty UUIDHistory", async () => {
      // GIVEN a skill with an empty UUIDHistory
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [] } as unknown as ISkill);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect an empty array and no further lookups
      expect(actual).toEqual([]);
      expect(mockRepository.findHistoryReferencesByUUIDs).not.toHaveBeenCalled();
      expect(mockModelRepository.getModelsByIds).not.toHaveBeenCalled();
    });

    test("should resolve entity ref + stripped model per UUID, preserve UUIDHistory order, and skip unresolved UUIDs", async () => {
      // GIVEN a skill whose own UUIDHistory has two resolvable UUIDs with a non-existent one in between
      const givenUuidA = randomUUID();
      const givenUuidMissing = randomUUID();
      const givenUuidB = randomUUID();
      mockRepository.findById.mockResolvedValue({
        UUIDHistory: [givenUuidA, givenUuidMissing, givenUuidB],
      } as unknown as ISkill);

      // AND uuidA/uuidB resolve to skill references in models A and B (missing UUID resolves to nulls)
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
      mockModelRepository.getModelsByIds.mockResolvedValue([givenModelB, givenModelA]);

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
      expect(mockModelRepository.getModelsByIds).toHaveBeenCalledTimes(1);
      expect(mockModelRepository.getModelsByIds).toHaveBeenCalledWith([givenModelAId, givenModelBId]);
      // AND the heavy model.getHistory is NOT used anymore
      expect(mockModelRepository.getHistory).not.toHaveBeenCalled();
    });

    test("should return a model at most once even if several history UUIDs map to the same model", async () => {
      // GIVEN two of the skill's historical UUIDs resolve to the SAME model
      const givenUuid1 = randomUUID();
      const givenUuid2 = randomUUID();
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [givenUuid1, givenUuid2] } as unknown as ISkill);
      const givenModelId = getMockStringId(10);
      mockRepository.findHistoryReferencesByUUIDs.mockResolvedValue([
        { UUID: givenUuid1, modelId: givenModelId, reference: givenReference(givenUuid1) },
        { UUID: givenUuid2, modelId: givenModelId, reference: givenReference(givenUuid2) },
      ]);
      const givenModel = givenModelWithId(1, givenModelId);
      mockModelRepository.getModelsByIds.mockResolvedValue([givenModel]);

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
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [givenUuid] } as unknown as ISkill);
      mockRepository.findHistoryReferencesByUUIDs.mockResolvedValue([
        { UUID: givenUuid, modelId: givenModelId, reference: givenReference(givenUuid) },
      ]);
      mockModelRepository.getModelsByIds.mockResolvedValue([]); // model not found

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN the entry is skipped
      expect(actual).toEqual([]);
    });

    test("should return an empty array when UUIDHistory is undefined (covers ?? [] fallback)", async () => {
      // GIVEN a skill with undefined UUIDHistory
      mockRepository.findById.mockResolvedValue({ UUIDHistory: undefined } as unknown as ISkill);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect an empty array and no further lookups
      expect(actual).toEqual([]);
      expect(mockRepository.findHistoryReferencesByUUIDs).not.toHaveBeenCalled();
      expect(mockModelRepository.getModelsByIds).not.toHaveBeenCalled();
    });

    test("should return an empty array when all UUIDs resolve to null modelIds (covers empty modelIds fallback)", async () => {
      // GIVEN a skill with UUIDs in history, but none resolve to a modelId
      const givenUuid1 = randomUUID();
      const givenUuid2 = randomUUID();
      mockRepository.findById.mockResolvedValue({
        UUIDHistory: [givenUuid1, givenUuid2],
      } as unknown as ISkill);
      mockRepository.findHistoryReferencesByUUIDs.mockResolvedValue([
        { UUID: givenUuid1, modelId: null, reference: null },
        { UUID: givenUuid2, modelId: null, reference: null },
      ]);

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect an empty array and no model fetch (modelIds list was empty)
      expect(actual).toEqual([]);
      expect(mockModelRepository.getModelsByIds).not.toHaveBeenCalled();
    });
  });
});
