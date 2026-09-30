import { randomUUID } from "crypto";
import {
  testNonEmptyURIStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testUUIDArray,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import SkillGroupPOSTAPISpecs from "./index";

import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getTestSkillGroupCode } from "../../_test_utilities/testUtils";
import SkillGroupPOSTConstants from "./constants";
import SkillGroupRegexes from "../_shared/regex";
import LanguageAPISpecs from "language";

const givenFallbackDbKeyName = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;

// GIVEN a function to test a translatable field of the POST request schema (an object keyed by language)
function testTranslatedStringField(fieldName: string, maxLength: number) {
  test.each([
    [
      CaseType.Failure,
      "undefined",
      undefined,
      constructSchemaError("", "required", `must have required property '${fieldName}'`),
    ],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be object")],
    [CaseType.Success, "a single language value", { [givenFallbackDbKeyName]: getTestString(maxLength) }, undefined],
    [
      CaseType.Success,
      "a multi language value",
      { [givenFallbackDbKeyName]: getTestString(maxLength), fr: getTestString(maxLength) },
      undefined,
    ],
    [
      CaseType.Failure,
      "a value missing the fallback language",
      { fr: getTestString(maxLength) },
      constructSchemaError(`/${fieldName}`, "required", `must have required property '${givenFallbackDbKeyName}'`),
    ],
    [
      CaseType.Failure,
      "a value translated in a language that is not in the registry",
      { [givenFallbackDbKeyName]: getTestString(maxLength), tlh: "nuqneH" },
      constructSchemaError(`/${fieldName}`, "additionalProperties", "must NOT have additional properties"),
    ],
    [
      CaseType.Failure,
      "a value longer than the maximum length in one language only",
      { [givenFallbackDbKeyName]: getTestString(maxLength), fr: getTestString(maxLength + 1) },
      constructSchemaError(`/${fieldName}/fr`, "maxLength", "must NOT have more than " + maxLength + " characters"),
    ],
  ] as const)(`(%s) Validate '${fieldName}' when it is %s`, (caseType, _description, givenValue, failure) => {
    assertCaseForProperty(
      fieldName,
      { [fieldName]: givenValue },
      SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
      caseType,
      failure
    );
  });
}

describe("Test SkillGroupPOSTAPISpecs.Schemas.Request.Payload validity", () => {
  // WHEN the SkillGroupPOSTAPISpecs.POST.Request.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillGroupPOSTAPISpecs.Schemas.Request.Payload", SkillGroupPOSTAPISpecs.Schemas.Request.Payload);
});
describe("Test objects against the SkillGroupPOSTAPISpecs.Schemas.Request.Payload schema", () => {
  // GIVEN a valid request payload object
  const validRequestPayload = {
    originUri: "https://path/to/group",
    code: getTestSkillGroupCode(),
    scopeNote: { [givenFallbackDbKeyName]: getTestString(SkillGroupPOSTConstants.MAX_SCOPE_NOTE_LENGTH) },
    description: { [givenFallbackDbKeyName]: getTestString(SkillGroupPOSTConstants.DESCRIPTION_MAX_LENGTH) },
    preferredLabel: { [givenFallbackDbKeyName]: getTestString(SkillGroupPOSTConstants.PREFERRED_LABEL_MAX_LENGTH) },
    altLabels: [{ [givenFallbackDbKeyName]: getTestString(SkillGroupPOSTConstants.ALT_LABEL_MAX_LENGTH) }],
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupPOSTAPISpecs.Schemas.Request.Payload",
    SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
    validRequestPayload
  );

  // GIVEN the object has an empty UUIDHistory
  const givenSkillGroupPOSTRequestWithEmptyUUIDHistory = { ...validRequestPayload };
  givenSkillGroupPOSTRequestWithEmptyUUIDHistory.UUIDHistory = [];
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupPOSTAPISpecs.Schemas.Request.Payload",
    SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
    givenSkillGroupPOSTRequestWithEmptyUUIDHistory
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupPOSTAPISpecs.Schemas.Request.Payload",
    SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
    { ...validRequestPayload, UUID: randomUUID() }
  );

  describe("Validate SkillGroupPOSTAPISpecs.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<SkillGroupPOSTAPISpecs.Types.Request.Payload>(
        "originUri",
        SkillGroupPOSTAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        SkillGroupPOSTAPISpecs.Schemas.Request.Payload
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
          getTestString(SkillGroupPOSTAPISpecs.Constants.CODE_MAX_LENGTH + 1),
          constructSchemaError(
            "/code",
            "maxLength",
            `must NOT have more than ${SkillGroupPOSTAPISpecs.Constants.CODE_MAX_LENGTH} characters`
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
          SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });
    describe("Test validation of 'description'", () => {
      testTranslatedStringField("description", SkillGroupPOSTAPISpecs.Constants.DESCRIPTION_MAX_LENGTH);
    });
    describe("Test validation of 'scopeNote'", () => {
      testTranslatedStringField("scopeNote", SkillGroupPOSTAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH);
    });

    describe("Test validation of 'preferredLabel'", () => {
      testTranslatedStringField("preferredLabel", SkillGroupPOSTAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH);
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
          "array of items missing the fallback language",
          [{ fr: "foo" }],
          constructSchemaError("/altLabels/0", "required", `must have required property '${givenFallbackDbKeyName}'`),
        ],
        [
          CaseType.Failure,
          "an array of the same translated value",
          [{ [givenFallbackDbKeyName]: "foo" }, { [givenFallbackDbKeyName]: "foo" }],
          constructSchemaError(
            "/altLabels",
            "uniqueItems",
            "must NOT have duplicate items (items ## 0 and 1 are identical)"
          ),
        ],
        [
          CaseType.Success,
          "an array of single language values",
          [
            { [givenFallbackDbKeyName]: getTestString(SkillGroupPOSTAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) },
            { [givenFallbackDbKeyName]: getTestString(SkillGroupPOSTAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1) },
          ],
          undefined,
        ],
        [
          CaseType.Success,
          "an array of multi language values",
          [{ [givenFallbackDbKeyName]: "Managers", fr: "Directeurs" }],
          undefined,
        ],
        [
          CaseType.Failure,
          "an array with an item translated in a language that is not in the registry",
          [{ [givenFallbackDbKeyName]: "Managers", tlh: "nuqneH" }],
          constructSchemaError("/altLabels/0", "additionalProperties", "must NOT have additional properties"),
        ],
      ])("(%s) Validate 'altLabels' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          altLabels: givenValue,
        };

        assertCaseForProperty(
          "altLabels",
          givenObject,
          SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillGroupPOSTAPISpecs.Schemas.Request.Payload);
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<SkillGroupPOSTAPISpecs.Types.Request.Payload>(
        "UUIDHistory",
        SkillGroupPOSTAPISpecs.Schemas.Request.Payload
      );
    });
  });
});
