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
import ModelInfoAPI from "../modelInfo";
import OccupationGroupAPI from "../esco/occupationGroup";
import OccupationAPI from "../esco/occupation";
import SkillGroupAPI from "../esco/skillGroup";
describe("Test the Error Schema", () => {
  // GIVEN the APIError.Schemas.GET.Payload schema

  // WHEN the schema is validated

  // THEN expect the schema to be valid
  testValidSchema("APIError.Schemas.GET.Payload", APIError.Schemas.GET.Payload);
});

describe("Validate JSON against the APIError GET Schema", () => {
  // GIVEN a valid APIError GET object
  const givenValidAPIError: APIError.Types.GET = {
    errorCode: APIError.Constants.Common.ErrorCodes.INTERNAL_SERVER_ERROR,
    details: "Foo",
    message: "Bar",
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject("APIError.Schemas.GET.Payload", APIError.Schemas.GET.Payload, givenValidAPIError);

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties("APIError.Schemas.GET.Payload", APIError.Schemas.GET.Payload, givenValidAPIError);

  describe("Validate APIError.Schemas.Payload fields", () => {
    describe("Test validate of 'errorCode'", () => {
      const allValidErrorCodes = [
        ...Object.values(ErrorConstants.Common.ErrorCodes),
        ...Object.values(ErrorConstants.GET.ErrorCodes),
        ...Object.values(ModelInfoAPI.Enums.GET.Response.ErrorCodes),
        ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status400.ErrorCodes),
        ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status404.ErrorCodes),
        ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status500.ErrorCodes),
        ...Object.values(OccupationAPI.Enums.GET.Response.ErrorCodes),
        ...Object.values(SkillGroupAPI.Enums.GET.Response.Status400.ErrorCodes),
        ...Object.values(SkillGroupAPI.Enums.GET.Response.Status404.ErrorCodes),
        ...Object.values(SkillGroupAPI.Enums.GET.Response.Status500.ErrorCodes),
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
        const givenObject: APIError.Types.GET = {
          //@ts-ignore
          errorCode: givenValue,
        };
        // THEN expect the object to validate accordingly
        //@ts-ignore
        assertCaseForProperty("errorCode", givenObject, APIError.Schemas.GET.Payload, caseType, failureMessages);
      });
    });

    describe("Test validate of 'message'", () => {
      testStringField<APIError.Types.GET>("message", ErrorConstants.MAX_MESSAGE_LENGTH, APIError.Schemas.GET.Payload);
    });

    describe("Test validate of 'details'", () => {
      testStringField<APIError.Types.GET>("details", ErrorConstants.MAX_DETAILS_LENGTH, APIError.Schemas.GET.Payload);
    });
  });
});
