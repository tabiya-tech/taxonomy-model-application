import { OccupationGroupService } from "./occupationGroup.service";
import {
  IOccupationGroupService,
  OccupationGroupModelValidationError,
  SetOccupationGroupParentError,
} from "./occupationGroup.service.type";
import {
  ModelForOccupationGroupValidationErrorCode,
  INewOccupationGroupSpecWithoutImportId,
  IOccupationGroup,
  IOccupationGroupChild,
} from "esco/occupationGroup/_shared/OccupationGroup.types";
import { IOccupationGroupRepository } from "esco/occupationGroup/repository/OccupationGroup.repository";
import { IOccupationHierarchyRepository } from "esco/occupationHierarchy/occupationHierarchyRepository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRandomString } from "_test_utilities/getMockRandomData";
import { ObjectTypes } from "esco/common/objectTypes";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { getIModelInfoMockData } from "modelInfo/testDataHelper";
import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { getNewISCOGroupSpecsWithoutImportId } from "esco/_test_utilities/getNewSpecs";
import { IOccupationGroupReference } from "../_shared/OccupationGroup.types";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { getIOccupationGroupMockData } from "esco/occupationGroup/_shared/testDataHelper";
import { IEntityEmbeddingRepository } from "embeddings/entityEmbeddings/entityEmbeddingRepository";
import { IOccupationGroupEmbeddingDoc } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IEmbeddingProcessStateRepository } from "embeddings/embeddingProcessState/embeddingProcessStateRepository";
import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";
import { EmbeddableField } from "embeddings/service/types";
import { IEmbeddingModelService } from "embeddings/models/modelsServiceTypes";
import { encodeCursor, decodeCursor } from "../GET/query";
import { decodeSearchCursor, encodeSearchCursor } from "esco/common/searchCursor";
import { OccupationGroupsEmbeddingsVectorSearchIndexName } from "embeddings/entityEmbeddings/vectorSearchIndex.constant";

// Mock the module at the top level
jest.mock("server/repositoryRegistry/repositoryRegistry");
const mockGetRepositoryRegistry = getRepositoryRegistry as jest.MockedFunction<typeof getRepositoryRegistry>;

