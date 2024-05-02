// mute the console
import "_test_utilities/consoleMock";

import {
  testMethodsNotAllowed,
  testRequestJSONMalformed,
  testRequestJSONSchema,
  testTooLargePayload,
  testUnsupportedMediaType,
} from "_test_utilities/stdRESTHandlerTests";
import { HTTP_VERBS, response, StatusCodes } from "server/httpUtils";
import * as ExportHandler from "./index";
import ExportAPISpecs from "api-specifications/export";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import ErrorAPISpecs from "api-specifications/error";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import * as InvokeAsyncExport from "./invokeAsyncExport";
import { getModelInfoMockDataArray } from "modelInfo/testDataHelper";
import { AsyncExportEvent } from "./async/async.types";
import { IExportProcessState, INewExportProcessStateSpec } from "./exportProcessState/exportProcessState.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import AuthAPISpecs from "api-specifications/auth";

const getMockExportProcessState = (id: string): IExportProcessState => ({
  createdAt: new Date(),
  downloadUrl: "",
  id: id,
  modelId: "",
  result: { errored: false, exportErrors: false, exportWarnings: false },
  status: ExportProcessStateAPISpecs.Enums.Status.PENDING,
  timestamp: new Date(),
  updatedAt: new Date(),
});

describe("test for trigger ExportHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Security Tests", () => {
    test("should respond with FORBIDDEN status code if a user is not a model manager", async () => {
      // GIVEN a correct payload
      const givenPayload: ExportAPISpecs.Types.POST.Request.Payload = {
        modelId: getMockStringId(2),
      };

      // AND The user is a registered user (not a model manager)
      const givenRequestContext = usersRequestContext.REGISTED_USER;

      // AND the event with the given payload with 'Content-Type: application/json; charset=utf-8'
      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        requestContext: givenRequestContext,
      } as never;

      // WHEN the handler is invoked with the given event
      const actualResponse = await ExportHandler.handler(givenEvent);

      // THEN expect the handler to respond with the FORBIDDEN status
      expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });
  });

  test("should respond with the response of the invokeAsyncExport when the user is a model manager", async () => {
    // GIVEN a correct payload
    const givenPayload: ExportAPISpecs.Types.POST.Request.Payload = {
      modelId: getMockStringId(2),
    };

    // AND The user is a model manager
    const givenRequestContext = usersRequestContext.MODEL_MANAGER;

    // AND the event with the given payload with 'Content-Type: application/json; charset=utf-8'
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      requestContext: givenRequestContext,
    } as never;

    // AND the exportProcessStatRepository that will successfully create the exportProcessState
    const givenExportProcessStateId = getMockStringId(1);
    const givenExportProcessStateRepositoryMock = {
      Model: undefined as never,
      create: jest.fn().mockImplementation((newSpecs: INewExportProcessStateSpec): Promise<IExportProcessState> => {
        console.log("create called", newSpecs);
        return Promise.resolve(getMockExportProcessState(givenExportProcessStateId));
      }),
      update: jest.fn().mockResolvedValue({}),
      findById: jest.fn().mockResolvedValue({}),
    };
    jest
      .spyOn(getRepositoryRegistry(), "exportProcessState", "get")
      .mockReturnValue(givenExportProcessStateRepositoryMock);

    // AND the modelInfo repository that will successfully find the model
    const givenModelInfoRepositoryMock = {
      Model: undefined as never,
      create: jest.fn(),
      getModelById: jest.fn().mockResolvedValueOnce(getModelInfoMockDataArray(1)[0]),
      getModelByUUID: jest.fn(),
      getModels: jest.fn(),
      getHistory: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // AND the lambda_invokeAsyncExport function will successfully handle the event and return a response
    const givenLambdaInvokeAsyncExportResponse = response(StatusCodes.ACCEPTED, {});
    const givenLambdaInvokeAsyncExportSpy = jest
      .spyOn(InvokeAsyncExport, "lambda_invokeAsyncExport")
      .mockResolvedValueOnce(givenLambdaInvokeAsyncExportResponse);

    // WHEN the handler is invoked with the given event
    const actualResponse = await ExportHandler.handler(givenEvent);

    // THEN expect the handler to create the exportProcessState with status PENDING
    expect(getRepositoryRegistry().exportProcessState.create).toHaveBeenCalledWith({
      modelId: givenPayload.modelId,
      status: ExportProcessStateAPISpecs.Enums.Status.PENDING,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: "",
      timestamp: expect.any(Date),
    });
    // AND expect the handler to call the lambda_invokeAsyncExport with the given modelId and the exportProcessStateId
    const expectedAsyncExportEvent: AsyncExportEvent = {
      modelId: givenPayload.modelId,
      exportProcessStateId: givenExportProcessStateId,
    };
    expect(givenLambdaInvokeAsyncExportSpy).toBeCalledWith(expectedAsyncExportEvent);

    // AND export the handler to respond with the response from the lambda_invokeAsyncExport function
    expect(actualResponse).toEqual(givenLambdaInvokeAsyncExportResponse);
  });

  test("should respond with NOT_FOUND status code if the model does not exist", async () => {
    // GIVEN a correct payload & event with 'Content-Type: application/json; charset=utf-8'
    const givenPayload: ExportAPISpecs.Types.POST.Request.Payload = {
      modelId: getMockStringId(2),
    };

    // AND The user is a model manager
    const givenRequestContext = usersRequestContext.MODEL_MANAGER;

    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      requestContext: givenRequestContext,
    } as never;
    // AND the modelInfo repository will resolve with null
    const givenModelInfoRepositoryMock = {
      Model: undefined as never,
      create: jest.fn(),
      getModelById: jest.fn().mockResolvedValueOnce(null),
      getModelByUUID: jest.fn(),
      getModels: jest.fn(),
      getHistory: jest.fn().mockResolvedValue(null),
    };
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

    // WHEN the handler is invoked with the given event
    const actualResponse = await ExportHandler.handler(givenEvent);

    // THEN expect the handler to call the repository with the given payload
    expect(getRepositoryRegistry().modelInfo.getModelById).toHaveBeenCalledWith(givenPayload.modelId);
    // AND to respond with the NOT_FOUND status
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: ExportAPISpecs.Enums.POST.Response.ExportResponseErrorCodes.FAILED_TO_TRIGGER_EXPORT,
      message: "Failed to trigger the export process",
      details: "Model could not be found",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
  });

  test("should respond with INTERNAL_SERVER_ERROR status code if the exportProcessState repository throws an error", async () => {
    // GIVEN a correct payload & event with 'Content-Type: application/json; charset=utf-8'
    const givenPayload: ExportAPISpecs.Types.POST.Request.Payload = {
      modelId: getMockStringId(2),
    };

    // AND The user is a model manager
    const givenRequestContext = usersRequestContext.MODEL_MANAGER;

    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      requestContext: givenRequestContext,
    } as never;
    // AND the model exists in the db
    const givenModelInfoRepositoryMock = {
      Model: undefined as never,
      create: jest.fn(),
      getModelById: jest.fn().mockResolvedValueOnce(getModelInfoMockDataArray(1)),
      getModelByUUID: jest.fn(),
      getModels: jest.fn(),
      getHistory: jest.fn().mockResolvedValue(null),
    };
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);
    // AND the exportProcessState repository will throw an error
    const givenError = new Error("Failed to create the export process state");
    const givenExportProcessStateRepositoryMock = {
      Model: undefined as never,
      create: jest.fn().mockRejectedValue(givenError),
      update: jest.fn(),
      findById: jest.fn(),
    };
    jest
      .spyOn(getRepositoryRegistry(), "exportProcessState", "get")
      .mockReturnValue(givenExportProcessStateRepositoryMock);

    // WHEN the handler is invoked with the given event
    const actualResponse = await ExportHandler.handler(givenEvent);

    // THEN expect the handler to call the repository
    expect(getRepositoryRegistry().exportProcessState.create).toHaveBeenCalled();
    // AND to respond with the INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: ExportAPISpecs.Enums.POST.Response.ExportResponseErrorCodes.FAILED_TO_TRIGGER_EXPORT,
      message: "Failed to trigger the export process",
      details: "Could not create the exportProcess State in the database",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    // AND the error to be logged
    const expectedErrorMessage = "Failed to create the export process state";
    expect(console.error).toHaveBeenCalledWith(expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message));
  });

  testMethodsNotAllowed(
    [HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH, HTTP_VERBS.GET],
    ExportHandler.handler
  );

  testRequestJSONMalformed(ExportHandler.handler, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

  testRequestJSONSchema(ExportHandler.handler, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

  testUnsupportedMediaType(ExportHandler.handler, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

  testTooLargePayload(
    HTTP_VERBS.POST,
    ExportAPISpecs.Constants.MAX_PAYLOAD_LENGTH,
    ExportHandler.handler,
    AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER
  );
});
