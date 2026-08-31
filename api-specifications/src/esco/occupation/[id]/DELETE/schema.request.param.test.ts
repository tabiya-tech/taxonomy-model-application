import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationAPISpecs from "../../index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test OccupationAPISpecs.Detail.DELETE.Schemas.Request.Param validity", () => {
  // WHEN the OccupationAPISpecs.Detail.DELETE.Schemas.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationAPISpecs.Detail.DELETE.Schemas.Request.Param.Payload",
    OccupationAPISpecs.Occupation.DELETE.Schemas.Request.Param.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Detail.DELETE.Schemas.Request.Param.Payload schema", () => {
  // GIVEN a valid DELETE Detail Request Param object
  const givenValidOccupationDELETEDetailRequestParamPayload = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationAPISpecs.Detail.DELETE.Schemas.Request.Param.Payload",
    OccupationAPISpecs.Occupation.DELETE.Schemas.Request.Param.Payload,
    givenValidOccupationDELETEDetailRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Detail.DELETE.Schemas.Request.Param.Payload",
    OccupationAPISpecs.Occupation.DELETE.Schemas.Request.Param.Payload,
    { ...givenValidOccupationDELETEDetailRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate OccupationAPISpecs.Detail.DELETE.Schemas.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationAPISpecs.Occupation.DELETE.Schemas.Request.Param.Payload);
    });

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", OccupationAPISpecs.Occupation.DELETE.Schemas.Request.Param.Payload);
    });
  });
});
