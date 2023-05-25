// mute console.log during test
import "_test_utilities/consoleMock";

import {lambda_invokeAsyncImport} from "./asyncImport";
import {ImportFileTypes, ImportRequest, ImportResponseErrorCodes} from "api-specifications/import";
import {StatusCodes} from "server/httpUtils";
import {getAsyncLambdaFunctionArn} from "server/config/config";

import {LambdaClient, InvokeCommand, InvokeCommandInput} from "@aws-sdk/client-lambda";

jest.mock("@aws-sdk/client-lambda", () => {
  return {
    LambdaClient: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn().mockResolvedValue({})
      };
    }),
    InvokeCommand: jest.fn()
  };
});


import * as config from "../server/config/config";
import {IErrorResponse} from "api-specifications/error";

describe("Test lambda_invokeAsyncImport()  ", () => {
  test("lambda_invokeAsyncImport() should return ACCEPTED", async () => {
    // GIVEN an ImportRequest
    const givenRequest: ImportRequest = {
      urls: {
        [ImportFileTypes.ESCO_SKILL_GROUP]: "https://example.com/ESCO_SKILL_GROUP.csv",
        [ImportFileTypes.ESCO_SKILL]: "https://example.com/ESCO_SKILL.csv",
      },
      modelId: "foo"
    }
    // AND a mock for Lambda.invokeAsync which successfully schedules the call
    // AND some lambda function arn
    const givenConfigAsyncLambdaFunctionArn = "arn:aws:lambda:foo:bar:baz";
    jest.spyOn(config, "getAsyncLambdaFunctionArn").mockReturnValue(givenConfigAsyncLambdaFunctionArn);

    // AND a some lambda function region
    const givenConfigAsyncLambdaFunctionRegion = "foo";
    jest.spyOn(config, "getAsyncLambdaFunctionRegion").mockReturnValue(givenConfigAsyncLambdaFunctionRegion);

    // WHEN calling lambda_invokeAsyncImport() with the given ImportRequest
    const actualResponse = await lambda_invokeAsyncImport(givenRequest);

    // THEN lambda_invokeAsyncImport() should return actualResponse
    expect(actualResponse).toBeDefined();

    // AND actualResponse status code should be 202
    expect(actualResponse.statusCode).toEqual(StatusCodes.ACCEPTED);

    // AND LambdaClient should be called with the given region
    expect(LambdaClient).toHaveBeenCalledWith({region: givenConfigAsyncLambdaFunctionRegion});

    // AND InvokeCommand should be called with
    expect(InvokeCommand).toHaveBeenCalledWith(
      {
        // The given name of the Lambda function
        FunctionName: givenConfigAsyncLambdaFunctionArn,
        // The invocation type is event for asynchronous execution
        InvocationType: "Event",
        // The payload is a Uint8Array of the string representation of the givenImportRequest
        Payload: new TextEncoder().encode(JSON.stringify(givenRequest))
      }
    );
  });

  test("lambda_invokeAsyncImport() should return INTERNAL_SERVER_ERROR if InvokeCommand throws an error", async () => {
    // GIVEN an ImportRequest
    const request: ImportRequest = {
      urls: {
        [ImportFileTypes.ESCO_SKILL_GROUP]: "https://example.com/ESCO_SKILL_GROUP.csv",
        [ImportFileTypes.ESCO_SKILL]: "https://example.com/ESCO_SKILL.csv",
      },
      modelId: "foo"
    }
    // AND a mock for InvokeCommand which will fail to schedule the call
    // @ts-ignore
    InvokeCommand.mockImplementationOnce(() => {
      throw new Error("Failed to schedule import");
    });

    // AND some lambda function arn
    const givenConfigAsyncLambdaFunctionArn = "arn:aws:lambda:foo:bar:baz";
    jest.spyOn(config, "getAsyncLambdaFunctionArn").mockReturnValue(givenConfigAsyncLambdaFunctionArn);

    // AND a some lambda function region
    const givenConfigAsyncLambdaFunctionRegion = "foo";
    jest.spyOn(config, "getAsyncLambdaFunctionRegion").mockReturnValue(givenConfigAsyncLambdaFunctionRegion);


    // WHEN calling lambda_invokeAsyncImport() with the given ImportRequest
    const actualResponse = await lambda_invokeAsyncImport(request);

    // THEN lambda_invokeAsyncImport() should return actualResponse
    expect(actualResponse).toBeDefined();

    // AND actualResponse status code should be 500
    expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
    const expectedErrorBody: IErrorResponse = {
      "errorCode": ImportResponseErrorCodes.FAILED_TO_TRIGGER_IMPORT,
      "message": "Failed to trigger import",
      "details": "",
    }
    expect(JSON.parse(actualResponse.body)).toMatchObject(expectedErrorBody);
  });
});