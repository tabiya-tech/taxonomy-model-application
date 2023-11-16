// mute the console
import "_test_utilities/consoleMock";

import {
  testMethodsNotAllowed,
  testRequestJSONMalformed,
  testRequestJSONSchema,
  testTooLargePayload,
  testUnsupportedMediaType,
} from "_test_utilities/stdRESTHandlerTests";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import * as ExportHandler from "./index";
import ExportAPISpecs from "api-specifications/export";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import ErrorAPISpecs from "api-specifications/error";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";

describe("test for trigger ExportHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should respond with ACCEPTED status code for a valid payload", async () => {
    // GIVEN a correct payload & event with 'Content-Type: application/json; charset=utf-8'
    const givenPayload: ExportAPISpecs.Types.POST.Request.Payload = {
      modelId: getMockStringId(2),
    };
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    } as any;
    // AND the repository will successfully create a new export process state
    const givenExportProcessStateRepositoryMock = {
      Model: undefined as any,
      create: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
    };
    jest
      .spyOn(getRepositoryRegistry(), "exportProcessState", "get")
      .mockReturnValue(givenExportProcessStateRepositoryMock);

    // WHEN the handler is invoked with the given event
    const actualResponse = await ExportHandler.handler(givenEvent);

    // THEN expect the handler to call the repository with the given payload
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
    // AND respond with the CREATED status
    expect(actualResponse.statusCode).toEqual(StatusCodes.ACCEPTED);
    // AND the handler to return the correct headers
    expect(actualResponse.headers).toMatchObject({
      "Content-Type": "application/json",
    });
    // AND the body to be empty
    expect(actualResponse.body).toEqual("");
  });

  test("should respond with INTERNAL_SERVER_ERROR status code if the repository throws an error", async () => {
    // GIVEN a correct payload & event with 'Content-Type: application/json; charset=utf-8'
    const givenPayload: ExportAPISpecs.Types.POST.Request.Payload = {
      modelId: getMockStringId(2),
    };
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.POST,
      body: JSON.stringify(givenPayload),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    } as any;
    // AND the repository will throw an error
    const givenError = new Error("Failed to create the export process state");
    const givenExportProcessStateRepositoryMock = {
      Model: undefined as any,
      create: jest.fn().mockRejectedValue(givenError),
      update: jest.fn(),
    };
    jest
      .spyOn(getRepositoryRegistry(), "exportProcessState", "get")
      .mockReturnValue(givenExportProcessStateRepositoryMock);

    // WHEN the handler is invoked with the given event
    const actualResponse = await ExportHandler.handler(givenEvent);

    // THEN expect the handler to call the repository with the given payload
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
    // AND to respond with the INTERNAL_SERVER_ERROR status
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    // AND the response body contains the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: ExportAPISpecs.Enums.POST.Response.ExportResponseErrorCodes.FAILED_TO_TRIGGER_EXPORT,
      message: "Failed to trigger the export process",
      details: "Could not create the exportProcess State in the database",
    };
    expect(JSON.parse(actualResponse.body)).toEqual(expectedErrorBody);
    // AND the error to be logged to the console
    expect(console.log).toHaveBeenCalledWith(givenError);
  });

  testMethodsNotAllowed(
    [HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH, HTTP_VERBS.GET],
    ExportHandler.handler
  );

  testRequestJSONMalformed(ExportHandler.handler);

  testRequestJSONSchema(ExportHandler.handler);

  testUnsupportedMediaType(ExportHandler.handler);

  testTooLargePayload(HTTP_VERBS.POST, ExportAPISpecs.Constants.MAX_PAYLOAD_LENGTH, ExportHandler.handler);
});
