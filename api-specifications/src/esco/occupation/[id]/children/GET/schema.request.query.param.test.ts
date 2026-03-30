import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationAPISpecs from "../../../index";
import OccupationConstants from "../../../_shared/constants";

describe("Test Occupation Children Request Query Param Schema Validity", () => {
  testValidSchema(
    "OccupationAPISpecs.Detail.children.GET.Schemas.Request.Query.Payload",
    OccupationAPISpecs.Occupation.Children.GET.Schemas.Request.Query.Payload
  );
});

describe("Test objects against labels OccupationAPISpecs.Detail.GET.children.GET.Schemas.Request.Query.Payload", () => {
  const givenValidRequestQueryParam = {
    limit: OccupationConstants.DEFAULT_LIMIT,
    cursor: "base64-string",
  };

  testSchemaWithValidObject(
    "OccupationAPISpecs.Detail.children.GET.Schemas.Request.Query.Payload",
    OccupationAPISpecs.Occupation.Children.GET.Schemas.Request.Query.Payload,
    givenValidRequestQueryParam
  );

  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Detail.children.GET.Schemas.Request.Query.Payload",
    OccupationAPISpecs.Occupation.Children.GET.Schemas.Request.Query.Payload,
    {
      ...givenValidRequestQueryParam,
      extra: "foo",
    }
  );
});
