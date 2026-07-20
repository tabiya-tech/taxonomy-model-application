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
import { RegExp_Str_ID } from "../../../../regex";

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
    preferredLabel: "updated label",
  });

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
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/preferredLabel", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/preferredLabel", "pattern", 'must match pattern "\\S"'),
        ],
        [CaseType.Success, "a valid string", "label", undefined],
      ])("(%s) Validate 'preferredLabel' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("preferredLabel", { preferredLabel: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'altLabels'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/altLabels", "type", "must be array")],
        [CaseType.Failure, "empty string", "", constructSchemaError("/altLabels", "type", "must be array")],
        [
          CaseType.Failure,
          "array of objects",
          [{}, {}],
          [
            constructSchemaError("/altLabels/0", "type", "must be string"),
            constructSchemaError("/altLabels/1", "type", "must be string"),
          ],
        ],
        [CaseType.Success, "an array of valid strings", [getTestString(100), getTestString(50)], undefined],
      ])("(%s) Validate 'altLabels' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("altLabels", { altLabels: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'definition'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/definition", "type", "must be string")],
        [CaseType.Failure, "a number", 123, constructSchemaError("/definition", "type", "must be string")],
        [CaseType.Success, "a valid string", getTestString(100), undefined],
      ])("(%s) Validate 'definition' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("definition", { definition: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'description'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/description", "type", "must be string")],
        [CaseType.Failure, "a number", 123, constructSchemaError("/description", "type", "must be string")],
        [CaseType.Success, "a valid string", getTestString(100), undefined],
      ])("(%s) Validate 'description' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("description", { description: value }, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'scopeNote'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Failure, "null", null, constructSchemaError("/scopeNote", "type", "must be string")],
        [CaseType.Failure, "a number", 123, constructSchemaError("/scopeNote", "type", "must be string")],
        [CaseType.Success, "a valid string", "note", undefined],
      ])("(%s) Validate 'scopeNote' when it is %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("scopeNote", { scopeNote: value }, givenSchema, caseType, failure);
      });
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
