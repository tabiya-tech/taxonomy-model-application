import { testValidSchema } from "_test_utilities/stdSchemaTests";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import OccupationConstants from "../../constants";
import OccupationAPISpecs from "../../index";
import { getStdLimitTestCases, getStdCursorTestCases } from "_test_utilities/stdSchemaTestCases";

describe("Test Occupation Skills Request Query Param Schema Validity", () => {
  // WHEN the OccupationAPISpecs.GET.Skills.Request.Query.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationAPISpecs.Schemas.GET.Skills.Request.Query.Payload",
    OccupationAPISpecs.Schemas.GET.Skills.Request.Query.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Schemas.GET.Skills.Request.Query.Payload schema", () => {
  const givenSchema = OccupationAPISpecs.Schemas.GET.Skills.Request.Query.Payload;

  describe("Test validation of 'limit'", () => {
    const testCases = getStdLimitTestCases("limit", OccupationConstants.MAX_LIMIT, false);

    test.each(testCases)("%s %s", (caseType, desc, value, failure) => {
      assertCaseForProperty("limit", { limit: value }, givenSchema, caseType, failure);
    });
  });

  describe("Test validation of 'cursor'", () => {
    // cursor is optional and non-nullable.
    const testCases = getStdCursorTestCases("cursor", OccupationConstants.MAX_CURSOR_LENGTH, false, false);

    test.each(testCases)("%s %s", (caseType, desc, value, failure) => {
      assertCaseForProperty("cursor", { cursor: value }, givenSchema, caseType, failure);
    });
  });

  test("should succeed with full object", () => {
    const givenObject = {
      limit: OccupationConstants.MAX_LIMIT,
      cursor: "a".repeat(OccupationConstants.MAX_CURSOR_LENGTH),
    };
    assertCaseForProperty("", givenObject, givenSchema, CaseType.Success, undefined);
  });

  test("should fail with additional properties", () => {
    const givenObject = {
      limit: OccupationConstants.MAX_LIMIT,
      extra: "foo",
    };
    assertCaseForProperty(
      "",
      givenObject,
      givenSchema,
      CaseType.Failure,
      constructSchemaError("", "additionalProperties", "must NOT have additional properties")
    );
  });
});
