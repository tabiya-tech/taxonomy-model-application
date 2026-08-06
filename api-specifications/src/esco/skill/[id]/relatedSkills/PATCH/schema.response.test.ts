import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
  testNonEmptyStringField,
  testStringField,
  testUUIDField,
  testUUIDArray,
  testNonEmptyURIStringField,
  testURIField,
  testBooleanField,
} from "_test_utilities/stdSchemaTests";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestString } from "../../../../../_test_utilities/specialCharacters";
import SkillAPISpecs from "../../../index";
import SkillEnums from "../../../_shared/enums";
import SkillConstants from "../../../_shared/constants";

describe("SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Response.Payload schema", () => {
  testValidSchema(
    "SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Response.Payload",
    SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Response.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Response.Payload schema", () => {
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.Relations.Parents.ObjectTypes.Skill,
  };

  const givenChild = {
    id: getMockId(2),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.Relations.Children.ObjectTypes.Skill,
    isLocalized: true,
  };

  const givenRelatedSkill = {
    id: getMockId(3),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: false,
    objectType: SkillEnums.ObjectTypes.Skill,
    relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
  };

  const givenValidSkillPATCHResponse = {
    id: getMockId(10),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID(), randomUUID()],
    originUUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    preferredLabel: getTestString(20),
    originUri: "https://foo/bar",
    altLabels: [getTestString(30), getTestString(40)],
    definition: getTestString(100),
    description: getTestString(100),
    scopeNote: getTestString(50),
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    isLocalized: true,
    modelId: getMockId(20),
    parents: [givenParent],
    children: [givenChild],
    requiresSkills: [givenRelatedSkill],
    requiredBySkills: [],
    requiredByOccupations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    relationType: SkillEnums.SkillToSkillRelationType.OPTIONAL,
  };

  testSchemaWithValidObject(
    "valid skill response with all fields",
    SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Response.Payload,
    givenValidSkillPATCHResponse
  );

  testSchemaWithValidObject(
    "valid skill response with empty arrays",
    SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Response.Payload,
    {
      ...givenValidSkillPATCHResponse,
      parents: [],
      children: [],
      altLabels: [],
      requiresSkills: [],
      requiredBySkills: [],
      requiredByOccupations: [],
      UUIDHistory: [],
    }
  );

  testSchemaWithAdditionalProperties(
    "payload with additional properties",
    SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Response.Payload,
    {
      ...givenValidSkillPATCHResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Response.Payload fields", () => {
    const itemSchema = SkillAPISpecs.Skill.RelatedSkills.PATCH.Schemas.Response.Payload;

    describe("Test validation of inherited skill fields", () => {
      describe("Test validation of 'id'", () => {
        testObjectIdField("id", itemSchema);
      });

      describe("Test validation of 'UUID'", () => {
        testUUIDField("UUID", itemSchema);
      });

      describe("Test validation of 'originUUID'", () => {
        testUUIDField("originUUID", itemSchema);
      });

      describe("Test validation of 'UUIDHistory'", () => {
        testUUIDArray("UUIDHistory", itemSchema, [], true, true);
      });

      describe("Test validation of 'path'", () => {
        testURIField("path", SkillConstants.PATH_URI_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'tabiyaPath'", () => {
        testURIField("tabiyaPath", SkillConstants.TABIYA_PATH_URI_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'originUri'", () => {
        testNonEmptyURIStringField("originUri", SkillConstants.ORIGIN_URI_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'preferredLabel'", () => {
        testNonEmptyStringField("preferredLabel", SkillConstants.PREFERRED_LABEL_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'description'", () => {
        testStringField("description", SkillConstants.DESCRIPTION_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'definition'", () => {
        testStringField("definition", SkillConstants.DEFINITION_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'scopeNote'", () => {
        testStringField("scopeNote", SkillConstants.SCOPE_NOTE_MAX_LENGTH, itemSchema);
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
            "array of objects",
            [{}, {}],
            [
              constructSchemaError("/altLabels/0", "type", "must be string"),
              constructSchemaError("/altLabels/1", "type", "must be string"),
            ],
          ],
          [CaseType.Success, "empty array", [], undefined],
          [CaseType.Success, "valid array", [getTestString(15), getTestString(20)], undefined],
        ])("(%s) Validate 'altLabels' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = { ...givenValidSkillPATCHResponse, altLabels: givenValue };
          assertCaseForProperty("altLabels", givenObject, itemSchema, caseType, failureMessage);
        });
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
            "invalid value",
            "invalid",
            constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
          ],
          [
            CaseType.Failure,
            "None value",
            SkillEnums.SkillType.None,
            constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
          ],
          [CaseType.Success, "skill/competence", SkillEnums.SkillType.SkillCompetence, undefined],
          [CaseType.Success, "knowledge", SkillEnums.SkillType.Knowledge, undefined],
          [CaseType.Success, "language", SkillEnums.SkillType.Language, undefined],
          [CaseType.Success, "attitude", SkillEnums.SkillType.Attitude, undefined],
        ])("%s Validate 'skillType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = { ...givenValidSkillPATCHResponse, skillType: givenValue };
          assertCaseForProperty("skillType", givenObject, itemSchema, caseType, failureMessage);
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
            "invalid value",
            "invalid",
            constructSchemaError("/reuseLevel", "enum", "must be equal to one of the allowed values"),
          ],
          [
            CaseType.Failure,
            "None value",
            SkillEnums.ReuseLevel.None,
            constructSchemaError("/reuseLevel", "enum", "must be equal to one of the allowed values"),
          ],
          [CaseType.Success, "cross-sector", SkillEnums.ReuseLevel.CrossSector, undefined],
          [CaseType.Success, "sector-specific", SkillEnums.ReuseLevel.SectorSpecific, undefined],
          [CaseType.Success, "occupation-specific", SkillEnums.ReuseLevel.OccupationSpecific, undefined],
          [CaseType.Success, "transversal", SkillEnums.ReuseLevel.Transversal, undefined],
        ])("%s Validate 'reuseLevel' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = { ...givenValidSkillPATCHResponse, reuseLevel: givenValue };
          assertCaseForProperty("reuseLevel", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'modelId'", () => {
        testObjectIdField("modelId", itemSchema);
      });

      describe("Test validation of 'isLocalized'", () => {
        testBooleanField("isLocalized", itemSchema);
      });
    });

    describe("Test validation of 'relationType'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'relationType'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/relationType", "type", "must be string")],
        [CaseType.Failure, "boolean", true, constructSchemaError("/relationType", "type", "must be string")],
        [CaseType.Failure, "number", 123, constructSchemaError("/relationType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/relationType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "invalid string",
          "invalid",
          constructSchemaError("/relationType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "essential", SkillEnums.SkillToSkillRelationType.ESSENTIAL, undefined],
        [CaseType.Success, "optional", SkillEnums.SkillToSkillRelationType.OPTIONAL, undefined],
      ])("%s Validate 'relationType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = { ...givenValidSkillPATCHResponse, relationType: givenValue };
        assertCaseForProperty("relationType", givenObject, itemSchema, caseType, failureMessage);
      });
    });
  });
});
