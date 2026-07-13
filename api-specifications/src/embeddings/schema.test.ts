import { randomUUID } from "crypto";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { getTestString } from "_test_utilities/specialCharacters";
import {
  testBooleanField,
  testEnumField,
  testNonEmptyStringField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testUUIDField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import EmbeddingsAPISpecs from "./index";
import EmbeddingsConstants from "./constants";

describe("Test the EmbeddingModel Schema", () => {
  // GIVEN the EmbeddingsAPISpecs.Schemas.EmbeddingModel schema
  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema("EmbeddingsAPISpecs.Schemas.EmbeddingModel", EmbeddingsAPISpecs.Schemas.EmbeddingModel);

  describe("Validate JSON against the EmbeddingModel Schema", () => {
    // GIVEN a valid EmbeddingModel object
    const givenValidEmbeddingModel: EmbeddingsConstants.IEmbeddingService = {
      id: randomUUID(),
      modelProvider: EmbeddingsConstants.EEmbeddingModelProvider.GEMINI,
      modelName: getTestString(EmbeddingsConstants.MODEL_NAME_MAX_LENGTH),
      numberOfDimensions: 768,
      enabled: true,
    };

    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject(
      "EmbeddingsAPISpecs.Schemas.EmbeddingModel",
      EmbeddingsAPISpecs.Schemas.EmbeddingModel,
      givenValidEmbeddingModel
    );

    // AND WHEN the object has additional properties
    // THEN expect the object to not validate
    testSchemaWithAdditionalProperties(
      "EmbeddingsAPISpecs.Schemas.EmbeddingModel",
      EmbeddingsAPISpecs.Schemas.EmbeddingModel,
      givenValidEmbeddingModel
    );
  });

  describe("validate EmbeddingsAPISpecs.Schemas.EmbeddingModel fields", () => {
    describe("Test validation of 'id'", () => {
      testUUIDField("id", EmbeddingsAPISpecs.Schemas.EmbeddingModel);
    });

    describe("Test validation of 'modelProvider'", () => {
      testEnumField(
        "modelProvider",
        EmbeddingsAPISpecs.Schemas.EmbeddingModel,
        Object.values(EmbeddingsConstants.EEmbeddingModelProvider)
      );
    });

    describe("Test validation of 'modelName'", () => {
      testNonEmptyStringField(
        "modelName",
        EmbeddingsConstants.MODEL_NAME_MAX_LENGTH,
        EmbeddingsAPISpecs.Schemas.EmbeddingModel
      );
    });

    describe("Test validation of 'numberOfDimensions'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'numberOfDimensions'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/numberOfDimensions", "type", "must be integer")],
        [CaseType.Failure, "a string", "768", constructSchemaError("/numberOfDimensions", "type", "must be integer")],
        [CaseType.Failure, "a float", 768.5, constructSchemaError("/numberOfDimensions", "type", "must be integer")],
        [
          CaseType.Failure,
          "less than the minimum",
          EmbeddingsConstants.MIN_NUMBER_OF_DIMENSIONS - 1,
          constructSchemaError(
            "/numberOfDimensions",
            "minimum",
            `must be >= ${EmbeddingsConstants.MIN_NUMBER_OF_DIMENSIONS}`
          ),
        ],
        [
          CaseType.Failure,
          "greater than the maximum",
          EmbeddingsConstants.MAX_NUMBER_OF_DIMENSIONS + 1,
          constructSchemaError(
            "/numberOfDimensions",
            "maximum",
            `must be <= ${EmbeddingsConstants.MAX_NUMBER_OF_DIMENSIONS}`
          ),
        ],
        [CaseType.Success, "the minimum", EmbeddingsConstants.MIN_NUMBER_OF_DIMENSIONS, undefined],
        [CaseType.Success, "the maximum", EmbeddingsConstants.MAX_NUMBER_OF_DIMENSIONS, undefined],
        [CaseType.Success, "a valid value", 768, undefined],
      ])("(%s) Validate 'numberOfDimensions' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = { numberOfDimensions: givenValue };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "numberOfDimensions",
          givenObject,
          EmbeddingsAPISpecs.Schemas.EmbeddingModel,
          caseType,
          failureMessages
        );
      });
    });

    describe("Test validation of 'enabled'", () => {
      testBooleanField("enabled", EmbeddingsAPISpecs.Schemas.EmbeddingModel);
    });
  });

  describe("Validate the registered EmbeddingModels against the EmbeddingModel Schema", () => {
    // GIVEN an AJV instance compiled with the EmbeddingModel schema
    const givenAjv = new Ajv({ validateSchema: true, allErrors: true, strict: true });
    addFormats(givenAjv);
    const givenValidateFunction = givenAjv.compile(EmbeddingsAPISpecs.Schemas.EmbeddingModel);

    // AND every embedding model registered in the constants registry
    test.each(EmbeddingsConstants.EmbeddingServices.map((model) => [model.modelName, model] as const))(
      "the registered embedding model '%s' validates against the EmbeddingModel schema",
      (_modelName, givenEmbeddingModel) => {
        // WHEN the registered embedding model is validated against the schema
        const actualIsValid = givenValidateFunction(givenEmbeddingModel);

        // THEN expect the embedding model to validate successfully
        expect(actualIsValid).toBe(true);
        // AND no errors to be present
        expect(givenValidateFunction.errors).toBeNull();
      }
    );
  });
});
