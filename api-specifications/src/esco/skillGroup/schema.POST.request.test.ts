import { randomUUID } from "crypto";
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

import SkillGroupAPISpecs from "./index";
import SkillGroupRegexes from "./regex";

import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getTestSkillGroupCode } from "../_test_utilities/testUtils";
import SkillGroupConstants from "./constants";

describe("Test SkillGroupAPISpecs.Schemas.POST.Request.Payload validity", () => {
  // WHEN the SkillGroupAPISpecs.POST.Request.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillGroupAPISpecs.Schemas.POST.Request.Payload", SkillGroupAPISpecs.Schemas.POST.Request.Payload);
});
describe("Test objects against the SkillGroupAPISpecs.Schemas.POST.Request.Payload schema", () => {
  // GIVEN a valid request payload object
  const validRequestPayload = {
    originUri: "https://path/to/group",
    code: getTestSkillGroupCode(),
    scopeNote: getTestString(SkillGroupConstants.MAX_SCOPE_NOTE_LENGTH),
    description: getTestString(SkillGroupConstants.DESCRIPTION_MAX_LENGTH),
    preferredLabel: getTestString(SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(SkillGroupConstants.ALT_LABEL_MAX_LENGTH)],
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupAPISpecs.Schemas.POST.Request.Payload",
    SkillGroupAPISpecs.Schemas.POST.Request.Payload,
    validRequestPayload
  );

  // GIVEN the object has an empty UUIDHistory
  const givenSkillGroupPOSTRequestWithEmptyUUIDHistory = { ...validRequestPayload };
  givenSkillGroupPOSTRequestWithEmptyUUIDHistory.UUIDHistory = [];
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupAPISpecs.Schemas.POST.Request.Payload",
    SkillGroupAPISpecs.Schemas.POST.Request.Payload,
    givenSkillGroupPOSTRequestWithEmptyUUIDHistory
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupAPISpecs.Schemas.POST.Request.Payload",
    SkillGroupAPISpecs.Schemas.POST.Request.Payload,
    { ...validRequestPayload, UUID: randomUUID() }
  );

  describe("Validate SkillGroupAPISpecs.Schemas.POST.Request.Payload fields", () => {
    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<SkillGroupAPISpecs.Types.POST.Request.Payload>(
        "originUri",
        SkillGroupAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        SkillGroupAPISpecs.Schemas.POST.Request.Payload
      );
    });
    describe("Test validate of 'code'", () => {
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
          getTestString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH + 1),
          constructSchemaError(
            "/code",
            "maxLength",
            `must NOT have more than ${SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH} characters`
          ),
        ],
        [CaseType.Success, "a valid code", getTestSkillGroupCode(), undefined],
      ])("%s Validate 'code' when it is %s with", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          code: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "code",
          givenObject,
          SkillGroupAPISpecs.Schemas.POST.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });
    describe("Test validation of 'description'", () => {
      testStringField<SkillGroupAPISpecs.Types.POST.Request.Payload>(
        "description",
        SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        SkillGroupAPISpecs.Schemas.POST.Request.Payload
      );
    });
    describe("Test validation of 'scopeNote'", () => {
      testStringField<SkillGroupAPISpecs.Types.POST.Request.Payload>(
        "scopeNote",
        SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH,
        SkillGroupAPISpecs.Schemas.POST.Request.Payload
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
      testNonEmptyStringField<SkillGroupAPISpecs.Types.POST.Request.Payload>(
        "preferredLabel",
        SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        SkillGroupAPISpecs.Schemas.POST.Request.Payload
      );
    });
    describe("Test validation of 'altLabels'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'altLabels'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/altLabels", "type", "must be array")],
        [CaseType.Failure, "empty string", "", constructSchemaError("/altLabels", "type", "must be array")],
        [
          CaseType.Failure,
          "an array of objects",
          [{}, {}],
          [
            constructSchemaError("/altLabels/0", "type", "must be string"),
            constructSchemaError("/altLabels/1", "type", "must be string"),
          ],
        ],
        [
          CaseType.Failure,
          "an array of same strings",
          ["foo", "foo"],
          constructSchemaError(
            "/altLabels",
            "uniqueItems",
            "must NOT have duplicate items (items ## 1 and 0 are identical)"
          ),
        ],
        [
          CaseType.Success,
          "an array of valid altLabels strings",
          [
            getTestString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1),
          ],
          undefined,
        ],
      ])("(%s) Validate 'altLabels' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          altLabels: givenValue,
        };

        assertCaseForProperty(
          "altLabels",
          givenObject,
          SkillGroupAPISpecs.Schemas.POST.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillGroupAPISpecs.Schemas.POST.Request.Payload);
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<SkillGroupAPISpecs.Types.POST.Request.Payload>(
        "UUIDHistory",
        SkillGroupAPISpecs.Schemas.POST.Request.Payload
      );
    });
  });
});
