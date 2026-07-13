// silence chatty console
import "_test_utilities/consoleMock";

// Mock the authorizer so the role check is a no-op
jest.mock("auth/authorizer", () => ({
  checkRole: jest.fn().mockImplementation(() => true),
  RoleRequired: jest.fn().mockImplementation(() => {
    return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
      return descriptor;
    };
  }),
}));

// Mock the service registry so we can control the embedding process service
const mockTriggerEmbeddingProcess = jest.fn();
jest.mock("server/serviceRegistry/serviceRegistry", () => ({
  getServiceRegistry: jest.fn().mockReturnValue({
    embeddingProcess: { triggerEmbeddingProcess: mockTriggerEmbeddingProcess },
  }),
}));

import { POSTModelEmbeddingProcessesHandler } from "./index";
import { transformEmbeddingProcessState } from "./transform";
import ModelInfoApiSpecs from "api-specifications/modelInfo";
import EmbeddingsAPISpecs from "api-specifications/embeddings";
import ErrorAPISpecs from "api-specifications/error";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { IEmbeddingProcessState } from "embeddings/embeddingProcessState/embeddingProcessState.types";
import {
  EmbeddingProcessAlreadyRunningError,
  ModelNotFoundError,
  ModelNotReleasedError,
} from "embeddings/embeddingProcess/errors";

const givenModelId = getMockStringId(1);
const givenEmbeddingServiceId = EmbeddingsAPISpecs.Constants.EmbeddingServiceIds[0];

function getEvent(options: { body?: string; modelId?: string | null; contentType?: string }): APIGatewayProxyEvent {
  const modelId = options.modelId === undefined ? givenModelId : options.modelId;
  const path = modelId === null ? `/models/embedding-processes` : `/models/${modelId}/embedding-processes`;
  return {
    httpMethod: HTTP_VERBS.POST,
    path,
    body: options.body ?? JSON.stringify({ embeddingServiceId: givenEmbeddingServiceId }),
    headers: {
      "Content-Type": options.contentType ?? "application/json",
    },
  } as never;
}

