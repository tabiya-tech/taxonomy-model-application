import APIError from "./index";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import ErrorConstants from "./constants";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { RegExp_Str_NotEmptyString } from "regex";
import { WHITESPACE } from "_test_utilities/specialCharacters";
import ImportAPI from "import";
import ExportAPI from "export";
import ModelInfoAPI from "modelInfo";
import OccupationGroupAPI from "esco/occupationGroup";
import OccupationAPI from "esco/occupation";

describe("Test the Error Schema", () => {
  // GIVEN the APIError.Schemas.Payload schema

  // WHEN the schema is validated

  // THEN expect the schema to be valid
  testValidSchema("APIError.Schemas.Payload", APIError.Schemas.Payload);
});

describe("Validate JSON against the APIError Schema", () => {
  // GIVEN a valid APIError object
  const givenValidAPIError: APIError.Types.Payload = {
    details: "Foo",
    errorCode: APIError.Constants.ErrorCodes.INTERNAL_SERVER_ERROR,
    message: "Bar",
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject("APIError.Schemas.Payload", APIError.Schemas.Payload, givenValidAPIError);

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties("APIError.Schemas.Payload", APIError.Schemas.Payload, givenValidAPIError);

  describe("Validate APIError.Schemas.Payload fields", () => {
    describe("Test validate of 'errorCode'", () => {
      const allValidErrorCodes = [
        ...Object.values(ErrorConstants.ErrorCodes),
        ...Object.values(ImportAPI.Enums.ImportResponseErrorCodes),
        ...Object.values(ExportAPI.Enums.POST.Response.ExportResponseErrorCodes),
        ...Object.values(ModelInfoAPI.Enums.POST.Response.ErrorCodes),
        ...Object.values(OccupationGroupAPI.Enums.POST.Response.ErrorCodes),
        ...Object.values(OccupationGroupAPI.Enums.GET.Response.ErrorCodes),
        ...Object.values(OccupationAPI.Enums.POST.Response.ErrorCodes),
        ...Object.values(OccupationAPI.Enums.GET.Response.ErrorCodes),
      ];

      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'errorCode'"),
        ],
        [
          CaseType.Failure,
          "null",
          null,
          [
            constructSchemaError(`/errorCode`, "type", "must be string"),
            constructSchemaError("/errorCode", "enum", "must be equal to one of the allowed values"),
          ],
        ],
        [
          CaseType.Failure,
          "empty",
          "",
          constructSchemaError(`/errorCode`, "pattern", `must match pattern "${RegExp_Str_NotEmptyString}"`),
        ],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          [constructSchemaError("/errorCode", "pattern", `must match pattern "${RegExp_Str_NotEmptyString}"`)],
        ],
        [
          CaseType.Failure,
          "not in enum",
          "INVALID_ERROR_CODE",
          constructSchemaError(`/errorCode`, "enum", `must be equal to one of the allowed values`),
        ],
        ...allValidErrorCodes.map((errorCode) => [CaseType.Success, errorCode, errorCode, undefined]),
        //@ts-ignore
      ])("(%s) Validate errorCode when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: APIError.Types.Payload = {
          //@ts-ignore
          errorCode: givenValue,
        };
        // THEN expect the object to validate accordingly
        //@ts-ignore
        assertCaseForProperty("errorCode", givenObject, APIError.Schemas.Payload, caseType, failureMessages);
      });
    });

    describe("Test validate of 'message'", () => {
      testStringField<APIError.Types.Payload>("message", ErrorConstants.MAX_MESSAGE_LENGTH, APIError.Schemas.Payload);
    });

    describe("Test validate of 'details'", () => {
      testStringField<APIError.Types.Payload>("details", ErrorConstants.MAX_DETAILS_LENGTH, APIError.Schemas.Payload);
    });
  });
});
