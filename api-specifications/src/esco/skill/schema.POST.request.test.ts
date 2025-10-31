import {
  testNonEmptyStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testUUIDArray,
  testValidSchema,
  testNonEmptyURIStringField,
} from "_test_utilities/stdSchemaTests";

import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import SkillAPISpecs from "./index";
import SkillEnums from "./enums";

describe("Test Skill POST Request Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.POST.Request.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillAPISpecs.Schemas.POST.Request.Payload", SkillAPISpecs.Schemas.POST.Request.Payload);
});

describe("Test objects against the SkillAPISpecs.Schemas.POST.Request.Payload schema", () => {
  // GIVEN a valid skill POST request payload object
  const givenValidSkillPOSTRequest = {
    UUIDHistory: [],
    originUri: "https://foo/bar",
    preferredLabel: getTestString(20),
    altLabels: [getTestString(15), getTestString(25)],
    definition: getTestString(50),
    description: getTestString(50),
    scopeNote: getTestString(30),
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    modelId: getMockId(1),
    isLocalized: true,
  };

  // Test with a valid request
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.POST.Request.Payload",
    SkillAPISpecs.Schemas.POST.Request.Payload,
    givenValidSkillPOSTRequest
  );

  // Test with additional properties in the request
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.POST.Request.Payload",
    SkillAPISpecs.Schemas.POST.Request.Payload,
    {
      ...givenValidSkillPOSTRequest,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.POST.Request.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.POST.Request.Payload;

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<SkillAPISpecs.Types.POST.Request.Payload>("UUIDHistory", givenSchema, [], true, true);
    });

    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField("originUri", SkillAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH, givenSchema);
    });

    describe("Test validation of 'preferredLabel'", () => {
      testNonEmptyStringField<SkillAPISpecs.Types.POST.Request.Payload>(
        "preferredLabel",
        SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        givenSchema
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
            getTestString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1),
          ],
          undefined,
        ],
      ])("(%s) Validate 'altLabels' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          altLabels: givenValue,
        };
        assertCaseForProperty("altLabels", givenObject, givenSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of 'definition'", () => {
      testStringField<SkillAPISpecs.Types.POST.Request.Payload>(
        "definition",
        SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH,
        givenSchema
      );
    });

    describe("Test validation of 'description'", () => {
      testStringField<SkillAPISpecs.Types.POST.Request.Payload>(
        "description",
        SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        givenSchema
      );
    });

    describe("Test validation of 'scopeNote'", () => {
      testStringField<SkillAPISpecs.Types.POST.Request.Payload>(
        "scopeNote",
        SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH,
        givenSchema
      );
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
      ])("%s Validate 'skillType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidSkillPOSTRequest,
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
      ])("%s Validate 'reuseLevel' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidSkillPOSTRequest,
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
      ])("%s Validate 'isLocalized' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        const givenObject = { isLocalized: givenValue };
        assertCaseForProperty("isLocalized", givenObject, givenSchema, caseType, failureMessage);
      });
    });
  });
});