function getMockEmbeddingProcessState(): IEmbeddingProcessState {
  return {
    id: getMockStringId(10),
    modelId: givenModelId,
    status: ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
    embeddingServiceId: givenEmbeddingServiceId,
    totalDocuments: 5,
    errorCounts: 0,
    warningCounts: 0,
    completedDocuments: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("Test the POSTModelEmbeddingProcessesHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should respond with ACCEPTED and the created embedding process state on success", async () => {
    // GIVEN a valid event
    const givenEvent = getEvent({});
    // AND the service will trigger the embedding process successfully
    const givenProcessState = getMockEmbeddingProcessState();
    mockTriggerEmbeddingProcess.mockResolvedValueOnce(givenProcessState);

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect the service to be called with the model id and the embedding model id
    expect(mockTriggerEmbeddingProcess).toHaveBeenCalledWith(givenModelId, givenEmbeddingServiceId);
    // AND expect a 202 response with the transformed embedding process state
    expect(actualResponse.statusCode).toEqual(StatusCodes.ACCEPTED);
    expect(JSON.parse(actualResponse.body)).toEqual(transformEmbeddingProcessState(givenProcessState));
  });

  test("should respond with UNSUPPORTED_MEDIA_TYPE when the content type is not json", async () => {
    // GIVEN an event with an invalid content type
    const givenEvent = getEvent({ contentType: "text/html" });

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect a 415 response
    expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    // AND expect the service to not be called
    expect(mockTriggerEmbeddingProcess).not.toHaveBeenCalled();
  });

  test("should respond with TOO_LARGE_PAYLOAD when the payload is too large", async () => {
    // GIVEN an event with a payload that is too large
    const givenEvent = getEvent({
      body: "a".repeat(ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Constants.MAX_PAYLOAD_LENGTH + 1),
    });

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect a 413 response
    expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    // AND expect the service to not be called
    expect(mockTriggerEmbeddingProcess).not.toHaveBeenCalled();
  });

  test("should respond with BAD_REQUEST when the modelId is missing in the path", async () => {
    // GIVEN an event whose path does not contain a modelId
    const givenEvent = getEvent({ modelId: null });

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect a 400 response with the INVALID_JSON_SCHEMA error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    // AND expect the service to not be called
    expect(mockTriggerEmbeddingProcess).not.toHaveBeenCalled();
  });

  test("should respond with BAD_REQUEST when the body is malformed", async () => {
    // GIVEN an event with a malformed body
    const givenEvent = getEvent({ body: "{ not json" });

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect a 400 response with the MALFORMED_BODY error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY);
    // AND expect the service to not be called
    expect(mockTriggerEmbeddingProcess).not.toHaveBeenCalled();
  });

  test("should respond with BAD_REQUEST when the body does not conform to the schema", async () => {
    // GIVEN an event with a body that does not conform to the schema
    const givenEvent = getEvent({ body: JSON.stringify({ foo: "bar" }) });

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect a 400 response with the INVALID_JSON_SCHEMA error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    // AND expect the service to not be called
    expect(mockTriggerEmbeddingProcess).not.toHaveBeenCalled();
  });

  test("should respond with BAD_REQUEST when the embeddingServiceId is not supported", async () => {
    // GIVEN an event with an unsupported embeddingServiceId
    const givenEvent = getEvent({ body: JSON.stringify({ embeddingServiceId: "unsupported-model" }) });

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect a 400 response with the INVALID_JSON_SCHEMA error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    // AND expect the service to not be called
    expect(mockTriggerEmbeddingProcess).not.toHaveBeenCalled();
  });

  test("should respond with NOT_FOUND when the model does not exist", async () => {
    // GIVEN a valid event
    const givenEvent = getEvent({});
    // AND the service throws a ModelNotFoundError
    mockTriggerEmbeddingProcess.mockRejectedValueOnce(new ModelNotFoundError(givenModelId));

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect a 404 response with the MODEL_NOT_FOUND_BY_ID error code as documented in the API specification
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
    );
  });

  test("should respond with BAD_REQUEST when the model is not released", async () => {
    // GIVEN a valid event
    const givenEvent = getEvent({});
    // AND the service throws a ModelNotReleasedError
    mockTriggerEmbeddingProcess.mockRejectedValueOnce(new ModelNotReleasedError(givenModelId));

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect a 400 response with the MODEL_NOT_RELEASED error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Enums.Response.Status400.ErrorCodes.MODEL_NOT_RELEASED
    );
  });

  test("should respond with CONFLICT when an embedding process is already running", async () => {
    // GIVEN a valid event
    const givenEvent = getEvent({});
    // AND the service throws an EmbeddingProcessAlreadyRunningError
    mockTriggerEmbeddingProcess.mockRejectedValueOnce(new EmbeddingProcessAlreadyRunningError(givenModelId));

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect a 409 response with the EMBEDDING_PROCESS_ALREADY_RUNNING error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Enums.Response.Status409.ErrorCodes
        .EMBEDDING_PROCESS_ALREADY_RUNNING
    );
  });

  test("should respond with INTERNAL_SERVER_ERROR when the service fails unexpectedly", async () => {
    // GIVEN a valid event
    const givenEvent = getEvent({});
    // AND the service throws an unexpected error
    mockTriggerEmbeddingProcess.mockRejectedValueOnce(new Error("unexpected"));

    // WHEN the handler is invoked with the given event
    const actualResponse = await new POSTModelEmbeddingProcessesHandler().handle(givenEvent);

    // THEN expect a 500 response with the FAILED_TO_TRIGGER_EMBEDDING_PROCESS error code
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(JSON.parse(actualResponse.body).errorCode).toEqual(
      ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.POST.Enums.Response.Status500.ErrorCodes
        .FAILED_TO_TRIGGER_EMBEDDING_PROCESS
    );
  });
});
