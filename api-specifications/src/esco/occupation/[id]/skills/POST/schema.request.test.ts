import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import { getStdObjectIdTestCases } from "_test_utilities/stdSchemaTestCases";
import OccupationAPISpecs from "../../../index";
import OccupationEnums from "../../../_shared/enums";
import OccupationConstants from "../../../_shared/constants";
import { SignallingValueLabel } from "../../../../common/objectTypes";

describe("OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload schema", () => {
  const validPayload = {
    requiredSkillId: getMockId(1),
    relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValueLabel: SignallingValueLabel.HIGH,
    signallingValue: 50,
  };

  testSchemaWithValidObject(
    "valid payload with all fields",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload,
    validPayload
  );

  testSchemaWithValidObject(
    "valid payload with only requiredSkillId",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload,
    { requiredSkillId: getMockId(2) }
  );

  testSchemaWithValidObject(
    "valid payload with null signallingValue",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload,
    { ...validPayload, signallingValue: null }
  );

  testSchemaWithValidObject(
    "valid payload with ESCO relationType only",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload,
    { requiredSkillId: getMockId(1), relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL }
  );

  testSchemaWithValidObject(
    "valid payload with signalling values only",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload,
    {
      requiredSkillId: getMockId(1),
      signallingValueLabel: SignallingValueLabel.LOW,
      signallingValue: 25,
    }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload,
    {
      ...validPayload,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'requiredSkillId'", () => {
      const testCases = getStdObjectIdTestCases("/requiredSkillId");
      test.each(testCases)(
        "%s Validate 'requiredSkillId' when it is %s",
        (caseType, _description, givenValue, failureMessage) => {
          assertCaseForProperty(
            "requiredSkillId",
            { requiredSkillId: givenValue },
            OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload,
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
        [CaseType.Success, "empty string (NONE)", OccupationEnums.OccupationToSkillRelationType.NONE, undefined],
        [CaseType.Success, "essential", OccupationEnums.OccupationToSkillRelationType.ESSENTIAL, undefined],
        [CaseType.Success, "optional", OccupationEnums.OccupationToSkillRelationType.OPTIONAL, undefined],
        [
          CaseType.Failure,
          "invalid value",
          "invalid",
          constructSchemaError("/relationType", "enum", "must be equal to one of the allowed values"),
        ],
      ])("(%s) Validate 'relationType' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "relationType",
          { requiredSkillId: getMockId(1), relationType: value },
          OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload,
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
          { requiredSkillId: getMockId(1), signallingValueLabel: value },
          OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload,
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
          OccupationConstants.SIGNALLING_VALUE_MIN - 1,
          constructSchemaError("/signallingValue", "minimum", `must be >= ${OccupationConstants.SIGNALLING_VALUE_MIN}`),
        ],
        [
          CaseType.Failure,
          "above maximum",
          OccupationConstants.SIGNALLING_VALUE_MAX + 1,
          constructSchemaError("/signallingValue", "maximum", `must be <= ${OccupationConstants.SIGNALLING_VALUE_MAX}`),
        ],
        [CaseType.Success, "minimum", OccupationConstants.SIGNALLING_VALUE_MIN, undefined],
        [CaseType.Success, "maximum", OccupationConstants.SIGNALLING_VALUE_MAX, undefined],
        [CaseType.Success, "mid range", 50, undefined],
      ])("(%s) Validate 'signallingValue' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "signallingValue",
          { requiredSkillId: getMockId(1), signallingValue: value },
          OccupationAPISpecs.Occupation.Skills.POST.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
    });
  });
});
