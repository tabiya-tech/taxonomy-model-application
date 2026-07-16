// Suppress chatty console during the tests
import "_test_utilities/consoleMock";
import "_test_utilities/mockSentry";

// Mock only the AWS SQS client so that no message is ever pushed to a real queue.
// The rest of the module (SendMessageBatchCommand, etc.) stays real so that the actual commands can be asserted.
const mockSQSClientSend = jest.fn().mockResolvedValue({});
jest.mock("@aws-sdk/client-sqs", () => {
  const actual = jest.requireActual("@aws-sdk/client-sqs");
  return {
    ...actual,
    SQSClient: jest.fn().mockImplementation(() => ({
      send: mockSQSClientSend,
    })),
  };
});

import { randomUUID } from "crypto";
import { Connection } from "mongoose";
import { SendMessageBatchCommand } from "@aws-sdk/client-sqs";

import LocaleAPISpecs from "api-specifications/locale";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import EmbeddingsAPISpecs from "api-specifications/embeddings";

import { handler as publishEmbeddingsTaskHandler } from "./index";
import { IPublishEmbeddingsTaskEvent } from "./asyncPublishEmbeddingsTask.types";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getEmbeddingsQueueUrl } from "server/config/config";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getTestString } from "_test_utilities/getMockRandomData";
import {
  getSimpleNewESCOOccupationSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewSkillGroupSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ModelName as ModelInfoModelName } from "modelInfo/modelInfoModel";
import { ModelName as EmbeddingProcessStateModelName } from "embeddings/embeddingProcessState/embeddingProcessStateModel";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { EmbeddableEntityType, EmbeddableField, IGenerateEmbeddingTask } from "embeddings/service/types";
import { SQS_MAX_BATCH_SIZE } from "embeddings/service/client";
import { validateEmbeddingQueueJob } from "embeddings/specs/queueJob.schema";

const givenEntityCountPerType = 100;
const givenEmbeddingServiceId = EmbeddingsAPISpecs.Constants.EmbeddingServiceIds[0];

/**
 * The fields that the embedding process is expected to embed for each entity type.
 */
const expectedFieldsByEntityType: Record<EmbeddableEntityType, EmbeddableField[]> = {
  [EmbeddableEntityType.Skill]: [
    EmbeddableField.preferredLabel,
    EmbeddableField.description,
    EmbeddableField.altLabels,
  ],
  [EmbeddableEntityType.SkillGroup]: [
    EmbeddableField.preferredLabel,
    EmbeddableField.description,
    EmbeddableField.altLabels,
    EmbeddableField.scopeNote,
  ],
  [EmbeddableEntityType.Occupation]: [
    EmbeddableField.preferredLabel,
    EmbeddableField.description,
    EmbeddableField.altLabels,
  ],
  [EmbeddableEntityType.OccupationGroup]: [
    EmbeddableField.preferredLabel,
    EmbeddableField.description,
    EmbeddableField.altLabels,
  ],
};

async function createModelInDB(released: boolean): Promise<IModelInfo> {
  const modelInfoRepository = getRepositoryRegistry().modelInfo;
  const newModel = await modelInfoRepository.create({
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    UUIDHistory: [randomUUID()],
  });
  if (released) {
    await modelInfoRepository.Model.findByIdAndUpdate(newModel.id, { released: true });
  }
  return { ...newModel, released };
}

async function createEntitiesInDB(modelId: string) {
  const repositoryRegistry = getRepositoryRegistry();
  const skills = await repositoryRegistry.skill.createMany(
    Array.from({ length: givenEntityCountPerType }, (_, index) => getSimpleNewSkillSpec(modelId, `Skill ${index + 1}`))
  );
  const skillGroups = await repositoryRegistry.skillGroup.createMany(
    Array.from({ length: givenEntityCountPerType }, (_, index) =>
      getSimpleNewSkillGroupSpec(modelId, `Skill Group ${index + 1}`)
    )
  );
  const occupations = await repositoryRegistry.occupation.createMany(
    Array.from({ length: givenEntityCountPerType }, (_, index) =>
      getSimpleNewESCOOccupationSpec(modelId, `Occupation ${index + 1}`)
    )
  );
  const occupationGroups = await repositoryRegistry.OccupationGroup.createMany(
    Array.from({ length: givenEntityCountPerType }, (_, index) =>
      getSimpleNewISCOGroupSpec(modelId, `Occupation Group ${index + 1}`)
    )
  );
  return { skills, skillGroups, occupations, occupationGroups };
}

async function createPendingProcessStateInDB(modelId: string): Promise<string> {
  const processState = await getRepositoryRegistry().embeddingProcessState.create({
    modelId,
    status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
    embeddingServiceId: givenEmbeddingServiceId,
    totalDocuments: 0,
    errorCounts: 0,
    warningCounts: 0,
    completedDocuments: 0,
  });
  return processState.id;
}

function getEvent(processId: string, modelId: string): IPublishEmbeddingsTaskEvent {
  return { processId, modelId, embeddingServiceId: givenEmbeddingServiceId };
}

