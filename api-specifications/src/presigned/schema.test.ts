import PresignedAPISpecs from "./index";
import { getTestString, WHITESPACE } from "_test_utilities/specialCharacters";
import {
  testNonEmptyStringField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testURIField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import PresignedConstants from "presigned/constants";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";

describe("Test the Presigned Schema", () => {
  // GIVEN the Locale.Schemas.Payload schema
  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema("PresignedAPISpecs.Schemas.GET.Response.Payload", PresignedAPISpecs.Schemas.GET.Response.Payload);
});

describe("Validate JSON against the Presigned Schema", () => {
  // GIVEN a valid Presigned object
  const givenValidPresignedResponse: PresignedAPISpecs.Types.GET.Response.Payload = {
    url: "https://foo.bar",
    fields: [
      { name: "name1", value: getTestString(10) },
      { name: "name2", value: getTestString(10) },
    ],
    folder: getTestString(10),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "PresignedAPISpecs.Schemas.GET.Response.Payload",
    PresignedAPISpecs.Schemas.GET.Response.Payload,
    givenValidPresignedResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "PresignedAPISpecs.Schemas.GET.Response.Payload",
    PresignedAPISpecs.Schemas.GET.Response.Payload,
    givenValidPresignedResponse
  );

  describe("Validate PresignedAPISpecs.Schemas.GET.Response.Payload fields", () => {
    describe("Test validation of 'url'", () => {
      testURIField<PresignedAPISpecs.Types.GET.Response.Payload>(
        "url",
        PresignedConstants.MAX_URI_LENGTH,
        PresignedAPISpecs.Schemas.GET.Response.Payload
      );
    });

    describe("Test validation of 'fields'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'fields'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/fields", "type", "must be array")],
        [
          CaseType.Failure,
          "empty array",
          [],
          constructSchemaError("/fields", "minItems", `must NOT have fewer than 1 items`),
        ],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          constructSchemaError("/fields", "type", "must be array"),
        ],
        [
          CaseType.Failure,
          "object in array with missing name",
          [{ value: "foo" }],
          constructSchemaError("/fields/0", "required", "must have required property 'name'"),
        ],
        [
          CaseType.Failure,
          "object in array with missing value",
          [{ name: "foo" }],
          constructSchemaError("/fields/0", "required", "must have required property 'value'"),
        ],
        [CaseType.Success, "valid array with one object", [{ name: "foo", value: "bar" }], undefined],
      ])(`(%s) Validate fields when it is %s`, (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: PresignedAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
          fields: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "fields",
          givenObject,
          PresignedAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });

    describe("Test validation of 'folder'", () => {
      testNonEmptyStringField<PresignedAPISpecs.Types.GET.Response.Payload>(
        "folder",
        PresignedConstants.MAX_FOLDER_NAME_LENGTH,
        PresignedAPISpecs.Schemas.GET.Response.Payload
      );
    });
  });
});
