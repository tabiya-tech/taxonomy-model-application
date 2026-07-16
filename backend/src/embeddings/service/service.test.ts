// silence chatty console
import "_test_utilities/consoleMock";

import ModelInfoApiSpecs from "api-specifications/modelInfo";
import { EmbeddingService, IEmbeddingServiceDependencies } from "./service";
import { EmbeddableEntityType, EmbeddableField, IGenerateEmbeddingTask } from "./types";
import { computeSourceHash } from "./sourceText";
import { EntityEmbeddingStatus } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";
import { getMockStringId } from "_test_utilities/mockMongoId";

const givenModelId = getMockStringId(1);
const givenEntityId = getMockStringId(2);
const givenEmbeddingServiceId = "77bb8ff3-a6b0-460b-bcaa-00631a907852";

function getMockProcessState(overrides: Partial<IEmbeddingProcessState> = {}): IEmbeddingProcessState {
  return {
    id: getMockStringId(10),
    modelId: givenModelId,
    status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
    embeddingServiceId: givenEmbeddingServiceId,
    totalDocuments: 10,
    errorCounts: 0,
    warningCounts: 0,
    completedDocuments: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function getMockEntity(overrides: object = {}) {
  return {
    id: givenEntityId,
    modelId: givenModelId,
    preferredLabel: "some preferred label",
    description: "some description",
    altLabels: ["first alt label", "second alt label"],
    scopeNote: "some scope note",
    ...overrides,
  };
}

function getMockTask(overrides: Partial<IGenerateEmbeddingTask> = {}): IGenerateEmbeddingTask {
  return {
    modelId: givenModelId,
    entityId: givenEntityId,
    entityType: EmbeddableEntityType.Skill,
    fields: [EmbeddableField.preferredLabel, EmbeddableField.description],
    ...overrides,
  };
}

function setupService(mocks: {
  processState?: IEmbeddingProcessState | null;
  entity?: object | null;
  existingEmbeddings?: object[];
  vectors?: number[][];
  incrementedProcessState?: IEmbeddingProcessState;
}) {
  const givenIncrementedProcessState = mocks.incrementedProcessState ?? getMockProcessState({ completedDocuments: 1 });
  const makeEntityRepository = () => ({
    findById: jest.fn().mockResolvedValue(mocks.entity !== undefined ? mocks.entity : getMockEntity()),
    setEntityEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
  });
  const makeEmbeddingRepository = () => ({
    findByEntity: jest.fn().mockResolvedValue(mocks.existingEmbeddings ?? []),
    upsert: jest.fn().mockImplementation((spec) => Promise.resolve(spec)),
  });
  const embeddingModelService = {
    generateEmbedding: jest.fn(),
    generateEmbeddingBatch: jest.fn().mockResolvedValue(mocks.vectors ?? [[0.1, 0.2]]),
  };

  const dependencies = {
    skillRepository: makeEntityRepository(),
    skillGroupRepository: makeEntityRepository(),
    occupationRepository: makeEntityRepository(),
    occupationGroupRepository: makeEntityRepository(),
    skillEmbeddingRepository: makeEmbeddingRepository(),
    skillGroupEmbeddingRepository: makeEmbeddingRepository(),
    occupationEmbeddingRepository: makeEmbeddingRepository(),
    occupationGroupEmbeddingRepository: makeEmbeddingRepository(),
    embeddingProcessStateRepository: {
      findPendingByModelId: jest
        .fn()
        .mockResolvedValue(mocks.processState !== undefined ? mocks.processState : getMockProcessState()),
      incrementCounts: jest.fn().mockResolvedValue(givenIncrementedProcessState),
      update: jest.fn().mockResolvedValue(getMockProcessState()),
    },
    embeddingModelServiceFactory: jest.fn().mockReturnValue(embeddingModelService),
  };

  const service = new EmbeddingService(dependencies as unknown as IEmbeddingServiceDependencies);

  return { service, dependencies, embeddingModelService };
}

describe("Test the EmbeddingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Test the happy path of processTask", () => {
    test("should generate and store the embeddings of the stale fields of the entity", async () => {
      // GIVEN a task for a skill with two fields
      const givenTask = getMockTask();
      // AND an unfinished embedding process for the model
      // AND the entity exists in the model and has no embeddings yet
      // AND the embedding service returns one vector per field
      const givenVectors = [
        [0.1, 0.2],
        [0.3, 0.4],
      ];
      const { service, dependencies, embeddingModelService } = setupService({ vectors: givenVectors });
      const givenEntity = getMockEntity();

      // WHEN processing the task
      await service.processTask(givenTask);

      // THEN expect the entity to have been fetched
      expect(dependencies.skillRepository.findById).toHaveBeenCalledWith(givenTask.entityId);
      // AND expect the entity to have been marked as IN_PROGRESS for the embedding service
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith({
        modelId: givenTask.modelId,
        entityId: givenTask.entityId,
        embeddingServiceId: givenEmbeddingServiceId,
        status: EntityEmbeddingStatus.IN_PROGRESS,
      });
      // AND expect the existing embeddings of the entity to have been fetched
      expect(dependencies.skillEmbeddingRepository.findByEntity).toHaveBeenCalledWith(
        givenTask.modelId,
        givenTask.entityId,
        givenEmbeddingServiceId
      );
      // AND expect the embedding model service to have been resolved for the embedding service of the process
      expect(dependencies.embeddingModelServiceFactory).toHaveBeenCalledWith(givenEmbeddingServiceId);
      // AND expect the embeddings to have been generated in a single batch with the source texts of the fields
      expect(embeddingModelService.generateEmbeddingBatch).toHaveBeenCalledTimes(1);
      expect(embeddingModelService.generateEmbeddingBatch).toHaveBeenCalledWith([
        givenEntity.preferredLabel,
        givenEntity.description,
      ]);
      // AND expect one embedding to have been upserted per field, with the source text, its hash and the vector
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledTimes(2);
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledWith({
        modelId: givenTask.modelId,
        entityId: givenTask.entityId,
        embeddingServiceId: givenEmbeddingServiceId,
        sourceField: EmbeddableField.preferredLabel,
        sourceHash: computeSourceHash(givenEntity.preferredLabel),
        sourceText: givenEntity.preferredLabel,
        vector: givenVectors[0],
      });
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledWith({
        modelId: givenTask.modelId,
        entityId: givenTask.entityId,
        embeddingServiceId: givenEmbeddingServiceId,
        sourceField: EmbeddableField.description,
        sourceHash: computeSourceHash(givenEntity.description),
        sourceText: givenEntity.description,
        vector: givenVectors[1],
      });
      // AND expect the entity to have been marked as COMPLETED for the embedding service
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith({
        modelId: givenTask.modelId,
        entityId: givenTask.entityId,
        embeddingServiceId: givenEmbeddingServiceId,
        status: EntityEmbeddingStatus.COMPLETED,
      });
      // AND expect the document to have been counted as completed on the embedding process
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(
        getMockProcessState().id,
        { completedDocuments: 1 }
      );
      // AND expect the entity to never have been marked as FAILED
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: EntityEmbeddingStatus.FAILED })
      );
    });

    test.each([
      [EmbeddableEntityType.Skill, "skillRepository", "skillEmbeddingRepository"],
      [EmbeddableEntityType.SkillGroup, "skillGroupRepository", "skillGroupEmbeddingRepository"],
      [EmbeddableEntityType.Occupation, "occupationRepository", "occupationEmbeddingRepository"],
      [EmbeddableEntityType.OccupationGroup, "occupationGroupRepository", "occupationGroupEmbeddingRepository"],
    ])(
      "should process a task for a %s with the repositories of that entity type",
      async (givenEntityType, expectedEntityRepositoryKey, expectedEmbeddingRepositoryKey) => {
        // GIVEN a task for a single field of the given entity type
        const givenTask = getMockTask({
          entityType: givenEntityType as EmbeddableEntityType,
          fields: [EmbeddableField.preferredLabel],
        });
        // AND an unfinished embedding process for the model and an entity that exists in the model
        const { service, dependencies } = setupService({});

        // WHEN processing the task
        await service.processTask(givenTask);

        // THEN expect the entity to have been fetched with the entity repository of the entity type
        const actualEntityRepository = dependencies[
          expectedEntityRepositoryKey as keyof typeof dependencies
        ] as unknown as {
          findById: jest.Mock;
          setEntityEmbeddingStatus: jest.Mock;
        };
        expect(actualEntityRepository.findById).toHaveBeenCalledWith(givenTask.entityId);
        // AND expect the embeddings to have been stored with the embedding repository of the entity type
        const actualEmbeddingRepository = dependencies[
          expectedEmbeddingRepositoryKey as keyof typeof dependencies
        ] as unknown as {
          upsert: jest.Mock;
        };
        expect(actualEmbeddingRepository.upsert).toHaveBeenCalled();
        // AND expect the entity statuses to have been set with the entity repository of the entity type
        expect(actualEntityRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
          expect.objectContaining({ status: EntityEmbeddingStatus.COMPLETED })
        );
      }
    );

    test("should join the alternative labels with a newline when embedding the altLabels field", async () => {
      // GIVEN a task for the altLabels field of a skill
      const givenTask = getMockTask({ fields: [EmbeddableField.altLabels] });
      // AND an entity with two alternative labels
      const { service, embeddingModelService } = setupService({});
      const givenEntity = getMockEntity();

      // WHEN processing the task
      await service.processTask(givenTask);

      // THEN expect the embedding to have been generated with the labels joined by a newline
      expect(embeddingModelService.generateEmbeddingBatch).toHaveBeenCalledWith([givenEntity.altLabels.join("\n")]);
    });

    test("should skip the fields whose source text is empty", async () => {
      // GIVEN a task for two fields, one of which has an empty source text
      const givenTask = getMockTask({ fields: [EmbeddableField.preferredLabel, EmbeddableField.description] });
      // AND the entity has an empty description
      const givenEntity = getMockEntity({ description: "" });
      const { service, dependencies, embeddingModelService } = setupService({ entity: givenEntity });

      // WHEN processing the task
      await service.processTask(givenTask);

      // THEN expect only the non-empty field to have been embedded
      expect(embeddingModelService.generateEmbeddingBatch).toHaveBeenCalledWith([givenEntity.preferredLabel]);
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledTimes(1);
      // AND expect the document to have been counted as completed
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        completedDocuments: 1,
      });
    });

    test("should not call the embedding service at all when every field is empty", async () => {
      // GIVEN a task for an entity whose fields are all empty
      const givenTask = getMockTask();
      const givenEntity = getMockEntity({ preferredLabel: "", description: " " });
      const { service, dependencies, embeddingModelService } = setupService({ entity: givenEntity });

      // WHEN processing the task
      await service.processTask(givenTask);

      // THEN expect no embedding to have been generated or stored
      expect(embeddingModelService.generateEmbeddingBatch).not.toHaveBeenCalled();
      expect(dependencies.skillEmbeddingRepository.upsert).not.toHaveBeenCalled();
      // AND expect the entity to have been marked as COMPLETED and the document counted as completed
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: EntityEmbeddingStatus.COMPLETED })
      );
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        completedDocuments: 1,
      });
    });

    test("should skip the fields whose source text has not changed since their embedding was generated", async () => {
      // GIVEN a task for two fields of a skill
      const givenTask = getMockTask();
      const givenEntity = getMockEntity();
      // AND the preferredLabel already has an embedding with the same source hash
      const givenExistingEmbeddings = [
        {
          sourceField: EmbeddableField.preferredLabel,
          sourceHash: computeSourceHash(givenEntity.preferredLabel),
        },
      ];
      const { service, dependencies, embeddingModelService } = setupService({
        existingEmbeddings: givenExistingEmbeddings,
      });

      // WHEN processing the task
      await service.processTask(givenTask);

      // THEN expect only the description to have been embedded and stored
      expect(embeddingModelService.generateEmbeddingBatch).toHaveBeenCalledWith([givenEntity.description]);
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledTimes(1);
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ sourceField: EmbeddableField.description })
      );
    });

    test("should not call the embedding service at all when no field has changed", async () => {
      // GIVEN a task for two fields of a skill that both already have up-to-date embeddings
      const givenTask = getMockTask();
      const givenEntity = getMockEntity();
      const givenExistingEmbeddings = [
        {
          sourceField: EmbeddableField.preferredLabel,
          sourceHash: computeSourceHash(givenEntity.preferredLabel),
        },
        {
          sourceField: EmbeddableField.description,
          sourceHash: computeSourceHash(givenEntity.description),
        },
      ];
      const { service, dependencies, embeddingModelService } = setupService({
        existingEmbeddings: givenExistingEmbeddings,
      });

      // WHEN processing the task
      await service.processTask(givenTask);

      // THEN expect no embedding to have been generated or stored
      expect(dependencies.embeddingModelServiceFactory).not.toHaveBeenCalled();
      expect(embeddingModelService.generateEmbeddingBatch).not.toHaveBeenCalled();
      expect(dependencies.skillEmbeddingRepository.upsert).not.toHaveBeenCalled();
      // AND expect the entity to still have been marked as COMPLETED and the document counted as completed
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: EntityEmbeddingStatus.COMPLETED })
      );
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        completedDocuments: 1,
      });
    });
  });

  describe("Test the completion of the embedding process", () => {
    test("should complete the embedding process when the last document has been handled", async () => {
      // GIVEN a task whose completion makes the handled documents reach the total documents
      const givenTask = getMockTask();
      const givenIncrementedProcessState = getMockProcessState({
        totalDocuments: 10,
        completedDocuments: 8,
        errorCounts: 2,
      });
      const { service, dependencies } = setupService({ incrementedProcessState: givenIncrementedProcessState });

      // WHEN processing the task
      await service.processTask(givenTask);

      // THEN expect the embedding process to have been completed
      expect(dependencies.embeddingProcessStateRepository.update).toHaveBeenCalledWith(
        givenIncrementedProcessState.id,
        { status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED }
      );
    });

    test("should not complete the embedding process when there are still documents to handle", async () => {
      // GIVEN a task whose completion does not make the handled documents reach the total documents
      const givenTask = getMockTask();
      const givenIncrementedProcessState = getMockProcessState({ totalDocuments: 10, completedDocuments: 5 });
      const { service, dependencies } = setupService({ incrementedProcessState: givenIncrementedProcessState });

      // WHEN processing the task
      await service.processTask(givenTask);

      // THEN expect the embedding process to not have been completed
      expect(dependencies.embeddingProcessStateRepository.update).not.toHaveBeenCalled();
    });

    test("should not complete the embedding process while it is still pending", async () => {
      // GIVEN a task whose process is still PENDING (the trigger is still pushing tasks and totalDocuments is not final)
      const givenTask = getMockTask();
      const givenIncrementedProcessState = getMockProcessState({
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
        totalDocuments: 0,
        completedDocuments: 1,
      });
      const { service, dependencies } = setupService({ incrementedProcessState: givenIncrementedProcessState });

      // WHEN processing the task
      await service.processTask(givenTask);

      // THEN expect the embedding process to not have been completed
      expect(dependencies.embeddingProcessStateRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("Test the error handling of processTask", () => {
    test("should rethrow when the unfinished embedding process of the model cannot be fetched", async () => {
      // GIVEN fetching the unfinished embedding process will fail (e.g. a transient DB error)
      const givenTask = getMockTask();
      const { service, dependencies } = setupService({});
      const givenCause = new Error("DB connection lost");
      (dependencies.embeddingProcessStateRepository.findPendingByModelId as jest.Mock).mockRejectedValue(givenCause);

      // WHEN processing the task
      const actualPromise = service.processTask(givenTask);

      // THEN expect it to reject with the original error, so that the SQS message is retried
      await expect(actualPromise).rejects.toThrow(givenCause);
      // AND expect no bookkeeping to have happened
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).not.toHaveBeenCalled();
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).not.toHaveBeenCalled();
    });

    test("should skip the task without throwing when there is no unfinished embedding process for the model", async () => {
      // GIVEN there is no unfinished embedding process for the model
      const givenTask = getMockTask();
      const { service, dependencies, embeddingModelService } = setupService({ processState: null });

      // WHEN processing the task
      const actualPromise = service.processTask(givenTask);

      // THEN expect it to resolve without throwing
      await expect(actualPromise).resolves.toBeUndefined();
      // AND expect a warning to have been logged
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(givenTask.modelId));
      // AND expect nothing to have been processed
      expect(dependencies.skillRepository.findById).not.toHaveBeenCalled();
      expect(embeddingModelService.generateEmbeddingBatch).not.toHaveBeenCalled();
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).not.toHaveBeenCalled();
    });

    test.each([
      ["the entity does not exist", null],
      ["the entity belongs to another model", getMockEntity({ modelId: getMockStringId(99) })],
    ])("should record a failed document without throwing when %s", async (_caseDescription, givenEntity) => {
      // GIVEN a task whose entity cannot be found in the model
      const givenTask = getMockTask();
      const { service, dependencies, embeddingModelService } = setupService({ entity: givenEntity });

      // WHEN processing the task
      const actualPromise = service.processTask(givenTask);

      // THEN expect it to resolve without throwing
      await expect(actualPromise).resolves.toBeUndefined();
      // AND expect the error to have been logged
      expect(console.error).toHaveBeenCalled();
      // AND expect no embedding to have been generated
      expect(embeddingModelService.generateEmbeddingBatch).not.toHaveBeenCalled();
      // AND expect the entity to have been marked as FAILED for the embedding service
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: EntityEmbeddingStatus.FAILED })
      );
      // AND expect the document to have been counted as an error on the embedding process
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        errorCounts: 1,
      });
    });

    test("should record a failed document without throwing when the embedding generation fails", async () => {
      // GIVEN a task whose embedding generation will fail
      const givenTask = getMockTask();
      const { service, dependencies, embeddingModelService } = setupService({});
      (embeddingModelService.generateEmbeddingBatch as jest.Mock).mockRejectedValue(new Error("Gemini unavailable"));

      // WHEN processing the task
      const actualPromise = service.processTask(givenTask);

      // THEN expect it to resolve without throwing
      await expect(actualPromise).resolves.toBeUndefined();
      // AND expect no embedding to have been stored
      expect(dependencies.skillEmbeddingRepository.upsert).not.toHaveBeenCalled();
      // AND expect the entity to have been marked as FAILED for the embedding service
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: EntityEmbeddingStatus.FAILED })
      );
      // AND expect the document to have been counted as an error on the embedding process
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        errorCounts: 1,
      });
    });

    test("should record a failed document when the embedding service returns the wrong number of embeddings", async () => {
      // GIVEN a task for two fields whose embedding service returns only one vector
      const givenTask = getMockTask();
      const { service, dependencies } = setupService({ vectors: [[0.1, 0.2]] });

      // WHEN processing the task
      const actualPromise = service.processTask(givenTask);

      // THEN expect it to resolve without throwing
      await expect(actualPromise).resolves.toBeUndefined();
      // AND expect no embedding to have been stored
      expect(dependencies.skillEmbeddingRepository.upsert).not.toHaveBeenCalled();
      // AND expect the document to have been counted as an error on the embedding process
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        errorCounts: 1,
      });
    });

    test("should record a failed document when storing an embedding fails", async () => {
      // GIVEN a task whose embedding cannot be stored
      const givenTask = getMockTask();
      const { service, dependencies } = setupService({});
      (dependencies.skillEmbeddingRepository.upsert as jest.Mock).mockRejectedValue(new Error("DB unavailable"));

      // WHEN processing the task
      const actualPromise = service.processTask(givenTask);

      // THEN expect it to resolve without throwing
      await expect(actualPromise).resolves.toBeUndefined();
      // AND expect the entity to have been marked as FAILED and the document counted as an error
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: EntityEmbeddingStatus.FAILED })
      );
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        errorCounts: 1,
      });
    });

    test("should still count the error when marking the entity as FAILED fails", async () => {
      // GIVEN a task whose embedding generation will fail
      const givenTask = getMockTask();
      const { service, dependencies, embeddingModelService } = setupService({});
      (embeddingModelService.generateEmbeddingBatch as jest.Mock).mockRejectedValue(new Error("Gemini unavailable"));
      // AND marking the entity as FAILED will also fail
      (dependencies.skillRepository.setEntityEmbeddingStatus as jest.Mock)
        .mockResolvedValueOnce(undefined) // the IN_PROGRESS update succeeds
        .mockRejectedValueOnce(new Error("update failed")); // the FAILED update fails

      // WHEN processing the task
      const actualPromise = service.processTask(givenTask);

      // THEN expect it to resolve without throwing
      await expect(actualPromise).resolves.toBeUndefined();
      // AND expect the document to still have been counted as an error on the embedding process
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        errorCounts: 1,
      });
    });

    test("should resolve without throwing when counting the error on the embedding process fails", async () => {
      // GIVEN a task whose embedding generation will fail
      const givenTask = getMockTask();
      const { service, dependencies, embeddingModelService } = setupService({});
      (embeddingModelService.generateEmbeddingBatch as jest.Mock).mockRejectedValue(new Error("Gemini unavailable"));
      // AND counting the error on the embedding process will also fail
      (dependencies.embeddingProcessStateRepository.incrementCounts as jest.Mock).mockRejectedValue(
        new Error("increment failed")
      );

      // WHEN processing the task
      const actualPromise = service.processTask(givenTask);

      // THEN expect it to resolve without throwing
      await expect(actualPromise).resolves.toBeUndefined();
      // AND expect the error to have been logged
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Test the batching of processTasks", () => {
    test("should embed the stale sources of all the tasks in a single batch call", async () => {
      // GIVEN two tasks for two skills with two fields each
      const givenTask1 = getMockTask({ entityId: getMockStringId(2) });
      const givenTask2 = getMockTask({ entityId: getMockStringId(3) });
      // AND the embedding service returns one vector per source text of the batch
      const givenVectors = [[0.1], [0.2], [0.3], [0.4]];
      const { service, dependencies, embeddingModelService } = setupService({ vectors: givenVectors });
      const givenEntity = getMockEntity();

      // WHEN processing the tasks together
      await service.processTasks([givenTask1, givenTask2]);

      // THEN expect the embeddings of both tasks to have been generated in a single batch call
      expect(embeddingModelService.generateEmbeddingBatch).toHaveBeenCalledTimes(1);
      expect(embeddingModelService.generateEmbeddingBatch).toHaveBeenCalledWith([
        givenEntity.preferredLabel,
        givenEntity.description,
        givenEntity.preferredLabel,
        givenEntity.description,
      ]);
      // AND expect the vectors to have been stored with the task they belong to, in the order of the batch
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledTimes(4);
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: givenTask1.entityId,
          sourceField: EmbeddableField.preferredLabel,
          vector: givenVectors[0],
        })
      );
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: givenTask1.entityId,
          sourceField: EmbeddableField.description,
          vector: givenVectors[1],
        })
      );
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: givenTask2.entityId,
          sourceField: EmbeddableField.preferredLabel,
          vector: givenVectors[2],
        })
      );
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: givenTask2.entityId,
          sourceField: EmbeddableField.description,
          vector: givenVectors[3],
        })
      );
      // AND expect each document to have been counted as completed on the embedding process
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledTimes(2);
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        completedDocuments: 1,
      });
    });

    test("should look up the unfinished embedding process of each model only once", async () => {
      // GIVEN two tasks for the same model
      const givenTask1 = getMockTask({ entityId: getMockStringId(2), fields: [EmbeddableField.preferredLabel] });
      const givenTask2 = getMockTask({ entityId: getMockStringId(3), fields: [EmbeddableField.preferredLabel] });
      const { service, dependencies } = setupService({ vectors: [[0.1], [0.2]] });

      // WHEN processing the tasks together
      await service.processTasks([givenTask1, givenTask2]);

      // THEN expect the unfinished embedding process of the model to have been looked up only once
      expect(dependencies.embeddingProcessStateRepository.findPendingByModelId).toHaveBeenCalledTimes(1);
      expect(dependencies.embeddingProcessStateRepository.findPendingByModelId).toHaveBeenCalledWith(givenModelId);
    });

    test("should record a failure for every task of the batch when the batch embedding generation fails", async () => {
      // GIVEN two tasks whose batched embedding generation will fail
      const givenTask1 = getMockTask({ entityId: getMockStringId(2) });
      const givenTask2 = getMockTask({ entityId: getMockStringId(3) });
      const { service, dependencies, embeddingModelService } = setupService({});
      (embeddingModelService.generateEmbeddingBatch as jest.Mock).mockRejectedValue(new Error("Gemini unavailable"));

      // WHEN processing the tasks
      const actualPromise = service.processTasks([givenTask1, givenTask2]);

      // THEN expect it to resolve without throwing
      await expect(actualPromise).resolves.toBeUndefined();
      // AND expect no embedding to have been stored
      expect(dependencies.skillEmbeddingRepository.upsert).not.toHaveBeenCalled();
      // AND expect each entity to have been marked as FAILED for the embedding service
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: givenTask1.entityId, status: EntityEmbeddingStatus.FAILED })
      );
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: givenTask2.entityId, status: EntityEmbeddingStatus.FAILED })
      );
      // AND expect each document to have been counted as an error on the embedding process
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledTimes(2);
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        errorCounts: 1,
      });
    });

    test("should not fail the other tasks of the batch when preparing one task fails", async () => {
      // GIVEN a task for a skill and a task for an occupation that does not exist
      const givenSkillTask = getMockTask();
      const givenOccupationTask = getMockTask({ entityType: EmbeddableEntityType.Occupation });
      const givenVectors = [
        [0.1, 0.2],
        [0.3, 0.4],
      ];
      const { service, dependencies } = setupService({ vectors: givenVectors });
      (dependencies.occupationRepository.findById as jest.Mock).mockResolvedValue(null);

      // WHEN processing the tasks
      const actualPromise = service.processTasks([givenSkillTask, givenOccupationTask]);

      // THEN expect it to resolve without throwing
      await expect(actualPromise).resolves.toBeUndefined();
      // AND expect the embeddings of the skill to still have been stored and the skill marked as COMPLETED
      expect(dependencies.skillEmbeddingRepository.upsert).toHaveBeenCalledTimes(2);
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: EntityEmbeddingStatus.COMPLETED })
      );
      // AND expect the occupation to have been marked as FAILED
      expect(dependencies.occupationRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: EntityEmbeddingStatus.FAILED })
      );
      // AND expect one document to have been counted as completed and one as an error
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        completedDocuments: 1,
      });
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        errorCounts: 1,
      });
    });

    test("should still complete a task with nothing to embed when the batch embedding generation fails", async () => {
      // GIVEN a task for a skill whose embeddings are all up to date
      const givenSkillTask = getMockTask();
      const givenEntity = getMockEntity();
      // AND a task for an occupation whose batched embedding generation will fail
      const givenOccupationTask = getMockTask({ entityType: EmbeddableEntityType.Occupation });
      const { service, dependencies, embeddingModelService } = setupService({});
      (dependencies.skillEmbeddingRepository.findByEntity as jest.Mock).mockResolvedValue([
        { sourceField: EmbeddableField.preferredLabel, sourceHash: computeSourceHash(givenEntity.preferredLabel) },
        { sourceField: EmbeddableField.description, sourceHash: computeSourceHash(givenEntity.description) },
      ]);
      (embeddingModelService.generateEmbeddingBatch as jest.Mock).mockRejectedValue(new Error("Gemini unavailable"));

      // WHEN processing the tasks
      const actualPromise = service.processTasks([givenSkillTask, givenOccupationTask]);

      // THEN expect it to resolve without throwing
      await expect(actualPromise).resolves.toBeUndefined();
      // AND expect the skill to have been marked as COMPLETED and its document counted as completed
      expect(dependencies.skillRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: EntityEmbeddingStatus.COMPLETED })
      );
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        completedDocuments: 1,
      });
      // AND expect the occupation to have been marked as FAILED and its document counted as an error
      expect(dependencies.occupationRepository.setEntityEmbeddingStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: EntityEmbeddingStatus.FAILED })
      );
      expect(dependencies.embeddingProcessStateRepository.incrementCounts).toHaveBeenCalledWith(expect.any(String), {
        errorCounts: 1,
      });
    });
  });
});
