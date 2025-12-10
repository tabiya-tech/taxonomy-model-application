import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import SkillAPISpecs from "./index";

describe("Test Skill GET Request ById Param Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.GET.Request.ById.Param schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Request.ById.Param schema", () => {
  // GIVEN a valid skill GET request ById param object
  const givenValidSkillGETRequestByIdParam = {
    modelId: getMockId(1),
    id: getMockId(2),
  };

  // Test with a valid request param
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload,
    givenValidSkillGETRequestByIdParam
  );

  // Test with additional properties in the request param
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload",
    SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload,
    {
      ...givenValidSkillGETRequestByIdParam,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.GET.Request.ById.Param.Payload;

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
        const givenObject = { modelId: givenValue, id: getMockId(2) };
        assertCaseForProperty("modelId", givenObject, givenSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of 'id'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'id'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/id", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/id", "pattern", `must match pattern "^[0-9a-f]{24}$"`),
        ],
        [
          CaseType.Failure,
          "invalid ObjectId",
          "invalid-id",
          constructSchemaError("/id", "pattern", `must match pattern "^[0-9a-f]{24}$"`),
        ],
        [
          CaseType.Failure,
          "too short ObjectId",
          "507f1f77bcf86cd79943901",
          constructSchemaError("/id", "pattern", `must match pattern "^[0-9a-f]{24}$"`),
        ],
        [
          CaseType.Failure,
          "too long ObjectId",
          "507f1f77bcf86cd7994390112",
          constructSchemaError("/id", "pattern", `must match pattern "^[0-9a-f]{24}$"`),
        ],
        [
          CaseType.Failure,
          "ObjectId with invalid characters",
          "507f1f77bcf86cd79943901g",
          constructSchemaError("/id", "pattern", `must match pattern "^[0-9a-f]{24}$"`),
        ],
        [CaseType.Success, "valid ObjectId", getMockId(2), undefined],
        [CaseType.Success, "another valid ObjectId", getMockId(3), undefined],
      ])("%s Validate 'id' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = { modelId: getMockId(1), id: givenValue };
        assertCaseForProperty("id", givenObject, givenSchema, caseType, failureMessage);
      });
    });
  });
});
