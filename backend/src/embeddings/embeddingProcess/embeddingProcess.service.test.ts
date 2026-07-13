// silence chatty console
import "_test_utilities/consoleMock";

import { Readable } from "node:stream";
import ModelInfoApiSpecs from "api-specifications/modelInfo";
import { EmbeddingProcessService } from "./embeddingProcess.service";
import { EmbeddingProcessAlreadyRunningError, ModelNotFoundError, ModelNotReleasedError } from "./errors";
import { EmbeddableEntityType, EmbeddableField } from "embeddings/service/types";
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
}) {
  const modelRepository = {
    getModelById: jest.fn().mockResolvedValue(mocks.model),
  };
  const embeddingProcessStateRepository = {
    findPendingByModelId: jest.fn().mockResolvedValue(mocks.pendingProcess ?? null),
    create: jest.fn().mockResolvedValue(mocks.createdProcessState ?? getMockEmbeddingProcessState()),
    update: jest.fn().mockResolvedValue(mocks.updatedProcessState ?? getMockEmbeddingProcessState()),
  };
  const skillRepository = { findAll: jest.fn().mockReturnValue(Readable.from(mocks.skills ?? [])) };
  const skillGroupRepository = { findAll: jest.fn().mockReturnValue(Readable.from(mocks.skillGroups ?? [])) };
  const occupationRepository = { findAll: jest.fn().mockReturnValue(Readable.from(mocks.occupations ?? [])) };
  const occupationGroupRepository = {
    findAll: jest.fn().mockReturnValue(Readable.from(mocks.occupationGroups ?? [])),
  };
  const embeddingClient = { pushTaskToQueue: jest.fn().mockResolvedValue(undefined) };

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
    embeddingClient
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
  };
}

describe("Test the EmbeddingProcessService", () => {
  const givenModelId = getMockStringId(1);
  const givenEmbeddingServiceId = "gemini$$models/gemini-embedding-2";

  beforeEach(() => {
    jest.clearAllMocks();
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

  test("should create a process state, push all the entities to the queue and update the process state", async () => {
    // GIVEN a released model with no unfinished embedding process
    // AND some entities of each type
    const givenSkills = [{ id: getMockStringId(101) }, { id: getMockStringId(102) }];
    const givenSkillGroups = [{ id: getMockStringId(201) }];
    const givenOccupations = [{ id: getMockStringId(301) }];
    const givenOccupationGroups = [{ id: getMockStringId(401) }];
    const givenTotalDocuments =
      givenSkills.length + givenSkillGroups.length + givenOccupations.length + givenOccupationGroups.length;
    // AND a created process state
    const givenCreatedProcessState = getMockEmbeddingProcessState({ id: getMockStringId(10) });
    // AND an updated process state
    const givenUpdatedProcessState = getMockEmbeddingProcessState({
      id: getMockStringId(10),
      status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
      totalDocuments: givenTotalDocuments,
    });
    const { service, modelRepository, embeddingProcessStateRepository, embeddingClient } = setupService({
      model: getMockModel(true),
      pendingProcess: null,
      skills: givenSkills,
      skillGroups: givenSkillGroups,
      occupations: givenOccupations,
      occupationGroups: givenOccupationGroups,
      createdProcessState: givenCreatedProcessState,
      updatedProcessState: givenUpdatedProcessState,
    });

    // WHEN triggering the embedding process
    const actualProcessState = await service.triggerEmbeddingProcess(givenModelId, givenEmbeddingServiceId);

    // THEN expect the model to be fetched
    expect(modelRepository.getModelById).toHaveBeenCalledWith(givenModelId);
    // AND expect a new process state to be created with the given embedding model id
    expect(embeddingProcessStateRepository.create).toHaveBeenCalledWith({
      modelId: givenModelId,
      status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
      embeddingServiceId: givenEmbeddingServiceId,
      totalDocuments: 0,
      errorCounts: 0,
      warningCounts: 0,
      completedDocuments: 0,
    });
    // AND expect one task to be pushed per entity
    expect(embeddingClient.pushTaskToQueue).toHaveBeenCalledTimes(givenTotalDocuments);
    // AND expect the tasks for the skills to be pushed with the skill fields
    expect(embeddingClient.pushTaskToQueue).toHaveBeenCalledWith({
      modelId: givenModelId,
      entityId: givenSkills[0].id,
      entityType: EmbeddableEntityType.Skill,
      fields: [EmbeddableField.preferredLabel, EmbeddableField.description, EmbeddableField.altLabels],
    });
    // AND expect the task for the skill group to be pushed with the skill group fields
    expect(embeddingClient.pushTaskToQueue).toHaveBeenCalledWith({
      modelId: givenModelId,
      entityId: givenSkillGroups[0].id,
      entityType: EmbeddableEntityType.SkillGroup,
      fields: [
        EmbeddableField.preferredLabel,
        EmbeddableField.description,
        EmbeddableField.altLabels,
        EmbeddableField.scopeNote,
      ],
    });
    // AND expect the task for the occupation to be pushed
    expect(embeddingClient.pushTaskToQueue).toHaveBeenCalledWith({
      modelId: givenModelId,
      entityId: givenOccupations[0].id,
      entityType: EmbeddableEntityType.Occupation,
      fields: [EmbeddableField.preferredLabel, EmbeddableField.description, EmbeddableField.altLabels],
    });
    // AND expect the task for the occupation group to be pushed
    expect(embeddingClient.pushTaskToQueue).toHaveBeenCalledWith({
      modelId: givenModelId,
      entityId: givenOccupationGroups[0].id,
      entityType: EmbeddableEntityType.OccupationGroup,
      fields: [EmbeddableField.preferredLabel, EmbeddableField.description, EmbeddableField.altLabels],
    });
    // AND expect the process state to be updated with the total documents and the in-progress status
    expect(embeddingProcessStateRepository.update).toHaveBeenCalledWith(givenCreatedProcessState.id, {
      status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
      totalDocuments: givenTotalDocuments,
    });
    // AND expect the returned process state to be the updated one
    expect(actualProcessState).toEqual(givenUpdatedProcessState);
  });
});
