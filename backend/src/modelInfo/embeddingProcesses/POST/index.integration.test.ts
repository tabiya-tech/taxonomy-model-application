// Suppress chatty console during the tests
import "_test_utilities/consoleMock";

// Mock only the AWS Lambda client so that no real lambda is ever invoked.
// The rest of the module (InvokeCommand, etc.) stays real so that the actual command can be asserted.
const mockLambdaClientSend = jest.fn().mockResolvedValue({});
jest.mock("@aws-sdk/client-lambda", () => {
  const actual = jest.requireActual("@aws-sdk/client-lambda");
  return {
    ...actual,
    LambdaClient: jest.fn().mockImplementation(() => ({
      send: mockLambdaClientSend,
    })),
  };
});

import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "crypto";
import { Connection } from "mongoose";
import { InvokeCommand } from "@aws-sdk/client-lambda";

import LocaleAPISpecs from "api-specifications/locale";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import EmbeddingsAPISpecs from "api-specifications/embeddings";

import { handler as embeddingProcessesHandler } from "modelInfo/embeddingProcesses";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getAsyncPublishEmbeddingsTaskLambdaFunctionArn } from "server/config/config";
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
import { IPublishEmbeddingsTaskEvent } from "embeddings/asyncPublishEmbeddingsTask/asyncPublishEmbeddingsTask.types";

const givenEntityCountPerType = 100;
const givenEmbeddingServiceId = EmbeddingsAPISpecs.Constants.EmbeddingServiceIds[0];

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
    mockLambdaClientSend.mockClear();
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

  test("POST should respond with ACCEPTED, persist a PENDING process state and invoke the async publish lambda", async () => {
    // GIVEN a released model in the DB
    const givenModel = await createModelInDB(true);
    // AND the model has entities of every type in the DB
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
    // AND the response to refer to a PENDING embedding process for the given model (the entities are published
    //     to the queue in the background, so the request returns immediately with an empty document count)
    expect(actualPayload).toMatchObject({
      modelId: givenModel.id,
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
      embeddingServiceId: givenEmbeddingServiceId,
      totalDocuments: 0,
    });

    // AND the async publish lambda to have been invoked exactly once, asynchronously, with the created process
    expect(mockLambdaClientSend).toHaveBeenCalledTimes(1);
    const actualCommand = mockLambdaClientSend.mock.calls[0][0];
    expect(actualCommand).toBeInstanceOf(InvokeCommand);
    expect(actualCommand.input.FunctionName).toEqual(getAsyncPublishEmbeddingsTaskLambdaFunctionArn());
    expect(actualCommand.input.InvocationType).toEqual("Event");
    const actualInvokeEvent: IPublishEmbeddingsTaskEvent = JSON.parse(
      new TextDecoder().decode(actualCommand.input.Payload)
    );
    expect(actualInvokeEvent).toEqual({
      processId: actualPayload.id,
      modelId: givenModel.id,
      embeddingServiceId: givenEmbeddingServiceId,
    });

    // AND the embedding process state to have been persisted in the DB in the PENDING status
    const actualProcessState = await getRepositoryRegistry().embeddingProcessState.findById(actualPayload.id);
    expect(actualProcessState).toMatchObject({
      modelId: givenModel.id,
      status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
      embeddingServiceId: givenEmbeddingServiceId,
      totalDocuments: 0,
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
    // AND expect the async publish lambda to not have been invoked
    expect(mockLambdaClientSend).not.toHaveBeenCalled();
  });

  test("POST should respond with the BAD_REQUEST status code and not invoke the lambda when the model is not released", async () => {
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
    // AND expect the async publish lambda to not have been invoked
    expect(mockLambdaClientSend).not.toHaveBeenCalled();
  });
});
