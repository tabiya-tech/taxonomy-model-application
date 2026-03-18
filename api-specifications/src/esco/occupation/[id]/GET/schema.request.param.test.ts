import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationAPISpecs from "../../index";
import { getMockId } from "_test_utilities/mockMongoId";

describe("Test OccupationAPISpecs.Detail.GET.Schemas.Request.Param validity", () => {
  // WHEN the OccupationAPISpecs.Detail.GET.Schemas.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationAPISpecs.Detail.GET.Schemas.Request.Param.Payload",
    OccupationAPISpecs.Detail.GET.Schemas.Request.Param.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Detail.GET.Schemas.Request.Param.Payload schema", () => {
  // GIVEN a valid GET Detail Request Param object
  const givenValidOccupationGETDetailRequestParamPayload = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationAPISpecs.Detail.GET.Schemas.Request.Param.Payload",
    OccupationAPISpecs.Detail.GET.Schemas.Request.Param.Payload,
    givenValidOccupationGETDetailRequestParamPayload
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Detail.GET.Schemas.Request.Param.Payload",
    OccupationAPISpecs.Detail.GET.Schemas.Request.Param.Payload,
    { ...givenValidOccupationGETDetailRequestParamPayload, extraProperty: "foo" }
  );

  describe("Validate OccupationAPISpecs.Detail.GET.Schemas.Request.Param.Payload fields", () => {
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationAPISpecs.Detail.GET.Schemas.Request.Param.Payload);
    });

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", OccupationAPISpecs.Detail.GET.Schemas.Request.Param.Payload);
    });
  });
});
