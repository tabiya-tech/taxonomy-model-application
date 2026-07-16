// Suppress chatty console during the tests
import "_test_utilities/consoleMock";
import "_test_utilities/mockSentry";

import { Connection } from "mongoose";
import { SQSEvent } from "aws-lambda";

import ModelInfoAPISpecs from "api-specifications/modelInfo";
import EmbeddingsAPISpecs from "api-specifications/embeddings";

import { handler } from "./index";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getSimpleNewSkillSpec } from "esco/_test_utilities/getNewSpecs";
import { EmbeddableEntityType, EmbeddableField, IGenerateEmbeddingTask } from "embeddings/service/types";
import { EntityEmbeddingStatus } from "embeddings/entityEmbeddings/entityEmbedding.types";
import { computeSourceHash } from "embeddings/service/sourceText";
import { ModelName as EmbeddingProcessStateModelName } from "embeddings/embeddingProcessState/embeddingProcessStateModel";
import { SkillEmbeddingModelName } from "embeddings/entityEmbeddings/entityEmbeddingModel";
import { MongooseModelName } from "esco/common/mongooseModelNames";

const givenEmbeddingServiceId = EmbeddingsAPISpecs.Constants.EmbeddingServiceIds[0];

function getSQSEvent(tasks: IGenerateEmbeddingTask[]): SQSEvent {
  return {
    Records: tasks.map((task, index) => ({ messageId: `message-${index}`, body: JSON.stringify(task) })),
  } as never;
}

