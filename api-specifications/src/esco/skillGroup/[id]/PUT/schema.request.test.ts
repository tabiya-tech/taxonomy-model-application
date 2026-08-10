import {
  testNonEmptyStringField,
  testNonEmptyURIStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testUUIDArray,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import SkillGroupAPISpecs from "../../index";
import SkillGroupConstants from "../../_shared/constants";
import SkillGroupRegexes from "../../_shared/regex";
import { getTestSkillGroupCode } from "../../../_test_utilities/testUtils";

describe("SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload",
    SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload
  );
});

describe("Test objects against the SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload schema", () => {
  const validPayload = {
    originUri: "https://path/to/group",
    code: getTestSkillGroupCode(),
    description: getTestString(SkillGroupConstants.DESCRIPTION_MAX_LENGTH),
    preferredLabel: getTestString(SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(SkillGroupConstants.ALT_LABEL_MAX_LENGTH)],
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
    scopeNote: getTestString(SkillGroupConstants.MAX_SCOPE_NOTE_LENGTH),
  };

  testSchemaWithValidObject("valid payload", SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload, validPayload);

  testSchemaWithValidObject(
    "valid payload with empty UUIDHistory",
    SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload,
    { ...validPayload, UUIDHistory: [] }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload,
    { ...validPayload, extraProperty: "foo" }
  );

  describe("SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'code'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'code'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/code", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/code", "pattern", `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`),
        ],
        [
          CaseType.Failure,
          "an invalid code",
          "invalidCode",
          constructSchemaError("/code", "pattern", `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`),
        ],
        [
          CaseType.Failure,
          "Too long code",
          getTestString(SkillGroupConstants.CODE_MAX_LENGTH + 1),
          constructSchemaError(
            "/code",
            "maxLength",
            `must NOT have more than ${SkillGroupConstants.CODE_MAX_LENGTH} characters`
          ),
        ],
        [CaseType.Success, "a valid code", getTestSkillGroupCode(), undefined],
      ])("%s Validate 'code' when it is %s with", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          code: givenValue,
        };

        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "code",
          givenObject,
          SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Request.Payload>(
        "originUri",
        SkillGroupConstants.ORIGIN_URI_MAX_LENGTH,
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload
      );
    });

    describe("Test validation of 'description'", () => {
      testStringField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Request.Payload>(
        "description",
        SkillGroupConstants.DESCRIPTION_MAX_LENGTH,
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload
      );
    });

    describe("Test validation of 'scopeNote'", () => {
      testStringField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Request.Payload>(
        "scopeNote",
        SkillGroupConstants.MAX_SCOPE_NOTE_LENGTH,
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
      testNonEmptyStringField<SkillGroupAPISpecs.SkillGroup.PUT.Types.Request.Payload>(
        "preferredLabel",
        SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload
      );
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload);
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<SkillGroupAPISpecs.SkillGroup.PUT.Types.Request.Payload>(
        "UUIDHistory",
        SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload
      );
    });
  });
});
