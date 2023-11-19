// mute console.log during test
import "_test_utilities/consoleMock";

import { lambda_invokeAsyncExport } from "./invokeAsyncExport";
import ExportAPISpecs from "api-specifications/export";
import { StatusCodes } from "server/httpUtils";
import * as config from "server/config/config";
import ErrorAPISpecs from "api-specifications/error";

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

jest.mock("@aws-sdk/client-lambda", () => {
  return {
    LambdaClient: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn().mockResolvedValue({}),
      };
    }),
    InvokeCommand: jest.fn(),
  };
});

describe("Test lambda_invokeAsyncExport()  ", () => {

  test("should return the ACCEPTED status", async () => {
    // GIVEN an Export
    const givenExport: ExportAPISpecs.Types.POST.Request.Payload = {
      modelId: "foo",
    };
    // AND an export process State id
    const givenExportProcessStateId = "bar";
    // AND some lambda function arn will be return by the  configuration
    const givenConfigAsyncLambdaFunctionArn = "arn:aws:lambda:foo:bar:baz";
    jest.spyOn(config, "getAsyncExportLambdaFunctionArn").mockReturnValue(givenConfigAsyncLambdaFunctionArn);
    // AND some lambda function region will be return by the  configuration
    const givenConfigAsyncLambdaFunctionRegion = "foo";
    jest.spyOn(config, "getAsyncLambdaFunctionRegion").mockReturnValue(givenConfigAsyncLambdaFunctionRegion);

    // WHEN calling the lambda_invokeAsyncExport() function with the given Export
    const actualResponse = await lambda_invokeAsyncExport(givenExport, givenExportProcessStateId);

    // THEN expect the function to return a response
    expect(actualResponse).toBeDefined();
    // AND the actualResponse status code to be ACCEPTED
    expect(actualResponse.statusCode).toEqual(StatusCodes.ACCEPTED);
    // AND the LambdaClient to have been called with the given region from the configuration
    expect(LambdaClient).toHaveBeenCalledWith({
      region: givenConfigAsyncLambdaFunctionRegion,
    });
    // AND InvokeCommand to have been called with the expected object
    const expectedInvokeCommandProps = {
      ...givenExport,
      exportProcessStateId: givenExportProcessStateId,
    };
    expect(InvokeCommand).toHaveBeenCalledWith({
      // The Lambda function arn from the configuration
      FunctionName: givenConfigAsyncLambdaFunctionArn,
      // The invocation type to be event for asynchronous execution
      InvocationType: "Event",
      // The payload is a Uint8Array of the string representation of the givenExport
      Payload: new TextEncoder().encode(JSON.stringify(expectedInvokeCommandProps)),
    });
  });

  test("should return the INTERNAL_SERVER_ERROR status if InvokeCommand throws an error", async () => {
    // GIVEN an Export
    const givenExport: ExportAPISpecs.Types.POST.Request.Payload = {
      modelId: "foo",
    };
    // AND an export process State id
    const givenExportProcessStateId = "bar";
    // AND some lambda function arn will be return by the  configuration
    const givenConfigAsyncLambdaFunctionArn = "arn:aws:lambda:foo:bar:baz";
    jest.spyOn(config, "getAsyncExportLambdaFunctionArn").mockReturnValue(givenConfigAsyncLambdaFunctionArn);
    // AND some lambda function region will be return by the  configuration
    const givenConfigAsyncLambdaFunctionRegion = "foo";
    jest.spyOn(config, "getAsyncLambdaFunctionRegion").mockReturnValue(givenConfigAsyncLambdaFunctionRegion);
    // AND the InvokeCommand will fail to schedule the call
    // @ts-ignore
    InvokeCommand.mockImplementationOnce(() => {
      throw new Error("Failed to schedule export");
    });

    // WHEN calling the lambda_invokeAsyncExport() function with the given Export
    const actualResponse = await lambda_invokeAsyncExport(givenExport, givenExportProcessStateId);

    // THEN expect the function to return a response
    expect(actualResponse).toBeDefined();
    // AND the actualResponse status code to be INTERNAL_SERVER_ERROR
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    // AND the actualResponse body to have the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: ExportAPISpecs.Enums.POST.Response.ExportResponseErrorCodes.FAILED_TO_TRIGGER_EXPORT,
      message: "Failed to trigger export",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toMatchObject(expectedErrorBody);
  });
});
