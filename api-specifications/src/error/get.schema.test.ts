import APIError from "./index";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { RegExp_Str_NotEmptyString } from "regex";
import { WHITESPACE } from "_test_utilities/specialCharacters";
import OccupationGroupAPI from "esco/occupationGroup";
import OccupationAPI from "esco/occupation";
import ModelInfoAPI from "modelInfo";
import ExportAPI from "export";
import ImportAPI from "import";
import SkillsAPI from "esco/skill";
import SkillGroupAPI from "esco/skillGroup";

describe("Test the GetErrorSchema function", () => {
  // GIVEN the APIError.GetErrorSchema function
  // WHEN the function is validated
  // THEN expect the function to return a valid schema object
  test("APIError.GetErrorSchema returns a valid schema object", () => {
    const schema = APIError.Schemas.getPayload("POST", "TestSchema", 500, [
      ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status400.ErrorCodes),
    ]);
    expect(schema).toBeDefined();
    expect(schema.type).toBe("object");
    expect(schema.properties).toBeDefined();
    expect(schema.required).toEqual(["errorCode", "message", "details"]);
  });

  const allValidErrorCodes = Array.from(
    new Set([
      ...Object.values(APIError.Constants.ErrorCodes),
      ...Object.values(ImportAPI.Enums.ImportResponseErrorCodes),
      ...Object.values(ExportAPI.Enums.POST.Response.ExportResponseErrorCodes),
      ...Object.values(ModelInfoAPI.Enums.POST.Response.ErrorCodes),
      ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status400.ErrorCodes),
      ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status404.ErrorCodes),
      ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status500.ErrorCodes),
      ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status400.ErrorCodes),
      ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status404.ErrorCodes),
      ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status500.ErrorCodes),
      ...Object.values(OccupationAPI.Enums.POST.Response.Status400.ErrorCodes),
      ...Object.values(OccupationAPI.Enums.POST.Response.Status404.ErrorCodes),
      ...Object.values(OccupationAPI.Enums.POST.Response.Status500.ErrorCodes),
      ...Object.values(OccupationAPI.Enums.GET.Response.Status400.ErrorCodes),
      ...Object.values(OccupationAPI.Enums.GET.Response.Status404.ErrorCodes),
      ...Object.values(OccupationAPI.Enums.GET.Response.Status500.ErrorCodes),
      ...Object.values(SkillGroupAPI.Enums.POST.Response.Status400.ErrorCodes),
      ...Object.values(SkillGroupAPI.Enums.POST.Response.Status404.ErrorCodes),
      ...Object.values(SkillGroupAPI.Enums.POST.Response.Status500.ErrorCodes),
      ...Object.values(SkillGroupAPI.Enums.GET.Response.Status400.ErrorCodes),
      ...Object.values(SkillGroupAPI.Enums.GET.Response.Status404.ErrorCodes),
      ...Object.values(SkillGroupAPI.Enums.GET.Response.Status500.ErrorCodes),
      ...Object.values(SkillsAPI.Enums.POST.Response.Status400.ErrorCodes),
      ...Object.values(SkillsAPI.Enums.POST.Response.Status404.ErrorCodes),
      ...Object.values(SkillsAPI.Enums.POST.Response.Status500.ErrorCodes),
      ...Object.values(SkillsAPI.Enums.GET.Response.Status400.ErrorCodes),
      ...Object.values(SkillsAPI.Enums.GET.Response.Status404.ErrorCodes),
      ...Object.values(SkillsAPI.Enums.GET.Response.Status500.ErrorCodes),
    ])
  );
  testValidSchema(
    "APIError.GetErrorSchema",
    APIError.Schemas.getPayload("POST", "TestSchema", 500, allValidErrorCodes)
  );
});

describe("Validate JSON against the APIError GetErrorSchema function", () => {
  // GIVEN a valid APIError object
  const errorCodes = Object.values(APIError.Constants.Common.ErrorCodes);
  const schema = APIError.Schemas.getPayload("POST", "TestSchema", 500, errorCodes);
  const validPayload: APIError.Types.GetPayload = {
    errorCode: errorCodes[0],
    message: "Test message",
    details: "Test details",
  };
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject("APIError.Schemas.GetErrorSchema", schema, validPayload);

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties("APIError.Schemas.GetErrorSchema", schema, validPayload);

  describe("validate APIError.Schema.GetErrorSchema fields", () => {
    describe("Test validate of 'errorCode'", () => {
      const allValidErrorCodes = Array.from(
        new Set([
          ...Object.values(APIError.Constants.ErrorCodes),
          ...Object.values(ImportAPI.Enums.ImportResponseErrorCodes),
          ...Object.values(ExportAPI.Enums.POST.Response.ExportResponseErrorCodes),
          ...Object.values(ModelInfoAPI.Enums.POST.Response.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status400.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status404.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.POST.Response.Status500.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status404.ErrorCodes),
          ...Object.values(OccupationGroupAPI.Enums.GET.Response.Status500.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.POST.Response.Status400.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.POST.Response.Status404.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.POST.Response.Status500.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.GET.Response.Status404.ErrorCodes),
          ...Object.values(OccupationAPI.Enums.GET.Response.Status500.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.POST.Response.Status400.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.POST.Response.Status404.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.POST.Response.Status500.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.GET.Response.Status404.ErrorCodes),
          ...Object.values(SkillGroupAPI.Enums.GET.Response.Status500.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.POST.Response.Status400.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.POST.Response.Status404.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.POST.Response.Status500.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.GET.Response.Status400.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.GET.Response.Status404.ErrorCodes),
          ...Object.values(SkillsAPI.Enums.GET.Response.Status500.ErrorCodes),
        ])
      );
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
        const schema = APIError.Schemas.getPayload("POST", "TestSchema", 500, allValidErrorCodes);
        const givenObject: APIError.Types.GetPayload = {
          //@ts-ignore
          errorCode: givenValue,
        };
        // THEN expect the object to validate accordingly
        //@ts-ignore
        assertCaseForProperty("errorCode", givenObject, schema, caseType, failureMessages);
      });
    });
    describe("Test validate of 'message'", () => {
      const schema = APIError.Schemas.getPayload(
        "POST",
        "TestSchema",
        500,
        Object.values(APIError.Constants.Common.ErrorCodes)
      );
      testStringField<typeof schema>("message", APIError.Constants.MAX_MESSAGE_LENGTH, schema);
    });
    describe("Test validate of 'details'", () => {
      const schema = APIError.Schemas.getPayload(
        "POST",
        "TestSchema",
        500,
        Object.values(APIError.Constants.Common.ErrorCodes)
      );
      testStringField<typeof schema>("details", APIError.Constants.MAX_DETAILS_LENGTH, schema);
    });
  });
});
