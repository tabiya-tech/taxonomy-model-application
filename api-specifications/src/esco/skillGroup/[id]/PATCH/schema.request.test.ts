import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
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

describe("SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload",
    SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload
  );
});

describe("Test objects against the SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload schema", () => {
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

  testSchemaWithValidObject(
    "empty payload (all fields optional)",
    SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload,
    {}
  );

  testSchemaWithValidObject("single field payload", SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload, {
    preferredLabel: "updated label",
  });

  testSchemaWithValidObject("valid payload", SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload, validPayload);

  testSchemaWithValidObject(
    "valid payload with empty UUIDHistory",
    SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload,
    { ...validPayload, UUIDHistory: [] }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload,
    { ...validPayload, extraProperty: "foo" }
  );

  describe("SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'code'", () => {
      test.each([
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
          SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });

    testSchemaWithValidObject(
      "valid payload without 'code' (PATCH allows partial updates)",
      SkillGroupAPISpecs.SkillGroup.PATCH.Schemas.Request.Payload,
      { ...validPayload, code: undefined }
    );
  });
});
