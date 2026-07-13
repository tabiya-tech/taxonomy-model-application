import EmbeddingProcessStatesAPISpecs from "../index";
import EmbeddingsAPISpecs from "embeddings";
import { getMockId } from "_test_utilities/mockMongoId";
import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testTimestampField,
  testValidSchema,
  testEnumField,
} from "_test_utilities/stdSchemaTests";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { WHITESPACE } from "_test_utilities/specialCharacters";

describe("Test the EmbeddingProcessStates POST Response Schema", () => {
  // GIVEN the EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload schema
  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema(
    "EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload",
    EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload
  );
});

describe("Validate JSON against the EmbeddingProcessStates POST Response Schema", () => {
  // GIVEN a valid EmbeddingProcessStates POST Response object
  const givenValidEmbeddingProcessStatesResponsePayload: EmbeddingProcessStatesAPISpecs.POST.Types.Response.Payload = {
    id: getMockId(1),
    modelId: getMockId(2),
    status: EmbeddingProcessStatesAPISpecs.Enums.Status.PENDING,
    embeddingServiceId: EmbeddingsAPISpecs.Constants.EmbeddingServiceIds[0],
    totalDocuments: 10,
    errorCounts: 0,
    warningCounts: 0,
    completedDocuments: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload",
    EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload,
    givenValidEmbeddingProcessStatesResponsePayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload",
    EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload,
    givenValidEmbeddingProcessStatesResponsePayload
  );

  describe("Validate the EmbeddingProcessStates POST Response fields", () => {
    describe("Test validation of 'id'", () => {
      testObjectIdField("id", EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload);
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload);
    });

    describe("Test validation of 'status'", () => {
      testEnumField(
        "status",
        EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload,
        Object.values(EmbeddingProcessStatesAPISpecs.Enums.Status)
      );
    });

    describe("Test validation of 'embeddingServiceId'", () => {
      testEnumField(
        "embeddingServiceId",
        EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload,
        EmbeddingsAPISpecs.Constants.EmbeddingServiceIds
      );
    });

    describe.each([["totalDocuments"], ["errorCounts"], ["warningCounts"], ["completedDocuments"]])(
      "Test validation of '%s'",
      (fieldName) => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", `must have required property '${fieldName}'`),
          ],
          [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be integer")],
          [CaseType.Failure, "a string", "foo", constructSchemaError(`/${fieldName}`, "type", "must be integer")],
          [
            CaseType.Failure,
            "only whitespace characters",
            WHITESPACE,
            constructSchemaError(`/${fieldName}`, "type", "must be integer"),
          ],
          [CaseType.Failure, "a float", 1.5, constructSchemaError(`/${fieldName}`, "type", "must be integer")],
          [CaseType.Failure, "a negative number", -1, constructSchemaError(`/${fieldName}`, "minimum", "must be >= 0")],
          [CaseType.Success, "zero", 0, undefined],
          [CaseType.Success, "a positive integer", 42, undefined],
        ])(`(%s) Validate '${fieldName}' when it is %s`, (caseType, _description, givenValue, failureMessages) => {
          // GIVEN an object with the given value
          const givenObject = {
            [fieldName]: givenValue,
          };
          // THEN expect the object to validate accordingly
          assertCaseForProperty(
            fieldName,
            givenObject,
            EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload,
            caseType,
            failureMessages
          );
        });
      }
    );

    describe("Test validation of 'createdAt'", () => {
      testTimestampField<EmbeddingProcessStatesAPISpecs.POST.Types.Response.Payload>(
        "createdAt",
        EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload
      );
    });

    describe("Test validation of 'updatedAt'", () => {
      testTimestampField<EmbeddingProcessStatesAPISpecs.POST.Types.Response.Payload>(
        "updatedAt",
        EmbeddingProcessStatesAPISpecs.POST.Schemas.Response.Payload
      );
    });
  });
});
