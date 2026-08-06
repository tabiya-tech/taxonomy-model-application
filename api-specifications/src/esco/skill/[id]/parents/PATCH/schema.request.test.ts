import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import { getStdObjectIdTestCases } from "_test_utilities/stdSchemaTestCases";
import SkillAPISpecs from "../../../index";
import { ObjectTypes } from "../GET/enums";

describe("SkillAPISpecs.Skill.Parents.PATCH.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "SkillAPISpecs.Skill.Parents.PATCH.Schemas.Request.Payload",
    SkillAPISpecs.Skill.Parents.PATCH.Schemas.Request.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Skill.Parents.PATCH.Schemas.Request.Payload schema", () => {
  const validPayload = {
    parentId: getMockId(1),
    parentType: ObjectTypes.Skill,
  };

  testSchemaWithValidObject(
    "valid payload with Skill parent",
    SkillAPISpecs.Skill.Parents.PATCH.Schemas.Request.Payload,
    validPayload
  );

  testSchemaWithValidObject(
    "valid payload with SkillGroup parent",
    SkillAPISpecs.Skill.Parents.PATCH.Schemas.Request.Payload,
    { parentId: getMockId(2), parentType: ObjectTypes.SkillGroup }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    SkillAPISpecs.Skill.Parents.PATCH.Schemas.Request.Payload,
    {
      ...validPayload,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("SkillAPISpecs.Skill.Parents.PATCH.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'parentId'", () => {
      const testCases = getStdObjectIdTestCases("/parentId");
      test.each(testCases)(
        "%s Validate 'parentId' when it is %s",
        (caseType, _description, givenValue, failureMessage) => {
          assertCaseForProperty(
            "parentId",
            { parentId: givenValue, parentType: ObjectTypes.Skill },
            SkillAPISpecs.Skill.Parents.PATCH.Schemas.Request.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });

    describe("Test validation of 'parentType'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'parentType'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/parentType", "type", "must be string")],
        [CaseType.Failure, "boolean", true, constructSchemaError("/parentType", "type", "must be string")],
        [CaseType.Failure, "number", 123, constructSchemaError("/parentType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/parentType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "invalid value",
          "invalid",
          constructSchemaError("/parentType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "skill", ObjectTypes.Skill, undefined],
        [CaseType.Success, "skillgroup", ObjectTypes.SkillGroup, undefined],
      ])("(%s) Validate 'parentType' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "parentType",
          { parentId: getMockId(1), parentType: value },
          SkillAPISpecs.Skill.Parents.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });
  });
});
