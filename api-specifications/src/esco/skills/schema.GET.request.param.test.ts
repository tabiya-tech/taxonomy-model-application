import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import SkillAPISpecs from "./index";

describe("Test Skill GET Request Param Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.GET.Request.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillAPISpecs.Schemas.GET.Request.Param.Payload", SkillAPISpecs.Schemas.GET.Request.Param.Payload);
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Request.Param schema", () => {
  // GIVEN a valid skill GET request param object
  const givenValidSkillGETRequestParam = {
    modelId: getMockId(1),
  };

  // Test with a valid request param
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Request.Param.Payload",
    SkillAPISpecs.Schemas.GET.Request.Param.Payload,
    givenValidSkillGETRequestParam
  );

  // Test with additional properties in the request param
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Request.Param.Payload",
    SkillAPISpecs.Schemas.GET.Request.Param.Payload,
    {
      ...givenValidSkillGETRequestParam,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Request.Param.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.GET.Request.Param.Payload;

    describe("Test validation of 'modelId'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'modelId'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/modelId", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/modelId", "pattern", `must match pattern "^[0-9a-f]{24}$"`),
        ],
        [
          CaseType.Failure,
          "invalid ObjectId",
          "invalid-id",
          constructSchemaError("/modelId", "pattern", `must match pattern "^[0-9a-f]{24}$"`),
        ],
        [
          CaseType.Failure,
          "too short ObjectId",
          "507f1f77bcf86cd79943901",
          constructSchemaError("/modelId", "pattern", `must match pattern "^[0-9a-f]{24}$"`),
        ],
        [
          CaseType.Failure,
          "too long ObjectId",
          "507f1f77bcf86cd7994390112",
          constructSchemaError("/modelId", "pattern", `must match pattern "^[0-9a-f]{24}$"`),
        ],
        [
          CaseType.Failure,
          "ObjectId with invalid characters",
          "507f1f77bcf86cd79943901g",
          constructSchemaError("/modelId", "pattern", `must match pattern "^[0-9a-f]{24}$"`),
        ],
        [CaseType.Success, "valid ObjectId", getMockId(1), undefined],
        [CaseType.Success, "another valid ObjectId", getMockId(2), undefined],
      ])("%s Validate 'modelId' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = { modelId: givenValue };
        assertCaseForProperty("modelId", givenObject, givenSchema, caseType, failureMessage);
      });
    });
  });
});