describe("Test the embeddings lambda handler with a DB", () => {
  let dbConnection: Connection | undefined;
  let fetchSpy: jest.SpyInstance;

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("EmbeddingsLambdaHandlerTestDB");
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
    // mock the Gemini API to return a deterministic embedding for every requested text
    fetchSpy = jest.spyOn(global, "fetch").mockImplementation((_url, init) => {
      const requestBody = JSON.parse((init as { body: string }).body);
      const embeddings = requestBody.requests.map((_request: unknown, index: number) => ({
        values: [index + 0.25, index + 0.5],
      }));
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ embeddings }),
        text: () => Promise.resolve(JSON.stringify({ embeddings })),
      } as never);
    });
    if (dbConnection) {
      await Promise.all(
        [EmbeddingProcessStateModelName, SkillEmbeddingModelName, MongooseModelName.Skill].map((modelName) =>
          dbConnection!.models[modelName].deleteMany({})
        )
      );
    }
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  async function givenSkillAndProcessInDB() {
    const givenModelId = getMockStringId(1);
    const givenSkill = await getRepositoryRegistry().skill.create({
      ...getSimpleNewSkillSpec(givenModelId, "Skill 1"),
      description: "some description",
      altLabels: ["first alt label", "second alt label"],
    });
    const givenProcessState = await getRepositoryRegistry().embeddingProcessState.create({
      modelId: givenModelId,
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
      embeddingServiceId: givenEmbeddingServiceId,
      totalDocuments: 1,
      errorCounts: 0,
      warningCounts: 0,
      completedDocuments: 0,
    });
    const givenTask: IGenerateEmbeddingTask = {
      modelId: givenModelId,
      entityId: givenSkill.id,
      entityType: EmbeddableEntityType.Skill,
      fields: [EmbeddableField.preferredLabel, EmbeddableField.description, EmbeddableField.altLabels],
    };
    return { givenModelId, givenSkill, givenProcessState, givenTask };
  }

  test("should generate and store the embeddings of a skill and complete the embedding process", async () => {
    // GIVEN a skill and an in-progress embedding process for its model in the DB
    const { givenModelId, givenSkill, givenProcessState, givenTask } = await givenSkillAndProcessInDB();
    // AND an SQS event with the task for the skill
    const givenEvent = getSQSEvent([givenTask]);

    // WHEN the handler is invoked with the given event
    await handler(givenEvent, {} as never, {} as never);

    // THEN expect one embedding per field to have been stored in the skills embeddings collection
    const actualEmbeddings = await getRepositoryRegistry().skillEmbedding.findByEntity(
      givenModelId,
      givenSkill.id,
      givenEmbeddingServiceId
    );
    const expectedSourceTexts: Record<string, string> = {
      [EmbeddableField.preferredLabel]: givenSkill.preferredLabel,
      [EmbeddableField.description]: givenSkill.description,
      [EmbeddableField.altLabels]: givenSkill.altLabels.join("\n"),
    };
    expect(actualEmbeddings).toHaveLength(3);
    for (const actualEmbedding of actualEmbeddings) {
      expect(actualEmbedding).toMatchObject({
        modelId: givenModelId,
        entityId: givenSkill.id,
        embeddingServiceId: givenEmbeddingServiceId,
        sourceText: expectedSourceTexts[actualEmbedding.sourceField],
        sourceHash: computeSourceHash(expectedSourceTexts[actualEmbedding.sourceField]),
      });
      expect(actualEmbedding.vector).toHaveLength(2);
    }
    // AND expect the skill to have been marked as COMPLETED for the embedding service
    const actualSkillDoc = await getRepositoryRegistry().skill.Model.findById(givenSkill.id).exec();
    expect(actualSkillDoc!.embeddingStatus!.get(givenEmbeddingServiceId)).toEqual(EntityEmbeddingStatus.COMPLETED);
    // AND expect the embedding process to have counted the document and to have been completed
    const actualProcessState = await getRepositoryRegistry().embeddingProcessState.findById(givenProcessState.id);
    expect(actualProcessState).toMatchObject({
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
      completedDocuments: 1,
      errorCounts: 0,
    });
  });

  test("should not re-embed the fields whose source text has not changed", async () => {
    // GIVEN a skill whose embeddings have already been generated by a previous run of the handler
    const { givenTask } = await givenSkillAndProcessInDB();
    await handler(getSQSEvent([givenTask]), {} as never, {} as never);
    // guard to ensure that the first run has actually called the Gemini API
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockClear();
    // AND a new in-progress embedding process for the model (the first one has been completed by the first run)
    await getRepositoryRegistry().embeddingProcessState.create({
      modelId: givenTask.modelId,
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
      embeddingServiceId: givenEmbeddingServiceId,
      totalDocuments: 1,
      errorCounts: 0,
      warningCounts: 0,
      completedDocuments: 0,
    });

    // WHEN the handler is invoked again with the same task
    await handler(getSQSEvent([givenTask]), {} as never, {} as never);

    // THEN expect the Gemini API to not have been called again, since no source text has changed
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("should generate the embeddings of all the records of the event with a single call to the Gemini API", async () => {
    // GIVEN two skills and an in-progress embedding process for their model in the DB
    const givenModelId = getMockStringId(1);
    const givenSkill1 = await getRepositoryRegistry().skill.create(getSimpleNewSkillSpec(givenModelId, "Skill 1"));
    const givenSkill2 = await getRepositoryRegistry().skill.create(getSimpleNewSkillSpec(givenModelId, "Skill 2"));
    const givenProcessState = await getRepositoryRegistry().embeddingProcessState.create({
      modelId: givenModelId,
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
      embeddingServiceId: givenEmbeddingServiceId,
      totalDocuments: 2,
      errorCounts: 0,
      warningCounts: 0,
      completedDocuments: 0,
    });
    // AND an SQS event with one task per skill
    const givenTasks: IGenerateEmbeddingTask[] = [givenSkill1, givenSkill2].map((skill) => ({
      modelId: givenModelId,
      entityId: skill.id,
      entityType: EmbeddableEntityType.Skill,
      fields: [EmbeddableField.preferredLabel],
    }));
    const givenEvent = getSQSEvent(givenTasks);

    // WHEN the handler is invoked with the given event
    await handler(givenEvent, {} as never, {} as never);

    // THEN expect the Gemini API to have been called only once for the whole event
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    // AND expect each skill to have been stored with the embedding of its own source text
    // (the mocked Gemini API returns [index + 0.25, index + 0.5] for the text at the given index of the batch)
    const actualEmbeddings1 = await getRepositoryRegistry().skillEmbedding.findByEntity(
      givenModelId,
      givenSkill1.id,
      givenEmbeddingServiceId
    );
    expect(actualEmbeddings1).toHaveLength(1);
    expect(actualEmbeddings1[0].sourceText).toEqual(givenSkill1.preferredLabel);
    expect(actualEmbeddings1[0].vector).toEqual([0.25, 0.5]);
    const actualEmbeddings2 = await getRepositoryRegistry().skillEmbedding.findByEntity(
      givenModelId,
      givenSkill2.id,
      givenEmbeddingServiceId
    );
    expect(actualEmbeddings2).toHaveLength(1);
    expect(actualEmbeddings2[0].sourceText).toEqual(givenSkill2.preferredLabel);
    expect(actualEmbeddings2[0].vector).toEqual([1.25, 1.5]);
    // AND expect the embedding process to have counted both documents and to have been completed
    const actualProcessState = await getRepositoryRegistry().embeddingProcessState.findById(givenProcessState.id);
    expect(actualProcessState).toMatchObject({
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
      completedDocuments: 2,
      errorCounts: 0,
    });
  });
});
