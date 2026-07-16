// silence chatty console
import "_test_utilities/consoleMock";

import { Readable } from "node:stream";
import ModelInfoApiSpecs from "api-specifications/modelInfo";
import { EmbeddingProcessService, TASKS_FLUSH_SIZE } from "./embeddingProcess.service";
import { EmbeddingProcessAlreadyRunningError, ModelNotFoundError, ModelNotReleasedError } from "./errors";
import { EmbeddableEntityType, EmbeddableField } from "embeddings/service/types";
import { EntityEmbeddingStatus } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";
import { getMockStringId } from "_test_utilities/mockMongoId";

function getMockModel(released: boolean) {
  return { id: getMockStringId(1), released };
}

function getMockEmbeddingProcessState(overrides: Partial<IEmbeddingProcessState> = {}): IEmbeddingProcessState {
  return {
    id: getMockStringId(10),
    modelId: getMockStringId(1),
    status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
    embeddingServiceId: "gemini$$models/gemini-embedding-2",
    totalDocuments: 0,
    errorCounts: 0,
    warningCounts: 0,
    completedDocuments: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function setupService(mocks: {
  model?: { id: string; released: boolean } | null;
  pendingProcess?: IEmbeddingProcessState | null;
  skills?: object[];
  skillGroups?: object[];
  occupations?: object[];
  occupationGroups?: object[];
  createdProcessState?: IEmbeddingProcessState;
  updatedProcessState?: IEmbeddingProcessState;
  refreshedProcessState?: IEmbeddingProcessState | null;
}) {
  const modelRepository = {
    getModelById: jest.fn().mockResolvedValue(mocks.model),
  };
  const givenUpdatedProcessState = mocks.updatedProcessState ?? getMockEmbeddingProcessState();
  const embeddingProcessStateRepository = {
    findPendingByModelId: jest.fn().mockResolvedValue(mocks.pendingProcess ?? null),
    create: jest.fn().mockResolvedValue(mocks.createdProcessState ?? getMockEmbeddingProcessState()),
    update: jest.fn().mockResolvedValue(givenUpdatedProcessState),
    findById: jest
      .fn()
      .mockResolvedValue(
        mocks.refreshedProcessState !== undefined ? mocks.refreshedProcessState : givenUpdatedProcessState
      ),
    deleteById: jest.fn().mockResolvedValue(undefined),
  };
  const skillRepository = {
    setModelEntitiesEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn().mockReturnValue(Readable.from(mocks.skills ?? [])),
  };
  const skillGroupRepository = {
    setModelEntitiesEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn().mockReturnValue(Readable.from(mocks.skillGroups ?? [])),
  };
  const occupationRepository = {
    setModelEntitiesEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn().mockReturnValue(Readable.from(mocks.occupations ?? [])),
  };
  const occupationGroupRepository = {
    setModelEntitiesEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    findAll: jest.fn().mockReturnValue(Readable.from(mocks.occupationGroups ?? [])),
  };
  const embeddingClient = { pushTasksToQueue: jest.fn().mockResolvedValue(undefined) };
  const asyncPublishEmbeddingsTaskInvoker = { invoke: jest.fn().mockResolvedValue(undefined) };

  const service = new EmbeddingProcessService(
    // @ts-ignore
    modelRepository,
    // @ts-ignore
    embeddingProcessStateRepository,
    // @ts-ignore
    skillRepository,
    // @ts-ignore
    skillGroupRepository,
    // @ts-ignore
    occupationRepository,
    // @ts-ignore
    occupationGroupRepository,
    // @ts-ignore
    embeddingClient,
    // @ts-ignore
    asyncPublishEmbeddingsTaskInvoker
  );

  return {
    service,
    modelRepository,
    embeddingProcessStateRepository,
    skillRepository,
    skillGroupRepository,
    occupationRepository,
    occupationGroupRepository,
    embeddingClient,
    asyncPublishEmbeddingsTaskInvoker,
  };
}

describe("Test the EmbeddingProcessService", () => {
  const givenModelId = getMockStringId(1);
  const givenProcessId = getMockStringId(10);
  const givenEmbeddingServiceId = "gemini$$models/gemini-embedding-2";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("triggerEmbeddingProcess", () => {
    test("should throw a ModelNotFoundError when the modelId is not a valid object id", async () => {
      // GIVEN a modelId that is not a valid object id
      const givenInvalidModelId = "not-a-valid-object-id";
      const { service, modelRepository, embeddingProcessStateRepository } = setupService({ model: getMockModel(true) });

      // WHEN triggering the embedding process with the invalid modelId
      const actualPromise = service.triggerEmbeddingProcess(givenInvalidModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with a ModelNotFoundError
      await expect(actualPromise).rejects.toThrow(ModelNotFoundError);
      // AND expect the model to not be queried
      expect(modelRepository.getModelById).not.toHaveBeenCalled();
      // AND expect no embedding process state to be created
      expect(embeddingProcessStateRepository.create).not.toHaveBeenCalled();
    });

    test("should throw a ModelNotFoundError when the model does not exist", async () => {
      // GIVEN a model that does not exist
      const { service, embeddingProcessStateRepository } = setupService({ model: null });

      // WHEN triggering the embedding process
      const actualPromise = service.triggerEmbeddingProcess(givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with a ModelNotFoundError
      await expect(actualPromise).rejects.toThrow(ModelNotFoundError);
      // AND expect no embedding process state to be created
      expect(embeddingProcessStateRepository.create).not.toHaveBeenCalled();
    });

    test("should throw a ModelNotReleasedError when the model is not released", async () => {
      // GIVEN a model that is not released
      const { service, embeddingProcessStateRepository } = setupService({ model: getMockModel(false) });

      // WHEN triggering the embedding process
      const actualPromise = service.triggerEmbeddingProcess(givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with a ModelNotReleasedError
      await expect(actualPromise).rejects.toThrow(ModelNotReleasedError);
      // AND expect no embedding process state to be created
      expect(embeddingProcessStateRepository.create).not.toHaveBeenCalled();
    });

    test("should throw a DatabaseError when fetching the model fails", async () => {
      // GIVEN fetching the model will fail
      const { service, modelRepository, embeddingProcessStateRepository } = setupService({ model: getMockModel(true) });
      (modelRepository.getModelById as jest.Mock).mockRejectedValue(new Error("DB connection lost"));

      // WHEN triggering the embedding process
      const actualPromise = service.triggerEmbeddingProcess(givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with a DatabaseError
      await expect(actualPromise).rejects.toThrow("Failed to find the taxonomy model by id");
      // AND expect no embedding process state to be created
      expect(embeddingProcessStateRepository.create).not.toHaveBeenCalled();
    });

    test("should throw a DatabaseError when fetching the unfinished embedding process fails", async () => {
      // GIVEN a released model AND fetching the unfinished embedding process will fail
      const { service, embeddingProcessStateRepository } = setupService({ model: getMockModel(true) });
      (embeddingProcessStateRepository.findPendingByModelId as jest.Mock).mockRejectedValue(
        new Error("DB connection lost")
      );

      // WHEN triggering the embedding process
      const actualPromise = service.triggerEmbeddingProcess(givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with a DatabaseError
      await expect(actualPromise).rejects.toThrow("Failed to find the embedding process state by model id");
      // AND expect no embedding process state to be created
      expect(embeddingProcessStateRepository.create).not.toHaveBeenCalled();
    });

    test("should throw a wrapped error when creating the embedding process state fails", async () => {
      // GIVEN a released model with no unfinished embedding process
      // AND creating the embedding process state will fail
      const { service, embeddingProcessStateRepository, asyncPublishEmbeddingsTaskInvoker } = setupService({
        model: getMockModel(true),
        pendingProcess: null,
      });
      const givenCause = new Error("DB connection lost");
      (embeddingProcessStateRepository.create as jest.Mock).mockRejectedValue(givenCause);

      // WHEN triggering the embedding process
      const actualPromise = service.triggerEmbeddingProcess(givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with a wrapped error
      await expect(actualPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          `Failed to trigger embedding process for model ${givenModelId}.`,
          givenCause.message
        )
      );
      // AND expect the async publish lambda to not be invoked
      expect(asyncPublishEmbeddingsTaskInvoker.invoke).not.toHaveBeenCalled();
    });

    test("should throw an EmbeddingProcessAlreadyRunningError when there is an unfinished process for the model", async () => {
      // GIVEN a released model AND an unfinished embedding process for the model
      const { service, embeddingProcessStateRepository } = setupService({
        model: getMockModel(true),
        pendingProcess: getMockEmbeddingProcessState(),
      });

      // WHEN triggering the embedding process
      const actualPromise = service.triggerEmbeddingProcess(givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with an EmbeddingProcessAlreadyRunningError
      await expect(actualPromise).rejects.toThrow(EmbeddingProcessAlreadyRunningError);
      // AND expect no embedding process state to be created
      expect(embeddingProcessStateRepository.create).not.toHaveBeenCalled();
    });

    test("should create a PENDING process state, invoke the async publish lambda and return the created state", async () => {
      // GIVEN a released model with no unfinished embedding process
      const givenCreatedProcessState = getMockEmbeddingProcessState({ id: givenProcessId });
      const {
        service,
        modelRepository,
        embeddingProcessStateRepository,
        embeddingClient,
        asyncPublishEmbeddingsTaskInvoker,
      } = setupService({
        model: getMockModel(true),
        pendingProcess: null,
        createdProcessState: givenCreatedProcessState,
      });

      // WHEN triggering the embedding process
      const actualProcessState = await service.triggerEmbeddingProcess(givenModelId, givenEmbeddingServiceId);

      // THEN expect the model to be fetched
      expect(modelRepository.getModelById).toHaveBeenCalledWith(givenModelId);
      // AND expect a new process state to be created in the PENDING status with the given embedding service id
      expect(embeddingProcessStateRepository.create).toHaveBeenCalledWith({
        modelId: givenModelId,
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
        embeddingServiceId: givenEmbeddingServiceId,
        totalDocuments: 0,
        errorCounts: 0,
        warningCounts: 0,
        completedDocuments: 0,
      });
      // AND expect the async publish lambda to be invoked with the created process, model and embedding service
      expect(asyncPublishEmbeddingsTaskInvoker.invoke).toHaveBeenCalledWith({
        processId: givenCreatedProcessState.id,
        modelId: givenModelId,
        embeddingServiceId: givenEmbeddingServiceId,
      });
      // AND expect no task to be pushed to the queue synchronously (that is the background lambda's job)
      expect(embeddingClient.pushTasksToQueue).not.toHaveBeenCalled();
      // AND expect the returned process state to be the created (PENDING) one
      expect(actualProcessState).toEqual(givenCreatedProcessState);
    });

    test("should delete the created process state when invoking the async publish lambda fails", async () => {
      // GIVEN a released model with no unfinished embedding process
      const givenCreatedProcessState = getMockEmbeddingProcessState({ id: givenProcessId });
      const { service, embeddingProcessStateRepository, asyncPublishEmbeddingsTaskInvoker } = setupService({
        model: getMockModel(true),
        pendingProcess: null,
        createdProcessState: givenCreatedProcessState,
      });
      // AND invoking the async publish lambda will fail
      const givenCause = new Error("Lambda unavailable");
      (asyncPublishEmbeddingsTaskInvoker.invoke as jest.Mock).mockRejectedValue(givenCause);

      // WHEN triggering the embedding process
      const actualPromise = service.triggerEmbeddingProcess(givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with a wrapped error
      await expect(actualPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          `Failed to trigger embedding process for model ${givenModelId}.`,
          givenCause.message
        )
      );
      // AND expect the created process state to be deleted so that the model is not blocked by an orphaned record
      expect(embeddingProcessStateRepository.deleteById).toHaveBeenCalledWith(givenCreatedProcessState.id);
    });

    test("should still reject with the original error when the cleanup of the created process state fails", async () => {
      // GIVEN a released model with no unfinished embedding process
      const givenCreatedProcessState = getMockEmbeddingProcessState({ id: givenProcessId });
      const { service, embeddingProcessStateRepository, asyncPublishEmbeddingsTaskInvoker } = setupService({
        model: getMockModel(true),
        pendingProcess: null,
        createdProcessState: givenCreatedProcessState,
      });
      // AND invoking the async publish lambda will fail
      const givenCause = new Error("Lambda unavailable");
      (asyncPublishEmbeddingsTaskInvoker.invoke as jest.Mock).mockRejectedValue(givenCause);
      // AND deleting the created process state will also fail
      (embeddingProcessStateRepository.deleteById as jest.Mock).mockRejectedValue(new Error("delete failed"));

      // WHEN triggering the embedding process
      const actualPromise = service.triggerEmbeddingProcess(givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with the original wrapped error
      await expect(actualPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          `Failed to trigger embedding process for model ${givenModelId}.`,
          givenCause.message
        )
      );
      // AND expect the cleanup to have been attempted
      expect(embeddingProcessStateRepository.deleteById).toHaveBeenCalledWith(givenCreatedProcessState.id);
    });
  });

  describe("publishEmbeddingTasks", () => {
    test("should push all the entities to the queue and update the process state", async () => {
      // GIVEN some entities of each type
      const givenSkills = [{ id: getMockStringId(101) }, { id: getMockStringId(102) }];
      const givenSkillGroups = [{ id: getMockStringId(201) }];
      const givenOccupations = [{ id: getMockStringId(301) }];
      const givenOccupationGroups = [{ id: getMockStringId(401) }];
      const givenTotalDocuments =
        givenSkills.length + givenSkillGroups.length + givenOccupations.length + givenOccupationGroups.length;
      const { service, embeddingProcessStateRepository, embeddingClient } = setupService({
        skills: givenSkills,
        skillGroups: givenSkillGroups,
        occupations: givenOccupations,
        occupationGroups: givenOccupationGroups,
      });

      // WHEN publishing the embedding tasks for the process
      await service.publishEmbeddingTasks(givenProcessId, givenModelId, givenEmbeddingServiceId);

      // THEN expect one batch of tasks to be pushed per entity type
      expect(embeddingClient.pushTasksToQueue).toHaveBeenCalledTimes(4);
      // AND expect the tasks for the skills to be pushed with the skill fields
      expect(embeddingClient.pushTasksToQueue).toHaveBeenCalledWith(
        givenSkills.map((skill) => ({
          modelId: givenModelId,
          entityId: skill.id,
          entityType: EmbeddableEntityType.Skill,
          fields: [EmbeddableField.preferredLabel, EmbeddableField.description, EmbeddableField.altLabels],
        }))
      );
      // AND expect the tasks for the skill groups to be pushed with the skill group fields
      expect(embeddingClient.pushTasksToQueue).toHaveBeenCalledWith([
        {
          modelId: givenModelId,
          entityId: givenSkillGroups[0].id,
          entityType: EmbeddableEntityType.SkillGroup,
          fields: [
            EmbeddableField.preferredLabel,
            EmbeddableField.description,
            EmbeddableField.altLabels,
            EmbeddableField.scopeNote,
          ],
        },
      ]);
      // AND expect the tasks for the occupations to be pushed
      expect(embeddingClient.pushTasksToQueue).toHaveBeenCalledWith([
        {
          modelId: givenModelId,
          entityId: givenOccupations[0].id,
          entityType: EmbeddableEntityType.Occupation,
          fields: [EmbeddableField.preferredLabel, EmbeddableField.description, EmbeddableField.altLabels],
        },
      ]);
      // AND expect the tasks for the occupation groups to be pushed
      expect(embeddingClient.pushTasksToQueue).toHaveBeenCalledWith([
        {
          modelId: givenModelId,
          entityId: givenOccupationGroups[0].id,
          entityType: EmbeddableEntityType.OccupationGroup,
          fields: [EmbeddableField.preferredLabel, EmbeddableField.description, EmbeddableField.altLabels],
        },
      ]);
      // AND expect the process state to be updated with the total documents and the in-progress status
      expect(embeddingProcessStateRepository.update).toHaveBeenCalledWith(givenProcessId, {
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
        totalDocuments: givenTotalDocuments,
      });
    });

    test("should flush the tasks to the queue in chunks when an entity type has more entities than the flush size", async () => {
      // GIVEN more skills than fit in a single flush
      const givenSkillCount = TASKS_FLUSH_SIZE + 2;
      const givenSkills = Array.from({ length: givenSkillCount }, (_, index) => ({ id: getMockStringId(index + 100) }));
      const { service, embeddingClient, embeddingProcessStateRepository } = setupService({
        skills: givenSkills,
      });

      // WHEN publishing the embedding tasks for the process
      await service.publishEmbeddingTasks(givenProcessId, givenModelId, givenEmbeddingServiceId);

      // THEN expect the tasks for the skills to be flushed in chunks of at most the flush size
      const actualPushedBatches = (embeddingClient.pushTasksToQueue as jest.Mock).mock.calls.map((call) => call[0]);
      actualPushedBatches.forEach((actualBatch) => {
        expect(actualBatch.length).toBeLessThanOrEqual(TASKS_FLUSH_SIZE);
      });
      // AND expect all the skills to be pushed exactly once, in order
      const actualPushedEntityIds = actualPushedBatches.flat().map((task) => task.entityId);
      const expectedEntityIds = givenSkills.map((skill) => skill.id);
      expect(actualPushedEntityIds).toEqual(expectedEntityIds);
      // AND expect the process state to be updated with the total number of skills
      expect(embeddingProcessStateRepository.update).toHaveBeenCalledWith(givenProcessId, {
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
        totalDocuments: givenSkillCount,
      });
    });

    test("should mark all the entities of the model as PENDING for the embedding service", async () => {
      // GIVEN some entities
      const givenSkills = [{ id: getMockStringId(101) }];
      const { service, skillRepository, skillGroupRepository, occupationRepository, occupationGroupRepository } =
        setupService({
          skills: givenSkills,
        });

      // WHEN publishing the embedding tasks for the process
      await service.publishEmbeddingTasks(givenProcessId, givenModelId, givenEmbeddingServiceId);

      // THEN expect the entities of every entity collection to be marked as PENDING for the embedding service
      const expectedMarkPendingProps = {
        modelId: givenModelId,
        embeddingServiceId: givenEmbeddingServiceId,
        status: EntityEmbeddingStatus.PENDING,
      };
      expect(skillRepository.setModelEntitiesEmbeddingStatus).toHaveBeenCalledTimes(1);
      expect(skillRepository.setModelEntitiesEmbeddingStatus).toHaveBeenCalledWith(expectedMarkPendingProps);
      expect(skillGroupRepository.setModelEntitiesEmbeddingStatus).toHaveBeenCalledTimes(1);
      expect(skillGroupRepository.setModelEntitiesEmbeddingStatus).toHaveBeenCalledWith(expectedMarkPendingProps);
      expect(occupationRepository.setModelEntitiesEmbeddingStatus).toHaveBeenCalledTimes(1);
      expect(occupationRepository.setModelEntitiesEmbeddingStatus).toHaveBeenCalledWith(expectedMarkPendingProps);
      expect(occupationGroupRepository.setModelEntitiesEmbeddingStatus).toHaveBeenCalledTimes(1);
      expect(occupationGroupRepository.setModelEntitiesEmbeddingStatus).toHaveBeenCalledWith(expectedMarkPendingProps);
    });

    test("should delete the process state when marking the entities as PENDING fails", async () => {
      // GIVEN marking the entities as PENDING will fail
      const { service, embeddingProcessStateRepository, skillRepository } = setupService({});
      const givenCause = new Error("updateMany failed");
      (skillRepository.setModelEntitiesEmbeddingStatus as jest.Mock).mockRejectedValueOnce(givenCause);

      // WHEN publishing the embedding tasks for the process
      const actualPromise = service.publishEmbeddingTasks(givenProcessId, givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with a wrapped error
      await expect(actualPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          `Failed to publish embedding tasks for process ${givenProcessId} of model ${givenModelId}.`,
          givenCause.message
        )
      );
      // AND expect the process state to be deleted so that the model is not blocked by an orphaned record
      expect(embeddingProcessStateRepository.deleteById).toHaveBeenCalledWith(givenProcessId);
    });

    test("should complete the embedding process right away when the model has no entities", async () => {
      // GIVEN a model with no entities
      const { service, embeddingProcessStateRepository, embeddingClient } = setupService({});

      // WHEN publishing the embedding tasks for the process
      await service.publishEmbeddingTasks(givenProcessId, givenModelId, givenEmbeddingServiceId);

      // THEN expect no task to be pushed to the queue
      expect(embeddingClient.pushTasksToQueue).not.toHaveBeenCalled();
      // AND expect the process state to be completed right away, since no queue task will ever come back to complete it
      expect(embeddingProcessStateRepository.update).toHaveBeenCalledWith(givenProcessId, {
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
        totalDocuments: 0,
      });
    });

    test("should complete the embedding process when every document was already handled before the process was marked in progress", async () => {
      // GIVEN one skill
      const givenSkills = [{ id: getMockStringId(101) }];
      // AND by the time the process is marked in progress, the embeddings lambda has already handled every document
      const givenRefreshedProcessState = getMockEmbeddingProcessState({
        id: givenProcessId,
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
        totalDocuments: givenSkills.length,
        completedDocuments: givenSkills.length,
      });
      const { service, embeddingProcessStateRepository } = setupService({
        skills: givenSkills,
        refreshedProcessState: givenRefreshedProcessState,
      });

      // WHEN publishing the embedding tasks for the process
      await service.publishEmbeddingTasks(givenProcessId, givenModelId, givenEmbeddingServiceId);

      // THEN expect the process state to be completed, since no queue task is left to complete it
      expect(embeddingProcessStateRepository.update).toHaveBeenLastCalledWith(givenProcessId, {
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
      });
    });

    test("should not complete the process a second time when the state cannot be re-read after being marked in progress", async () => {
      // GIVEN one skill AND re-reading the process state after the update returns nothing
      const givenSkills = [{ id: getMockStringId(101) }];
      const { service, embeddingProcessStateRepository } = setupService({
        skills: givenSkills,
        refreshedProcessState: null,
      });

      // WHEN publishing the embedding tasks for the process
      await service.publishEmbeddingTasks(givenProcessId, givenModelId, givenEmbeddingServiceId);

      // THEN expect the process state to be updated only once (to IN_PROGRESS), with no second completion update
      expect(embeddingProcessStateRepository.update).toHaveBeenCalledTimes(1);
      expect(embeddingProcessStateRepository.update).toHaveBeenCalledWith(givenProcessId, {
        status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
        totalDocuments: givenSkills.length,
      });
    });

    test("should delete the process state when pushing the tasks to the queue fails", async () => {
      // GIVEN some skills
      const givenSkills = [{ id: getMockStringId(101) }];
      const { service, embeddingClient, embeddingProcessStateRepository } = setupService({
        skills: givenSkills,
      });
      // AND pushing the tasks to the queue will fail
      const givenCause = new Error("SQS unavailable");
      (embeddingClient.pushTasksToQueue as jest.Mock).mockRejectedValue(givenCause);

      // WHEN publishing the embedding tasks for the process
      const actualPromise = service.publishEmbeddingTasks(givenProcessId, givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with a wrapped error
      await expect(actualPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          `Failed to publish embedding tasks for process ${givenProcessId} of model ${givenModelId}.`,
          givenCause.message
        )
      );
      // AND expect the process state to be deleted so that the model is not blocked by an orphaned record
      expect(embeddingProcessStateRepository.deleteById).toHaveBeenCalledWith(givenProcessId);
    });

    test("should still reject with the original error when the cleanup of the process state fails", async () => {
      // GIVEN some skills
      const givenSkills = [{ id: getMockStringId(101) }];
      const { service, embeddingClient, embeddingProcessStateRepository } = setupService({
        skills: givenSkills,
      });
      // AND pushing the tasks to the queue will fail
      const givenCause = new Error("SQS unavailable");
      (embeddingClient.pushTasksToQueue as jest.Mock).mockRejectedValue(givenCause);
      // AND deleting the process state will also fail
      (embeddingProcessStateRepository.deleteById as jest.Mock).mockRejectedValue(new Error("delete failed"));

      // WHEN publishing the embedding tasks for the process
      const actualPromise = service.publishEmbeddingTasks(givenProcessId, givenModelId, givenEmbeddingServiceId);

      // THEN expect it to reject with the original wrapped error
      await expect(actualPromise).rejects.toThrow(
        expect.toMatchErrorWithCause(
          `Failed to publish embedding tasks for process ${givenProcessId} of model ${givenModelId}.`,
          givenCause.message
        )
      );
      // AND expect the cleanup to have been attempted
      expect(embeddingProcessStateRepository.deleteById).toHaveBeenCalledWith(givenProcessId);
    });
  });
});