describe("Test the async-publish-embeddings-task lambda handler with a DB", () => {
  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("PublishEmbeddingsTaskHandlerTestDB");
    const configModule = await import("server/config/config");
    jest.spyOn(configModule, "readEnvironmentConfiguration").mockReturnValue(config);
    await initOnce();
    dbConnection = getConnectionManager().getCurrentDBConnection();
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close();
    }
  });

  beforeEach(async () => {
    mockSQSClientSend.mockClear();
    if (dbConnection) {
      await Promise.all(
        [
          ModelInfoModelName,
          EmbeddingProcessStateModelName,
          MongooseModelName.Skill,
          MongooseModelName.SkillGroup,
          MongooseModelName.Occupation,
          MongooseModelName.OccupationGroup,
        ].map((modelName) => dbConnection!.models[modelName].deleteMany({}))
      );
    }
  });

  test("should push valid SQS message batches covering every entity of the model and mark the process IN_PROGRESS", async () => {
    // GIVEN a released model in the DB with entities of every type
    const givenModel = await createModelInDB(true);
    const givenEntities = await createEntitiesInDB(givenModel.id);
    // guard to ensure that all the entities were actually created in the DB
    expect(givenEntities.skills).toHaveLength(givenEntityCountPerType);
    expect(givenEntities.skillGroups).toHaveLength(givenEntityCountPerType);
    expect(givenEntities.occupations).toHaveLength(givenEntityCountPerType);
    expect(givenEntities.occupationGroups).toHaveLength(givenEntityCountPerType);
    // AND a PENDING embedding process state that was created by the POST endpoint
    const givenProcessId = await createPendingProcessStateInDB(givenModel.id);
    // AND the event that the POST endpoint would have used to invoke this lambda
    const givenEvent = getEvent(givenProcessId, givenModel.id);

    // WHEN the handler is invoked with the given event
    const actualPromise = publishEmbeddingsTaskHandler(givenEvent, {} as never, {} as never);

    // THEN expect it to resolve without throwing
    await expect(actualPromise).resolves.toBeUndefined();

    // AND expect the SQS client to have been called with SendMessageBatchCommands of at most the maximum SQS batch size,
    //     one chunk per entity type since each entity type is flushed to the queue separately
    const expectedBatchCount = 4 * Math.ceil(givenEntityCountPerType / SQS_MAX_BATCH_SIZE);
    expect(mockSQSClientSend).toHaveBeenCalledTimes(expectedBatchCount);
    const actualCommands = mockSQSClientSend.mock.calls.map(([command]) => command);
    for (const actualCommand of actualCommands) {
      expect(actualCommand).toBeInstanceOf(SendMessageBatchCommand);
      expect(actualCommand.input.QueueUrl).toEqual(getEmbeddingsQueueUrl());
      expect(actualCommand.input.Entries.length).toBeLessThanOrEqual(SQS_MAX_BATCH_SIZE);
    }
    // AND every message body of every batch to be a valid embedding queue job
    const actualTasks: IGenerateEmbeddingTask[] = actualCommands.flatMap((command) =>
      command.input.Entries.map((entry: { MessageBody: string }) => JSON.parse(entry.MessageBody))
    );
    for (const actualTask of actualTasks) {
      expect(validateEmbeddingQueueJob(actualTask)).toBe(true);
    }
    // AND the queued jobs to reference exactly the entities in the DB with the expected fields for each entity type
    const expectedTasks: IGenerateEmbeddingTask[] = [
      ...givenEntities.skills.map((skill) => ({
        modelId: givenModel.id,
        entityId: skill.id,
        entityType: EmbeddableEntityType.Skill,
        fields: expectedFieldsByEntityType[EmbeddableEntityType.Skill],
      })),
      ...givenEntities.skillGroups.map((skillGroup) => ({
        modelId: givenModel.id,
        entityId: skillGroup.id,
        entityType: EmbeddableEntityType.SkillGroup,
        fields: expectedFieldsByEntityType[EmbeddableEntityType.SkillGroup],
      })),
      ...givenEntities.occupations.map((occupation) => ({
        modelId: givenModel.id,
        entityId: occupation.id,
        entityType: EmbeddableEntityType.Occupation,
        fields: expectedFieldsByEntityType[EmbeddableEntityType.Occupation],
      })),
      ...givenEntities.occupationGroups.map((occupationGroup) => ({
        modelId: givenModel.id,
        entityId: occupationGroup.id,
        entityType: EmbeddableEntityType.OccupationGroup,
        fields: expectedFieldsByEntityType[EmbeddableEntityType.OccupationGroup],
      })),
    ];
    expect(actualTasks).toHaveLength(expectedTasks.length);
    expect(actualTasks).toEqual(expect.arrayContaining(expectedTasks));

    // AND the embedding process state to have been updated in the DB to IN_PROGRESS counting all the entities
    const expectedTotalDocuments = 4 * givenEntityCountPerType;
    const actualProcessState = await getRepositoryRegistry().embeddingProcessState.findById(givenProcessId);
    expect(actualProcessState).toMatchObject({
      modelId: givenModel.id,
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
      embeddingServiceId: givenEmbeddingServiceId,
      totalDocuments: expectedTotalDocuments,
    });
  });

  test("should complete the process and delete nothing when the model has no entities", async () => {
    // GIVEN a released model in the DB with no entities
    const givenModel = await createModelInDB(true);
    // AND a PENDING embedding process state that was created by the POST endpoint
    const givenProcessId = await createPendingProcessStateInDB(givenModel.id);
    // AND the event that the POST endpoint would have used to invoke this lambda
    const givenEvent = getEvent(givenProcessId, givenModel.id);

    // WHEN the handler is invoked with the given event
    await publishEmbeddingsTaskHandler(givenEvent, {} as never, {} as never);

    // THEN expect no message to have been pushed to the queue
    expect(mockSQSClientSend).not.toHaveBeenCalled();
    // AND the embedding process state to have been completed right away, since no queue task will complete it
    const actualProcessState = await getRepositoryRegistry().embeddingProcessState.findById(givenProcessId);
    expect(actualProcessState).toMatchObject({
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
      totalDocuments: 0,
    });
  });
});
