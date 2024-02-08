import ImportProcessStateAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import {
  testBooleanField,
  testEnumField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testTimestampField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { WHITESPACE } from "_test_utilities/specialCharacters";

describe("Test the ImportProcessStateAPISpecs Schema", () => {
  // GIVEN the ImportProcessStateAPISpecs.Schemas.GET.Response.Payload schema

  // WHEN the schema is validated

  // THEN expect the schema to be valid
  testValidSchema(
    "ImportProcessStateAPISpecs.Schemas.GET.Response.Payload",
    ImportProcessStateAPISpecs.Schemas.GET.Response.Payload
  );
});

describe("Validate JSON against the ImportProcessStateAPISpecs Schema", () => {
  // GIVEN a valid ImportProcessStateAPISpecs object
  const givenValidImportProcessState: ImportProcessStateAPISpecs.Types.GET.Response.Payload = {
    id: getMockId(1),
    modelId: getMockId(2),
    status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
    result: {
      errored: false,
      parsingErrors: false,
      parsingWarnings: false,
    },
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "ImportProcessStateAPISpecs.Schemas.GET.Response.Payload",
    ImportProcessStateAPISpecs.Schemas.GET.Response.Payload,
    givenValidImportProcessState
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "ImportProcessStateAPISpecs.Schemas.GET.Response.Payload",
    ImportProcessStateAPISpecs.Schemas.GET.Response.Payload,
    givenValidImportProcessState
  );
  describe("Validate ImportProcessState fields", () => {
    describe("Test validation of 'id'", () => {
      testObjectIdField("id", ImportProcessStateAPISpecs.Schemas.GET.Response.Payload);
    });

    describe("Test validation of modelId", () => {
      testObjectIdField("modelId", ImportProcessStateAPISpecs.Schemas.GET.Response.Payload);
    });

    describe("Test validation of 'status'", () => {
      testEnumField(
        "status",
        ImportProcessStateAPISpecs.Schemas.GET.Response.Payload,
        Object.values(ImportProcessStateAPISpecs.Enums.Status)
      );
    });

    describe("Test validation of 'result'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'result'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/result", "type", "must be object")],
        [
          CaseType.Failure,
          "only whitespace characters",
          WHITESPACE,
          constructSchemaError("/result", "type", "must be object"),
        ],
        [CaseType.Failure, "random string", "foo", constructSchemaError("/result", "type", "must be object")],
        [
          CaseType.Failure,
          "empty object",
          {},
          [
            constructSchemaError("/result", "required", "must have required property 'errored'"),
            constructSchemaError("/result", "required", "must have required property 'parsingErrors'"),
            constructSchemaError("/result", "required", "must have required property 'parsingWarnings'"),
          ],
        ],
        [
          CaseType.Success,
          "a valid result",
          {
            errored: false,
            parsingErrors: false,
            parsingWarnings: false,
          },
          undefined,
        ],
      ])("(%s) Validate 'result' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject: ImportProcessStateAPISpecs.Types.GET.Response.Payload = {
          // @ts-ignore
          result: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "result",
          givenObject,
          ImportProcessStateAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });

    describe.each([["result/parsingWarnings"], ["result/parsingErrors"], ["result/errored"]])(
      `Test validation of '%s'`,
      (propertyName) => {
        testBooleanField(propertyName, ImportProcessStateAPISpecs.Schemas.GET.Response.Payload);
      }
    );

    describe("Test validation of 'createdAt'", () => {
      testTimestampField<ImportProcessStateAPISpecs.Types.GET.Response.Payload>(
        "createdAt",
        ImportProcessStateAPISpecs.Schemas.GET.Response.Payload
      );
    });

    describe("Test validation of 'updatedAt'", () => {
      testTimestampField<ImportProcessStateAPISpecs.Types.GET.Response.Payload>(
        "updatedAt",
        ImportProcessStateAPISpecs.Schemas.GET.Response.Payload
      );
    });
  });
});
