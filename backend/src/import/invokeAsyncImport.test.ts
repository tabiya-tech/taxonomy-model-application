// mute console.log during test
import "_test_utilities/consoleMock";

import { lambda_invokeAsyncImport } from "./invokeAsyncImport";
import ImportAPISpecs from "api-specifications/import";
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

jest.mock("import/removeGeneratedUUID/removeGeneratedUUID", () => {
  return {
    removeGeneratedUUIDs: jest.fn(),
  };
});

describe("Test lambda_invokeAsyncImport()  ", () => {
  test("should return the ACCEPTED status", async () => {
    // GIVEN an Import
    const givenImport: ImportAPISpecs.Types.POST.Request.Payload = {
      filePaths: {
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_GROUPS]: "path/to/ESCO_SKILL_GROUP.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS]: "path/to//ESCO_SKILL.csv",
      },
      modelId: "foo",
      isOriginalESCOModel: false,
    };
    // AND some lambda function arn will be return by the  configuration
    const givenConfigAsyncLambdaFunctionArn = "arn:aws:lambda:foo:bar:baz";
    jest.spyOn(config, "getAsyncImportLambdaFunctionArn").mockReturnValue(givenConfigAsyncLambdaFunctionArn);
    // AND some lambda function region will be return by the  configuration
    const givenConfigAsyncLambdaFunctionRegion = "foo";
    jest.spyOn(config, "getAsyncLambdaFunctionRegion").mockReturnValue(givenConfigAsyncLambdaFunctionRegion);

    // WHEN calling the lambda_invokeAsyncImport() function with the given Import
    const actualResponse = await lambda_invokeAsyncImport(givenImport);

    // THEN expect the function to return a response
    expect(actualResponse).toBeDefined();
    // AND the actualResponse status code to be ACCEPTED
    expect(actualResponse.statusCode).toEqual(StatusCodes.ACCEPTED);
    // AND the LambdaClient to have been called with the given region from the configuration
    expect(LambdaClient).toHaveBeenCalledWith({
      region: givenConfigAsyncLambdaFunctionRegion,
    });
    // AND InvokeCommand to have been called with
    expect(InvokeCommand).toHaveBeenCalledWith({
      // The Lambda function arn from the configuration
      FunctionName: givenConfigAsyncLambdaFunctionArn,
      // The invocation type to be event for asynchronous execution
      InvocationType: "Event",
      // The payload is a Uint8Array of the string representation of the givenImport
      Payload: new TextEncoder().encode(JSON.stringify(givenImport)),
    });
  });

  test("should return the INTERNAL_SERVER_ERROR status if InvokeCommand throws an error", async () => {
    // GIVEN an Import
    const givenImport: ImportAPISpecs.Types.POST.Request.Payload = {
      filePaths: {
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_GROUPS]: "path/toESCO_SKILL_GROUP.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS]: "path/to/ESCO_SKILL.csv",
      },
      modelId: "foo",
      isOriginalESCOModel: false,
    };
    // AND some lambda function arn will be return by the  configuration
    const givenConfigAsyncLambdaFunctionArn = "arn:aws:lambda:foo:bar:baz";
    jest.spyOn(config, "getAsyncImportLambdaFunctionArn").mockReturnValue(givenConfigAsyncLambdaFunctionArn);
    // AND some lambda function region will be return by the  configuration
    const givenConfigAsyncLambdaFunctionRegion = "foo";
    jest.spyOn(config, "getAsyncLambdaFunctionRegion").mockReturnValue(givenConfigAsyncLambdaFunctionRegion);
    // AND the InvokeCommand will fail to schedule the call
    // @ts-ignore
    InvokeCommand.mockImplementationOnce(() => {
      throw new Error("Failed to schedule import");
    });

    // WHEN calling the lambda_invokeAsyncImport() function with the given Import
    const actualResponse = await lambda_invokeAsyncImport(givenImport);

    // THEN expect the function to return a response
    expect(actualResponse).toBeDefined();
    // AND the actualResponse status code to be INTERNAL_SERVER_ERROR
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    // AND the actualResponse body to have the error information
    const expectedErrorBody: ErrorAPISpecs.Types.Payload = {
      errorCode: ImportAPISpecs.Enums.POST.Response.ImportResponseErrorCodes.FAILED_TO_TRIGGER_IMPORT,
      message: "Failed to trigger import",
      details: "",
    };
    expect(JSON.parse(actualResponse.body)).toMatchObject(expectedErrorBody);
  });
});
