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
import SkillConstants from "../../../_shared/constants";
import { SignallingValueLabel } from "../../../../common/objectTypes";

describe("SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload",
    SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload schema", () => {
  const validPayload = {
    requiringOccupationId: getMockId(1),
    relationType: SkillEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValueLabel: SignallingValueLabel.HIGH,
    signallingValue: 50,
  };

  testSchemaWithValidObject(
    "valid payload with all fields",
    SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload,
    validPayload
  );

  testSchemaWithValidObject(
    "valid payload with only requiringOccupationId",
    SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload,
    { requiringOccupationId: getMockId(2) }
  );

  testSchemaWithValidObject(
    "valid payload with null signallingValue",
    SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload,
    { ...validPayload, signallingValue: null }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload,
    {
      ...validPayload,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'requiringOccupationId'", () => {
      const testCases = getStdObjectIdTestCases("/requiringOccupationId");
      test.each(testCases)(
        "%s Validate 'requiringOccupationId' when it is %s",
        (caseType, _description, givenValue, failureMessage) => {
          assertCaseForProperty(
            "requiringOccupationId",
            { requiringOccupationId: givenValue },
            SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload,
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
        [CaseType.Success, "empty string (NONE)", SkillEnums.OccupationToSkillRelationType.NONE, undefined],
        [CaseType.Success, "essential", SkillEnums.OccupationToSkillRelationType.ESSENTIAL, undefined],
        [CaseType.Success, "optional", SkillEnums.OccupationToSkillRelationType.OPTIONAL, undefined],
        [
          CaseType.Failure,
          "invalid value",
          "invalid",
          constructSchemaError("/relationType", "enum", "must be equal to one of the allowed values"),
        ],
      ])("(%s) Validate 'relationType' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "relationType",
          { requiringOccupationId: getMockId(1), relationType: value },
          SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'signallingValueLabel'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/signallingValueLabel", "type", "must be string")],
        [CaseType.Failure, "boolean", false, constructSchemaError("/signallingValueLabel", "type", "must be string")],
        [CaseType.Failure, "number", 99, constructSchemaError("/signallingValueLabel", "type", "must be string")],
        [CaseType.Success, "empty string (NONE)", SignallingValueLabel.NONE, undefined],
        [CaseType.Success, "high", SignallingValueLabel.HIGH, undefined],
        [CaseType.Success, "medium", SignallingValueLabel.MEDIUM, undefined],
        [CaseType.Success, "low", SignallingValueLabel.LOW, undefined],
        [
          CaseType.Failure,
          "invalid value",
          "invalid",
          constructSchemaError("/signallingValueLabel", "enum", "must be equal to one of the allowed values"),
        ],
      ])("(%s) Validate 'signallingValueLabel' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "signallingValueLabel",
          { requiringOccupationId: getMockId(1), signallingValueLabel: value },
          SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });

    describe("Test validation of 'signallingValue'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Success, "null", null, undefined],
        [CaseType.Failure, "string", "foo", constructSchemaError("/signallingValue", "type", "must be number,null")],
        [CaseType.Failure, "boolean", true, constructSchemaError("/signallingValue", "type", "must be number,null")],
        [CaseType.Failure, "array", [1], constructSchemaError("/signallingValue", "type", "must be number,null")],
        [
          CaseType.Failure,
          "below minimum",
          SkillConstants.SIGNALLING_VALUE_MIN - 1,
          constructSchemaError("/signallingValue", "minimum", `must be >= ${SkillConstants.SIGNALLING_VALUE_MIN}`),
        ],
        [
          CaseType.Failure,
          "above maximum",
          SkillConstants.SIGNALLING_VALUE_MAX + 1,
          constructSchemaError("/signallingValue", "maximum", `must be <= ${SkillConstants.SIGNALLING_VALUE_MAX}`),
        ],
        [CaseType.Success, "minimum", SkillConstants.SIGNALLING_VALUE_MIN, undefined],
        [CaseType.Success, "maximum", SkillConstants.SIGNALLING_VALUE_MAX, undefined],
        [CaseType.Success, "mid range", 50, undefined],
      ])("(%s) Validate 'signallingValue' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "signallingValue",
          { requiringOccupationId: getMockId(1), signallingValue: value },
          SkillAPISpecs.Skill.Occupations.PATCH.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });
  });
});
