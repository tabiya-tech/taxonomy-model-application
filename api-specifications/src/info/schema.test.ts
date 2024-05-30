import InfoAPISpecs from "./index";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testTimestampField,
  testURIField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import ModelInfoConstants from "modelInfo/constants";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { WHITESPACE } from "_test_utilities/specialCharacters";
import InfoConstants from "info/constants";

describe("Test the InfoSchema", () => {
  // GIVEN the InfoAPISpecs.Schemas.GET.Response.Payload schema

  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema("Info.Schemas.GET.Response.Payload", InfoAPISpecs.Schemas.GET.Response.Payload);
});

describe("Validate JSON against the Info Schema", () => {
  // GIVEN a valid ModelInfoResponse object
  const givenValidInfoResponse: InfoAPISpecs.Types.GET.Response.Payload = {
    date: "2023-08-22T14:13:32.439Z",
    version: "main",
    buildNumber: "972",
    sha: "c7846bd03d8bb709a93cd4eba4b88889e69a0fd2",
    path: "https://dev.tabiya.tech/api/info",
    database: "connected",
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "Info.Schemas.GET.Response.Payload",
    InfoAPISpecs.Schemas.GET.Response.Payload,
    givenValidInfoResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "Info.Schemas.GET.Response.Payload",
    InfoAPISpecs.Schemas.GET.Response.Payload,
    givenValidInfoResponse
  );

  describe("Validate Info.Schemas.GET.Response.Payload fields", () => {
    describe("Test validation of 'date'", () => {
      testTimestampField<InfoAPISpecs.Types.GET.Response.Payload>("date", InfoAPISpecs.Schemas.GET.Response.Payload);
    });

    describe("Test validation of 'path'", () => {
      testURIField<InfoAPISpecs.Types.GET.Response.Payload>(
        "path",
        ModelInfoConstants.MAX_URI_LENGTH,
        InfoAPISpecs.Schemas.GET.Response.Payload
      );
    });

    describe("Test validation of 'version/branch'", () => {
      testStringField<InfoAPISpecs.Types.GET.Response.Payload>(
        "version",
        InfoConstants.VERSION_MAX_LENGTH,
        InfoAPISpecs.Schemas.GET.Response.Payload
      );
    });

    describe("Test validation of 'buildNumber'", () => {
      testStringField<InfoAPISpecs.Types.GET.Response.Payload>(
        "buildNumber",
        InfoConstants.BUILD_NUMBER_MAX_LENGTH,
        InfoAPISpecs.Schemas.GET.Response.Payload
      );
    });

    describe("Test validation of 'sha'", () => {
      testStringField<InfoAPISpecs.Types.GET.Response.Payload>(
        "sha",
        InfoConstants.SHA_MAX_LENGTH,
        InfoAPISpecs.Schemas.GET.Response.Payload
      );
    });

    describe("Test validation of 'database'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'database'"),
        ],
        [
          CaseType.Failure,
          "null",
          null,
          [
            constructSchemaError("/database", "type", "must be string"),
            constructSchemaError("/database", "enum", "must be equal to one of the allowed values"),
          ],
        ],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          [constructSchemaError("/database", "enum", "must be equal to one of the allowed values")],
        ],
        [
          CaseType.Failure,
          "random string",
          "foo",
          [constructSchemaError("/database", "enum", "must be equal to one of the allowed values")],
        ],
        [CaseType.Success, "connected", "connected", undefined],
        [CaseType.Success, "not connected", "not connected", undefined],
      ])("(%s) Validate 'database' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: InfoAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
          database: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "database",
          givenObject,
          InfoAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });
  });
});
