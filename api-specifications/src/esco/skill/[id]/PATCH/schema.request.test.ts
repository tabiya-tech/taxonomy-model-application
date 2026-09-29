import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import SkillAPISpecs from "../../index";
import SkillEnums from "../../_shared/enums";
import SkillConstants from "../../_shared/constants";
import { RegExp_Str_ID } from "../../../../regex";
import LanguageAPISpecs from "language";

const givenFallbackDbKeyName = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName;

// GIVEN a function to test a translatable field of the PATCH request schema (merge semantics: the field
// itself is optional, each present language is optional except the fallback, which can never be null)
function testPatchTranslatedStringField(fieldName: string, maxLength: number) {
  test.each([
    [CaseType.Success, "the field entirely absent", undefined, undefined],
    [CaseType.Failure, "null", null, constructSchemaError(`/${fieldName}`, "type", "must be object")],
    [CaseType.Success, "a single language value", { [givenFallbackDbKeyName]: getTestString(maxLength) }, undefined],
    [
      CaseType.Success,
      "a multi language value",
      { [givenFallbackDbKeyName]: getTestString(maxLength), fr: getTestString(maxLength) },
      undefined,
    ],
    [
      CaseType.Success,
      "only a non-fallback language, fallback omitted (merge leaves the fallback untouched)",
      { fr: getTestString(maxLength) },
      undefined,
    ],
    [
      CaseType.Success,
      "a non-fallback language explicitly set to null (deletes that language)",
      { fr: null },
      undefined,
    ],
    [
      CaseType.Failure,
      "the fallback language explicitly set to null",
      { [givenFallbackDbKeyName]: null },
      constructSchemaError(`/${fieldName}/${givenFallbackDbKeyName}`, "type", "must be string"),
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
      SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload,
      caseType,
      failure
    );
  });
}

describe("SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload schema", () => {
  testValidSchema(
    "SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload",
    SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload schema", () => {
  testSchemaWithValidObject(
    "empty payload (all fields optional)",
    SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload,
    {}
  );

  testSchemaWithValidObject("single field payload", SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload, {
    preferredLabel: { [givenFallbackDbKeyName]: "updated label" },
  });

  testSchemaWithValidObject("multi language payload", SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload, {
    preferredLabel: { [givenFallbackDbKeyName]: "Cook", fr: "Cuisinier" },
    description: { fr: "Une description" },
  });

  testSchemaWithValidObject(
    "payload deleting a non fallback language via null",
    SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload,
    {
      preferredLabel: { fr: null },
    }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload,
    {
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Skill.PATCH.Schemas.Request.Payload;

    describe("Test validation of 'UUIDHistory'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/UUIDHistory", "type", "must be array")],
        [CaseType.Failure, "empty string", "", constructSchemaError("/UUIDHistory", "type", "must be array")],
        [CaseType.Success, "empty array", [], undefined],
      ])("(%s) Validate 'UUIDHistory' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("UUIDHistory", { UUIDHistory: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'originUri'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/originUri", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/originUri", "pattern", 'must match pattern "\\S"'),
        ],
        [
          CaseType.Failure,
          "invalid format",
          "not-a-uri",
          constructSchemaError("/originUri", "format", 'must match format "uri"'),
        ],
        [CaseType.Success, "a valid URI", "https://example.com", undefined],
      ])("(%s) Validate 'originUri' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("originUri", { originUri: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'preferredLabel'", () => {
      testPatchTranslatedStringField("preferredLabel", SkillConstants.PREFERRED_LABEL_MAX_LENGTH);
    });

    describe("Test validation of 'altLabels'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
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
            { [givenFallbackDbKeyName]: getTestString(SkillConstants.ALT_LABEL_MAX_LENGTH) },
            { [givenFallbackDbKeyName]: getTestString(SkillConstants.ALT_LABEL_MAX_LENGTH - 1) },
          ],
          undefined,
        ],
        [
          CaseType.Success,
          "an array of multi language values",
          [{ [givenFallbackDbKeyName]: "Chef", fr: "Chef" }],
          undefined,
        ],
        [
          CaseType.Failure,
          "an array with an item translated in a language that is not in the registry",
          [{ [givenFallbackDbKeyName]: "Chef", tlh: "nuqneH" }],
          constructSchemaError("/altLabels/0", "additionalProperties", "must NOT have additional properties"),
        ],
      ])("(%s) Validate 'altLabels' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("altLabels", { altLabels: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'definition'", () => {
      testPatchTranslatedStringField("definition", SkillConstants.DEFINITION_MAX_LENGTH);
    });

    describe("Test validation of 'description'", () => {
      testPatchTranslatedStringField("description", SkillConstants.DESCRIPTION_MAX_LENGTH);
    });

    describe("Test validation of 'scopeNote'", () => {
      testPatchTranslatedStringField("scopeNote", SkillConstants.SCOPE_NOTE_MAX_LENGTH);
    });

    describe("Test validation of 'skillType'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/skillType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "None value",
          SkillEnums.SkillType.None,
          constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "invalid",
          "invalidType",
          constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "a valid skillType", SkillEnums.SkillType.SkillCompetence, undefined],
      ])("(%s) Validate 'skillType' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("skillType", { skillType: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'reuseLevel'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/reuseLevel", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/reuseLevel", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "None value",
          SkillEnums.ReuseLevel.None,
          constructSchemaError("/reuseLevel", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "invalid",
          "invalidLevel",
          constructSchemaError("/reuseLevel", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "a valid reuseLevel", SkillEnums.ReuseLevel.CrossSector, undefined],
      ])("(%s) Validate 'reuseLevel' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("reuseLevel", { reuseLevel: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'modelId'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/modelId", "type", "must be string")],
        [
          CaseType.Failure,
          "invalid ObjectId",
          "not-a-valid-id",
          constructSchemaError("/modelId", "pattern", `must match pattern "${RegExp_Str_ID}"`),
        ],
        [CaseType.Success, "a valid ObjectId", getMockId(1), undefined],
      ])("(%s) Validate 'modelId' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("modelId", { modelId: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'isLocalized'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined],
        [CaseType.Failure, "string", "true", constructSchemaError("/isLocalized", "type", "must be boolean")],
        [CaseType.Failure, "number", 1, constructSchemaError("/isLocalized", "type", "must be boolean")],
      ])("(%s) Validate 'isLocalized' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("isLocalized", { isLocalized: value }, givenSchema, caseType, failure);
      });
    });
  });
});
