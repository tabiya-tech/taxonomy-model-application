// ----------------------------------------------
// Test GET Detail Request Param schema
// ----------------------------------------------

import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupAPISpecs from ".";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param validity", () => {
  // WHEN the OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param.Payload schema", () => {
  // GIVEN a valid GET Detail Request Param object
  const givenValidOccupationGroupGETDetailRequestParamPayload = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param.Payload,
    givenValidOccupationGroupGETDetailRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param.Payload,
    { ...givenValidOccupationGroupGETDetailRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param.Payload);
    });

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", OccupationGroupAPISpecs.Schemas.GET.Request.Detail.Param.Payload);
    });
  });
});
