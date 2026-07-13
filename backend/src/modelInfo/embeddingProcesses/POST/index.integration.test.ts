// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

// Mock only the AWS SQS client so that no message is ever pushed to a real queue.
// The rest of the module (SendMessageCommand, etc.) stays real so that the actual commands can be asserted.
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

import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "crypto";
import { Connection } from "mongoose";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

import LocaleAPISpecs from "api-specifications/locale";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import EmbeddingsAPISpecs from "api-specifications/embeddings";

import { handler as embeddingProcessesHandler } from "modelInfo/embeddingProcesses";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getEmbeddingsQueueUrl } from "server/config/config";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getTestString } from "_test_utilities/getMockRandomData";
import { usersRequestContext } from "_test_utilities/dataModel";
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
import { validateEmbeddingQueueJob } from "embeddings/specs/queueJob.schema";

const givenEntityCountPerType = 10;
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
    // the repository always creates models as not released, so release it directly in the DB
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

function getEvent(modelId: string, requestContext: object) {
  return {
    httpMethod: HTTP_VERBS.POST,
    path: `/models/${modelId}/embedding-processes`,
    body: JSON.stringify({ embeddingServiceId: givenEmbeddingServiceId }),
    headers: {
      "Content-Type": "application/json",
    },
    requestContext,
  };
}

describe("Test for the POST model embedding processes handler with a DB", () => {
  // set up the ajv validate POST response function
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.POST.Schemas.Response.Payload);
  const validatePOSTResponse: ValidateFunction = ajv.getSchema(
    ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.POST.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;
  // ---

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("ModelEmbeddingProcessesHandlerTestDB");
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
      // delete all documents in the DB
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

  test("POST should respond with the ACCEPTED status code and push one valid SQS message for every entity of the model", async () => {
    // GIVEN a released model in the DB
    const givenModel = await createModelInDB(true);
    // AND the model has 10 skills, 10 skill groups, 10 occupations and 10 occupation groups in the DB
    const givenEntities = await createEntitiesInDB(givenModel.id);
    // guard to ensure that all the entities were actually created in the DB
    expect(givenEntities.skills).toHaveLength(givenEntityCountPerType);
    expect(givenEntities.skillGroups).toHaveLength(givenEntityCountPerType);
    expect(givenEntities.occupations).toHaveLength(givenEntityCountPerType);
    expect(givenEntities.occupationGroups).toHaveLength(givenEntityCountPerType);
    // AND a valid request from a model manager to trigger the embedding process of the model
    const givenEvent = getEvent(givenModel.id, usersRequestContext.MODEL_MANAGER);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await embeddingProcessesHandler(givenEvent);

    // THEN expect the handler to respond with the ACCEPTED status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.ACCEPTED);
    // AND the response passes the JSON Schema validation
    const actualPayload = JSON.parse(actualResponse.body);
    validatePOSTResponse(actualPayload);
    expect(validatePOSTResponse.errors).toBeNull();
    // AND the response to refer to an IN_PROGRESS embedding process for the given model that counts all the entities
    const expectedTotalDocuments = 4 * givenEntityCountPerType;
    expect(actualPayload).toMatchObject({
      modelId: givenModel.id,
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
      embeddingServiceId: givenEmbeddingServiceId,
      totalDocuments: expectedTotalDocuments,
    });

    // AND expect the SQS client to have been called with a SendMessageCommand for every entity of the model
    expect(mockSQSClientSend).toHaveBeenCalledTimes(expectedTotalDocuments);
    const actualCommands = mockSQSClientSend.mock.calls.map(([command]) => command);
    for (const actualCommand of actualCommands) {
      expect(actualCommand).toBeInstanceOf(SendMessageCommand);
      expect(actualCommand.input.QueueUrl).toEqual(getEmbeddingsQueueUrl());
    }
    // AND every message body to be a valid embedding queue job
    const actualTasks: IGenerateEmbeddingTask[] = actualCommands.map((command) =>
      JSON.parse(command.input.MessageBody as string)
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

    // AND the embedding process state to have been persisted in the DB
    const actualProcessState = await getRepositoryRegistry().embeddingProcessState.findById(actualPayload.id);
    expect(actualProcessState).toMatchObject({
      modelId: givenModel.id,
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
      embeddingServiceId: givenEmbeddingServiceId,
      totalDocuments: expectedTotalDocuments,
    });
  });

  test("POST should respond with the FORBIDDEN status code if the user is not a model manager", async () => {
    // GIVEN a released model in the DB
    const givenModel = await createModelInDB(true);
    // AND a valid request from a user that is not a model manager
    const givenEvent = getEvent(givenModel.id, usersRequestContext.REGISTED_USER);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await embeddingProcessesHandler(givenEvent);

    // THEN expect the handler to respond with the FORBIDDEN status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    // AND expect no message to have been pushed to the SQS queue
    expect(mockSQSClientSend).not.toHaveBeenCalled();
  });

  test("POST should respond with the BAD_REQUEST status code and not push any SQS message when the model is not released", async () => {
    // GIVEN a model in the DB that is not released
    const givenModel = await createModelInDB(false);
    // AND a valid request from a model manager to trigger the embedding process of the model
    const givenEvent = getEvent(givenModel.id, usersRequestContext.MODEL_MANAGER);

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await embeddingProcessesHandler(givenEvent);

    // THEN expect the handler to respond with the BAD_REQUEST status code and the MODEL_NOT_RELEASED error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.POST.Enums.Response.Status400.ErrorCodes.MODEL_NOT_RELEASED
    );
    // AND expect no message to have been pushed to the SQS queue
    expect(mockSQSClientSend).not.toHaveBeenCalled();
  });
});
