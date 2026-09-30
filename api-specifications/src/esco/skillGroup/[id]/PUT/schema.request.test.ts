import {
  testNonEmptyURIStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
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
import LanguageAPISpecs from "language";

const givenFallbackDbKeyName = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;

// GIVEN a function to test a translatable field of the PUT request schema (an object keyed by language)
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
      SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload,
      caseType,
      failure
    );
  });
}

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
    description: { [givenFallbackDbKeyName]: getTestString(SkillGroupConstants.DESCRIPTION_MAX_LENGTH) },
    preferredLabel: { [givenFallbackDbKeyName]: getTestString(SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH) },
    altLabels: [{ [givenFallbackDbKeyName]: getTestString(SkillGroupConstants.ALT_LABEL_MAX_LENGTH) }],
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
    scopeNote: { [givenFallbackDbKeyName]: getTestString(SkillGroupConstants.MAX_SCOPE_NOTE_LENGTH) },
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
      testTranslatedStringField("description", SkillGroupConstants.DESCRIPTION_MAX_LENGTH);
    });

    describe("Test validation of 'scopeNote'", () => {
      testTranslatedStringField("scopeNote", SkillGroupConstants.MAX_SCOPE_NOTE_LENGTH);
    });

    describe("Test validation of 'preferredLabel'", () => {
      testTranslatedStringField("preferredLabel", SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH);
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
          CaseType.Success,
          "an array of single language values",
          [
            { [givenFallbackDbKeyName]: getTestString(SkillGroupConstants.ALT_LABEL_MAX_LENGTH) },
            { [givenFallbackDbKeyName]: getTestString(SkillGroupConstants.ALT_LABEL_MAX_LENGTH - 1) },
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
      ])("(%s) Validate 'altLabels' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty(
          "altLabels",
          { ...validPayload, altLabels: value },
          SkillGroupAPISpecs.SkillGroup.PUT.Schemas.Request.Payload,
          caseType,
          failure
        );
      });
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
