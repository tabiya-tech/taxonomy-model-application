import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import { getStdObjectIdTestCases } from "_test_utilities/stdSchemaTestCases";
import SkillAPISpecs from "../../../index";
import SkillEnums from "../../../_shared/enums";

describe("SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload",
    SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload schema", () => {
  const validPayload = {
    requiredSkillId: getMockId(1),
    relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
  };

  testSchemaWithValidObject(
    "valid payload with all fields",
    SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload,
    validPayload
  );

  testSchemaWithValidObject(
    "valid payload with only requiredSkillId",
    SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload,
    { requiredSkillId: getMockId(2) }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload,
    {
      ...validPayload,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'requiredSkillId'", () => {
      const testCases = getStdObjectIdTestCases("/requiredSkillId");
      test.each(testCases)(
        "%s Validate 'requiredSkillId' when it is %s",
        (caseType, _description, givenValue, failureMessage) => {
          assertCaseForProperty(
            "requiredSkillId",
            { requiredSkillId: givenValue },
            SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });

    describe("Test validation of 'relationType'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/relationType", "type", "must be string")],
        [CaseType.Failure, "boolean", true, constructSchemaError("/relationType", "type", "must be string")],
        [CaseType.Failure, "number", 123, constructSchemaError("/relationType", "type", "must be string")],
        [
          CaseType.Failure,
          "invalid value",
          "invalid",
          constructSchemaError("/relationType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "essential", SkillEnums.SkillToSkillRelationType.ESSENTIAL, undefined],
        [CaseType.Success, "optional", SkillEnums.SkillToSkillRelationType.OPTIONAL, undefined],
      ])("(%s) Validate 'relationType' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "relationType",
          { requiredSkillId: getMockId(1), relationType: value },
          SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });
  });
});
