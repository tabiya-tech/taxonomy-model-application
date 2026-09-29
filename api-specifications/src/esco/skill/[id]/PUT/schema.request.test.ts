import {
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testUUIDArray,
  testValidSchema,
  testNonEmptyURIStringField,
} from "_test_utilities/stdSchemaTests";

import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import SkillAPISpecs from "../../index";
import SkillEnums from "../../_shared/enums";
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
      SkillAPISpecs.Skill.PUT.Schemas.Request.Payload,
      caseType,
      failure
    );
  });
}

describe("SkillAPISpecs.Skill.PUT.Schemas.Request.Payload schema", () => {
  testValidSchema("SkillAPISpecs.Skill.PUT.Schemas.Request.Payload", SkillAPISpecs.Skill.PUT.Schemas.Request.Payload);
});

describe("Test objects against the SkillAPISpecs.Skill.PUT.Schemas.Request.Payload schema", () => {
  const givenValidSkillPUTRequest = {
    UUIDHistory: [],
    originUri: "https://foo/bar",
    preferredLabel: { [givenFallbackDbKeyName]: getTestString(20) },
    altLabels: [{ [givenFallbackDbKeyName]: getTestString(15) }, { [givenFallbackDbKeyName]: getTestString(25) }],
    definition: { [givenFallbackDbKeyName]: getTestString(50) },
    description: { [givenFallbackDbKeyName]: getTestString(50) },
    scopeNote: { [givenFallbackDbKeyName]: getTestString(30) },
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    modelId: getMockId(1),
    isLocalized: true,
  };

  testSchemaWithValidObject(
    "valid payload",
    SkillAPISpecs.Skill.PUT.Schemas.Request.Payload,
    givenValidSkillPUTRequest
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    SkillAPISpecs.Skill.PUT.Schemas.Request.Payload,
    {
      ...givenValidSkillPUTRequest,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("SkillAPISpecs.Skill.PUT.Schemas.Request.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Skill.PUT.Schemas.Request.Payload;

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<SkillAPISpecs.Types.PUTSkill.Request.Payload>("UUIDHistory", givenSchema, [], true, true);
    });

    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField("originUri", SkillAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH, givenSchema);
    });

    describe("Test validation of 'preferredLabel'", () => {
      testTranslatedStringField("preferredLabel", SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH);
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
          "an array of items missing the fallback language",
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
            { [givenFallbackDbKeyName]: getTestString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) },
            { [givenFallbackDbKeyName]: getTestString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1) },
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
      ])("(%s) Validate 'altLabels' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          altLabels: givenValue,
        };
        assertCaseForProperty("altLabels", givenObject, givenSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of 'definition'", () => {
      testTranslatedStringField("definition", SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH);
    });

    describe("Test validation of 'description'", () => {
      testTranslatedStringField("description", SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH);
    });

    describe("Test validation of 'scopeNote'", () => {
      testTranslatedStringField("scopeNote", SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH);
    });

    describe("Test validation of 'skillType'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'skillType'"),
        ],
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
          "invalid skillType",
          "invalidType",
          constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "a valid skillType (skill/competence)", SkillEnums.SkillType.SkillCompetence, undefined],
        [CaseType.Success, "a valid skillType (knowledge)", SkillEnums.SkillType.Knowledge, undefined],
        [CaseType.Success, "a valid skillType (language)", SkillEnums.SkillType.Language, undefined],
        [CaseType.Success, "a valid skillType (attitude)", SkillEnums.SkillType.Attitude, undefined],
      ])("%s Validate 'skillType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidSkillPUTRequest,
          skillType: givenValue,
        };
        assertCaseForProperty("skillType", givenObject, givenSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of 'reuseLevel'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'reuseLevel'"),
        ],
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
          "invalid reuseLevel",
          "invalidLevel",
          constructSchemaError("/reuseLevel", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "a valid reuseLevel (cross-sector)", SkillEnums.ReuseLevel.CrossSector, undefined],
        [CaseType.Success, "a valid reuseLevel (transversal)", SkillEnums.ReuseLevel.Transversal, undefined],
        [CaseType.Success, "a valid reuseLevel (sector-specific)", SkillEnums.ReuseLevel.SectorSpecific, undefined],
        [
          CaseType.Success,
          "a valid reuseLevel (occupation-specific)",
          SkillEnums.ReuseLevel.OccupationSpecific,
          undefined,
        ],
      ])("%s Validate 'reuseLevel' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidSkillPUTRequest,
          reuseLevel: givenValue,
        };
        assertCaseForProperty("reuseLevel", givenObject, givenSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", givenSchema);
    });

    describe("Test validation of 'isLocalized'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'isLocalized'"),
        ],
        [
          CaseType.Failure,
          "string instead of boolean",
          "true",
          constructSchemaError("/isLocalized", "type", "must be boolean"),
        ],
        [CaseType.Success, "true", true, undefined],
        [CaseType.Success, "false", false, undefined],
      ])("%s Validate 'isLocalized' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = { isLocalized: givenValue };
        assertCaseForProperty("isLocalized", givenObject, givenSchema, caseType, failureMessage);
      });
    });
  });
});
