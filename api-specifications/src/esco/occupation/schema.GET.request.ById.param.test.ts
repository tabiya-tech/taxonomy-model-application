import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test OccupationAPISpecs.Schemas.GET.Request.ById.Param validity", () => {
  // WHEN the OccupationAPISpecs.Schemas.GET.Request.ById.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload schema", () => {
  // GIVEN a valid GET Detail Request Param object
  const givenValidOccupationGETDetailRequestParamPayload = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload,
    givenValidOccupationGETDetailRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload,
    { ...givenValidOccupationGETDetailRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload);
    });

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", OccupationAPISpecs.Schemas.GET.Request.ById.Param.Payload);
    });
  });
});