describe("Test the OccupationGroupService", () => {
  let service: IOccupationGroupService;
  let mockRepository: jest.Mocked<IOccupationGroupRepository>;
  let mockOccupationHierarchyRepository: jest.Mocked<IOccupationHierarchyRepository>;
  let mockOccupationGroupEmbeddingRepository: jest.Mocked<IEntityEmbeddingRepository<IOccupationGroupEmbeddingDoc>>;
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
      findByImportId: jest.fn(),
      findAll: jest.fn(),
      findAllByImportId: jest.fn(),
      findPaginated: jest.fn(),
      findByIds: jest.fn(),
      getOccupationGroupByUUID: jest.fn(),
      findHistoryReferencesByUUIDs: jest.fn(),
      findParent: jest.fn(),
      findChildren: jest.fn(),
    } as unknown as jest.Mocked<IOccupationGroupRepository>;

    mockOccupationHierarchyRepository = {
      hierarchyModel: undefined as never,
      occupationGroupModel: undefined as never,
      occupationModel: undefined as never,
      createMany: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<IOccupationHierarchyRepository>;

    mockOccupationGroupEmbeddingRepository = {
      Model: {} as unknown as mongoose.Model<unknown>,
      upsert: jest.fn(),
      findByEntity: jest.fn(),
      vectorSearch: jest.fn(),
    } as unknown as jest.Mocked<IEntityEmbeddingRepository<IOccupationGroupEmbeddingDoc>>;

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

    service = new OccupationGroupService(
      mockRepository,
      mockOccupationHierarchyRepository,
      mockOccupationGroupEmbeddingRepository,
      mockEmbeddingProcessStateRepository,
      mockEmbeddingModelServiceFactory
    );
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

      // AND given a filter with root=false
      const givenFilter = {
        root: false,
      };

      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        { id: getMockStringId(10), createdAt: new Date("2023-01-01T00:00:00.000Z") },
        givenLimit,
        givenDesc,
        givenFilter
      );

      // THEN expect repository.findPaginated to have been called with the correct parameters
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, getMockStringId(10), givenFilter);
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

      // AND given a filter with root=true
      const givenFilter = {
        root: true,
      };

      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        { id: getMockStringId(10), createdAt: new Date("2023-01-01T00:00:00.000Z") },
        givenLimit,
        givenDesc,
        givenFilter
      );

      // THEN expect repository.findPaginated to have been called with the given parameters
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(
        givenModelId,
        givenLimit + 1,
        1,
        getMockStringId(10),
        givenFilter
      );
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

      // AND given a filter is undefined
      const givenFilter = undefined;

      mockRepository.findPaginated.mockResolvedValue(mockItems);
      // WHEN calling service.findPaginated
      const actual = await service.findPaginated(
        givenModelId,
        {
          id: getMockStringId(10),
          createdAt: new Date("2023-01-01T00:00:00.000Z"),
        },
        givenLimit,
        givenDesc,
        givenFilter
      );

      // AND expect repository.findPaginated to have been called with the decoded cursor
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, getMockStringId(10), givenFilter);
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

      // AND given a filter with root=undefined
      const givenFilter = {
        root: undefined,
      };

      // WHEN calling service.findPaginated with desc=false
      const actual = await service.findPaginated(givenModelId, undefined, givenLimit, givenDesc, givenFilter);

      // THEN expect repository.findPaginated to have been called with the ascending sort
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, 1, undefined, givenFilter);
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

  describe("searchPaginated", () => {
    const givenSearchValue = "nursing";
    const givenSearchFields = [EmbeddableField.preferredLabel, EmbeddableField.description];

    function givenOccupationGroups(count: number, modelId: string): IOccupationGroup[] {
      return Array.from({ length: count }, (_, i) => {
        const group = getIOccupationGroupMockData(i + 2);
        group.id = getMockStringId(i + 2);
        group.modelId = modelId;
        group.createdAt = new Date("2023-01-01T00:00:00.000Z");
        return group;
      });
    }

    function givenModelReleased(released: boolean): void {
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockResolvedValue({ released } as IModelInfo),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);
    }

    describe("regex search (unreleased model)", () => {
      test("should regex-search and return a keyset cursor when the model is not released", async () => {
        // GIVEN an unreleased model
        const givenModelId = getMockStringId(1);
        givenModelReleased(false);
        // AND the repository returns limit + 1 matches to signal a next page
        const givenLimit = 2;
        const actualMatches = givenOccupationGroups(givenLimit + 1, givenModelId);
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
        expect(mockOccupationGroupEmbeddingRepository.vectorSearch).not.toHaveBeenCalled();
        // AND expect a page of `limit` items and a keyset nextCursor pointing at the last item
        expect(actual.items).toHaveLength(givenLimit);
        expect(decodeCursor(actual.nextCursor as string).id).toEqual(actual.items[givenLimit - 1].id);
      });

      test("should return a null cursor when there is no next page", async () => {
        // GIVEN an unreleased model returning fewer than limit + 1 matches
        const givenModelId = getMockStringId(1);
        givenModelReleased(false);
        mockRepository.findPaginated.mockResolvedValue(givenOccupationGroups(1, givenModelId));

        // WHEN searching
        const actual = await service.searchPaginated(givenModelId, givenSearchValue, givenSearchFields, undefined, 10);

        // THEN expect no next cursor
        expect(actual.nextCursor).toBeNull();
        expect(actual.items).toHaveLength(1);
      });

      test("should decode the given keyset cursor and forward its id to the repository", async () => {
        // GIVEN an unreleased model and a keyset cursor
        const givenModelId = getMockStringId(1);
        givenModelReleased(false);
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
        givenModelReleased(true);
        mockEmbeddingProcessStateRepository.findCompletedByModelId.mockResolvedValue(null);
        mockRepository.findPaginated.mockResolvedValue(givenOccupationGroups(1, givenModelId));

        // WHEN searching
        const actual = await service.searchPaginated(givenModelId, givenSearchValue, givenSearchFields, undefined, 10);

        // THEN expect the regex search to have been used and no vector search attempted
        expect(mockRepository.findPaginated).toHaveBeenCalledWith(givenModelId, 11, -1, undefined, undefined, {
          value: givenSearchValue,
          fields: givenSearchFields,
        });
        expect(mockOccupationGroupEmbeddingRepository.vectorSearch).not.toHaveBeenCalled();
        expect(actual.items).toHaveLength(1);
      });
    });

    describe("vector search (released model)", () => {
      const givenEmbeddingServiceId = "embedding-service-id";

      beforeEach(() => {
        givenModelReleased(true);
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
        const rankedGroups = givenOccupationGroups(givenLimit + 1, givenModelId);
        mockOccupationGroupEmbeddingRepository.vectorSearch.mockResolvedValue(
          rankedGroups.map((group, i) => ({ entityId: group.id, score: 1 - i * 0.1 }))
        );
        // AND findByIds returns the hydrated groups in a DIFFERENT (unranked) order
        mockRepository.findByIds.mockResolvedValue([...rankedGroups].reverse());

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
        expect(mockOccupationGroupEmbeddingRepository.vectorSearch).toHaveBeenCalledWith({
          indexName: OccupationGroupsEmbeddingsVectorSearchIndexName,
          modelId: givenModelId,
          embeddingServiceId: givenEmbeddingServiceId,
          queryVector: [0.1, 0.2, 0.3],
          searchFields: givenSearchFields,
          limit: givenLimit + 1,
          offset: 0,
        });
        // AND the page to hold `limit` items ordered by relevance (the ranked-hit order, not findByIds order)
        expect(actual.items).toHaveLength(givenLimit);
        expect(actual.items.map((g) => g.id)).toEqual(rankedGroups.slice(0, givenLimit).map((g) => g.id));
        // AND the nextCursor to be an offset cursor pointing at the next page
        expect(decodeSearchCursor(actual.nextCursor as string)).toEqual(givenLimit);
      });

      test("should apply the offset from the given cursor and advance it", async () => {
        // GIVEN a released model and an offset cursor (page 2)
        const givenModelId = getMockStringId(1);
        const givenLimit = 5;
        const givenCursor = encodeSearchCursor(5);
        const rankedGroups = givenOccupationGroups(givenLimit + 1, givenModelId);
        mockOccupationGroupEmbeddingRepository.vectorSearch.mockResolvedValue(
          rankedGroups.map((group, i) => ({ entityId: group.id, score: 1 - i * 0.1 }))
        );
        mockRepository.findByIds.mockResolvedValue(rankedGroups);

        // WHEN searching with the cursor
        const actual = await service.searchPaginated(
          givenModelId,
          givenSearchValue,
          givenSearchFields,
          givenCursor,
          givenLimit
        );

        // THEN expect the offset to have been forwarded and advanced by `limit`
        expect(mockOccupationGroupEmbeddingRepository.vectorSearch).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 5, limit: givenLimit + 1 })
        );
        expect(decodeSearchCursor(actual.nextCursor as string)).toEqual(10);
      });

      test("should return a null cursor when the vector search has no next page", async () => {
        // GIVEN a released model whose vector search returns fewer than limit + 1 hits
        const givenModelId = getMockStringId(1);
        const rankedGroups = givenOccupationGroups(2, givenModelId);
        mockOccupationGroupEmbeddingRepository.vectorSearch.mockResolvedValue(
          rankedGroups.map((group, i) => ({ entityId: group.id, score: 1 - i * 0.1 }))
        );
        mockRepository.findByIds.mockResolvedValue(rankedGroups);

        // WHEN searching
        const actual = await service.searchPaginated(givenModelId, givenSearchValue, givenSearchFields, undefined, 10);

        // THEN expect no next cursor and all items returned
        expect(actual.nextCursor).toBeNull();
        expect(actual.items).toHaveLength(2);
      });
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

  describe("getHistory", () => {
    // An occupation group's UUIDHistory holds its OWN past UUIDs; the service resolves each to the group's
    // reference (as it was in that model) + its modelId, then fetches that model and strips it to a reference.
    function givenModelWithId(n: number, modelId: string): IModelInfo {
      return { ...getIModelInfoMockData(n), id: modelId };
    }

    function givenReference(uuid: string): IOccupationGroupReference {
      return {
        id: getMockStringId(Math.floor(Math.random() * 100000)),
        UUID: uuid,
        code: getRandomString(5),
        preferredLabel: getRandomString(10),
        objectType: ObjectTypes.ISCOGroup,
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

    test("should return null when the occupation group does not exist", async () => {
      // GIVEN the occupation group does not exist
      mockRepository.findById.mockResolvedValue(null);
      mockModelInfoRepository({});

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect null and no further lookups
      expect(actual).toBeNull();
      expect(mockRepository.findHistoryReferencesByUUIDs).not.toHaveBeenCalled();
    });

    test("should return an empty array when the occupation group has an empty UUIDHistory", async () => {
      // GIVEN an occupation group with an empty UUIDHistory
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [] } as unknown as IOccupationGroup);
      mockModelInfoRepository({});

      // WHEN calling getHistory
      const actual = await service.getHistory(getMockStringId(1));

      // THEN expect an empty array and no further lookups
      expect(actual).toEqual([]);
      expect(mockRepository.findHistoryReferencesByUUIDs).not.toHaveBeenCalled();
    });

    test("should resolve entity ref + stripped model per UUID, preserve UUIDHistory order, and skip unresolved UUIDs", async () => {
      // GIVEN an occupation group whose own UUIDHistory has two resolvable UUIDs with a non-existent one in between
      const givenUuidA = randomUUID();
      const givenUuidMissing = randomUUID();
      const givenUuidB = randomUUID();
      mockRepository.findById.mockResolvedValue({
        UUIDHistory: [givenUuidA, givenUuidMissing, givenUuidB],
      } as unknown as IOccupationGroup);

      // AND uuidA/uuidB resolve to occupation group references in models A and B (missing UUID resolves to nulls)
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
      // GIVEN two of the occupation group's historical UUIDs resolve to the SAME model
      const givenUuid1 = randomUUID();
      const givenUuid2 = randomUUID();
      mockRepository.findById.mockResolvedValue({
        UUIDHistory: [givenUuid1, givenUuid2],
      } as unknown as IOccupationGroup);
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
      mockRepository.findById.mockResolvedValue({ UUIDHistory: [givenUuid] } as unknown as IOccupationGroup);
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

  describe("setParent", () => {
    beforeEach(() => {
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockResolvedValue({
            id: "model-id",
            released: false,
          } as IModelInfo),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);
    });

    test("should successfully set parent and return it", async () => {
      const givenChildId = getMockStringId(1);
      const givenParentId = getMockStringId(2);
      const givenModelId = "model-id";
      const givenParentType = ObjectTypes.ISCOGroup;

      const mockChild: IOccupationGroup = {
        ...getIOccupationGroupMockData(1),
        id: givenChildId,
        modelId: givenModelId,
        groupType: ObjectTypes.ISCOGroup,
      };
      const mockParent: IOccupationGroup = {
        ...getIOccupationGroupMockData(2),
        id: givenParentId,
        modelId: givenModelId,
      };

      mockRepository.findById.mockResolvedValueOnce(mockChild);
      mockRepository.findById.mockResolvedValueOnce(mockParent);
      mockOccupationHierarchyRepository.createMany.mockResolvedValue([]);

      const actual = await service.setParent({
        childId: givenChildId,
        parentId: givenParentId,
        parentType: givenParentType,
        modelId: givenModelId,
      });

      expect(mockRepository.findById).toHaveBeenCalledWith(givenChildId);
      expect(mockRepository.findById).toHaveBeenCalledWith(givenParentId);
      expect(mockOccupationHierarchyRepository.createMany).toHaveBeenCalledWith(givenModelId, [
        {
          childId: givenChildId,
          childType: mockChild.groupType,
          parentId: givenParentId,
          parentType: givenParentType,
        },
      ]);
      expect(actual).toEqual(mockParent);
    });

    test("should throw OccupationGroupModelValidationError when model validation fails", async () => {
      mockGetRepositoryRegistry.mockReturnValue({
        modelInfo: {
          getModelById: jest.fn().mockResolvedValue(null),
        },
      } as unknown as ReturnType<typeof getRepositoryRegistry>);

      await expect(
        service.setParent({
          childId: getMockStringId(1),
          parentId: getMockStringId(2),
          parentType: ObjectTypes.ISCOGroup,
          modelId: "invalid-model",
        })
      ).rejects.toThrow(OccupationGroupModelValidationError);
    });

    test("should throw SetOccupationGroupParentError when child is not found", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.setParent({
          childId: getMockStringId(1),
          parentId: getMockStringId(2),
          parentType: ObjectTypes.ISCOGroup,
          modelId: "model-id",
        })
      ).rejects.toThrow(SetOccupationGroupParentError);
    });

    test("should throw SetOccupationGroupParentError when child modelId does not match", async () => {
      const mockChild: IOccupationGroup = {
        ...getIOccupationGroupMockData(1),
        modelId: "different-model",
      };
      mockRepository.findById.mockResolvedValue(mockChild);

      await expect(
        service.setParent({
          childId: getMockStringId(1),
          parentId: getMockStringId(2),
          parentType: ObjectTypes.ISCOGroup,
          modelId: "model-id",
        })
      ).rejects.toThrow(SetOccupationGroupParentError);
    });

    test("should throw SetOccupationGroupParentError when parent is not found", async () => {
      const givenChildId = getMockStringId(1);
      const mockChild: IOccupationGroup = {
        ...getIOccupationGroupMockData(1),
        id: givenChildId,
        modelId: "model-id",
      };
      mockRepository.findById.mockResolvedValueOnce(mockChild);
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.setParent({
          childId: givenChildId,
          parentId: getMockStringId(2),
          parentType: ObjectTypes.ISCOGroup,
          modelId: "model-id",
        })
      ).rejects.toThrow(SetOccupationGroupParentError);
    });

    test("should throw SetOccupationGroupParentError when parent modelId does not match", async () => {
      const givenChildId = getMockStringId(1);
      const givenParentId = getMockStringId(2);
      const mockChild: IOccupationGroup = {
        ...getIOccupationGroupMockData(1),
        id: givenChildId,
        modelId: "model-id",
      };
      const mockParent: IOccupationGroup = {
        ...getIOccupationGroupMockData(2),
        id: givenParentId,
        modelId: "different-model",
      };
      mockRepository.findById.mockResolvedValueOnce(mockChild);
      mockRepository.findById.mockResolvedValueOnce(mockParent);

      await expect(
        service.setParent({
          childId: givenChildId,
          parentId: givenParentId,
          parentType: ObjectTypes.ISCOGroup,
          modelId: "model-id",
        })
      ).rejects.toThrow(SetOccupationGroupParentError);
    });

    test("should throw when occupationHierarchyRepository.createMany fails", async () => {
      const givenChildId = getMockStringId(1);
      const givenParentId = getMockStringId(2);
      const mockChild: IOccupationGroup = {
        ...getIOccupationGroupMockData(1),
        id: givenChildId,
        modelId: "model-id",
      };
      const mockParent: IOccupationGroup = {
        ...getIOccupationGroupMockData(2),
        id: givenParentId,
        modelId: "model-id",
      };
      mockRepository.findById.mockResolvedValueOnce(mockChild);
      mockRepository.findById.mockResolvedValueOnce(mockParent);
      mockOccupationHierarchyRepository.createMany.mockRejectedValue(new Error("DB error"));

      await expect(
        service.setParent({
          childId: givenChildId,
          parentId: givenParentId,
          parentType: ObjectTypes.ISCOGroup,
          modelId: "model-id",
        })
      ).rejects.toThrow("DB error");
    });
  });
});
