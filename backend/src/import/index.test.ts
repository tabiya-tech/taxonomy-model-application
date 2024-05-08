//silence chatty console
import "_test_utilities/consoleMock";
import * as ImportHandler from "./index";
import { HTTP_VERBS, response, StatusCodes } from "server/httpUtils";
import * as AsyncImport from "./invokeAsyncImport";
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
import AuthAPISpecs from "api-specifications/auth";

jest.mock("import/removeGeneratedUUID/removeGeneratedUUID", () => {
  return {
    removeGeneratedUUIDs: jest.fn(),
  };
});

jest.mock("auth/authenticator", () => {
  return {
    checkRole: jest.fn().mockImplementation(() => true),
    RoleRequired: jest.fn().mockImplementation(() => {
      return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
        return descriptor;
      };
    }),
  };
});

describe("test for trigger ImportHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ["some of the file paths", { [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS]: "path/to/file" }],
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
        isOriginalESCOModel: false,
      };
      expect(Object.keys(givenPayload.filePaths).length).toBeGreaterThanOrEqual(1);

      const givenEvent: APIGatewayProxyEvent = {
        httpMethod: HTTP_VERBS.POST,
        body: JSON.stringify(givenPayload),
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        requestContext: {
          authorizer: {
            claims: {
              user: JSON.stringify({
                "cognito:groups": AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER,
              }),
            },
          },
        },
      } as never;
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

  testRequestJSONMalformed(ImportHandler.handler, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

  testRequestJSONSchema(ImportHandler.handler, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

  testUnsupportedMediaType(ImportHandler.handler, AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER);

  testTooLargePayload(
    HTTP_VERBS.POST,
    ImportAPISpecs.Constants.MAX_PAYLOAD_LENGTH,
    ImportHandler.handler,
    AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER
  );
});
