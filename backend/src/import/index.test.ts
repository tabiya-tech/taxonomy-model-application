import * as ImportHandler from "./index";
import { HTTP_VERBS, response, StatusCodes } from "server/httpUtils";
import * as AsyncImport from "./asyncImport";
import ImportAPISpecs from "api-specifications/import";

import { getMockStringId } from "_test_utilities/mockMongoId";
import { APIGatewayProxyEvent } from "aws-lambda";
import {
  testMethodsNotAllowed,
  testRequestJSONMalformed,
  testRequestJSONSchema,
  testTooLargePayload,
  testUnsupportedMediaType,
} from "_test_utilities/stdRESTHandlerTests";
import { getTestString } from "_test_utilities/specialCharacters";

describe("test for trigger ImportHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ["some of the file paths", { [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL]: "path/to/file" }],
    [
      "max payload size",
      Object.values(ImportAPISpecs.Constants.ImportFileTypes).reduce((accumulated, current) => {
        // @ts-ignore
        accumulated[current] = getTestString(ImportAPISpecs.Constants.FILEPATH_MAX_LENGTH);
        return accumulated;
      }, {}),
    ],
  ])(
    "POST should respond with the response from the lambda_invokeAsyncImport() for %s",
    async (description, givenFilePaths) => {
      // GIVEN a correct payload & event with 'Content-Type: application/json; charset=utf-8'
      const givenPayload: ImportAPISpecs.Types.POST.Request.Payload = {
        modelId: getMockStringId(2),
        filePaths: givenFilePaths,
      };
      expect(Object.keys(givenPayload.filePaths).length).toBeGreaterThanOrEqual(1);

      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      } as any;
      // AND the lambda_invokeAsyncImport function will successfully handle the event and return a response
      const givenResponse = response(StatusCodes.ACCEPTED, {});
      const givenLambdaInvokeAsyncImportSpy = jest
        .spyOn(AsyncImport, "lambda_invokeAsyncImport")
        .mockResolvedValueOnce(givenResponse);

      // WHEN the handler is invoked with the given event
      const actualResponse = await ImportHandler.handler(givenEvent);

      // THEN expect lambda_invokeAsyncImport function to be called with the given payload
      expect(givenLambdaInvokeAsyncImportSpy).toBeCalledWith(givenPayload);
      // AND the handler to return the response from the lambda_invokeAsyncImport function
      expect(actualResponse).toEqual(givenResponse);
    }
  );

  testMethodsNotAllowed(
    [HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH, HTTP_VERBS.GET],
    ImportHandler.handler
  );

  testRequestJSONMalformed(ImportHandler.handler);

  testRequestJSONSchema(ImportHandler.handler);

  testUnsupportedMediaType(ImportHandler.handler);

  testTooLargePayload(HTTP_VERBS.POST, ImportAPISpecs.Constants.MAX_PAYLOAD_LENGTH, ImportHandler.handler);
});
