import EmbeddingProcessStatesAPISpecs from "../index";
import EmbeddingsAPISpecs from "embeddings";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testEnumField,
} from "_test_utilities/stdSchemaTests";

describe("Test the EmbeddingProcessStates POST Request Schema", () => {
  // GIVEN the EmbeddingProcessStatesAPISpecs.POST.Schemas.Request.Payload schema
  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema(
    "EmbeddingProcessStatesAPISpecs.POST.Schemas.Request.Payload",
    EmbeddingProcessStatesAPISpecs.POST.Schemas.Request.Payload
  );
});

describe("Validate JSON against the EmbeddingProcessStates POST Request Schema", () => {
  // GIVEN a valid EmbeddingProcessStates POST Request object
  const givenValidEmbeddingProcessStatesRequestPayload: EmbeddingProcessStatesAPISpecs.POST.Types.Request.Payload = {
    embeddingServiceId: EmbeddingsAPISpecs.Constants.EmbeddingServiceIds[0],
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "EmbeddingProcessStatesAPISpecs.POST.Schemas.Request.Payload",
    EmbeddingProcessStatesAPISpecs.POST.Schemas.Request.Payload,
    givenValidEmbeddingProcessStatesRequestPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "EmbeddingProcessStatesAPISpecs.POST.Schemas.Request.Payload",
    EmbeddingProcessStatesAPISpecs.POST.Schemas.Request.Payload,
    givenValidEmbeddingProcessStatesRequestPayload
  );

  describe("Validate the EmbeddingProcessStates POST Request fields", () => {
    describe("Test validation of 'embeddingServiceId'", () => {
      testEnumField(
        "embeddingServiceId",
        EmbeddingProcessStatesAPISpecs.POST.Schemas.Request.Payload,
        EmbeddingsAPISpecs.Constants.EmbeddingServiceIds
      );
    });
  });
});
