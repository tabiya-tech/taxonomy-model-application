import { randomUUID } from "crypto";
import {
  testNonEmptyStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testTimestampField,
  testUUIDField,
  testValidSchema,
  testUUIDArray,
  testNonEmptyURIStringField,
} from "_test_utilities/stdSchemaTests";

import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import {
  getStdNonEmptyStringTestCases,
  getStdObjectIdTestCases,
  getStdUUIDTestCases,
} from "_test_utilities/stdSchemaTestCases";
import SkillAPISpecs from "./index";
import SkillConstants from "./constants";
import SkillEnums from "./enums";
import SkillGroupRegexes from "../skillGroup/regex";
import SkillGroupConstants from "../skillGroup/constants";
import { getTestSkillGroupCode } from "../_test_utilities/testUtils";

describe("Test Skill POST Response Schema Validity", () => {
  // WHEN the SkillAPISpecs.Schemas.POST.Response.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillAPISpecs.Schemas.POST.Response.Payload", SkillAPISpecs.Schemas.POST.Response.Payload);
});

describe("Test objects against the SkillAPISpecs.Schemas.POST.Response.Payload schema", () => {
  // GIVEN a valid parent response payload object
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.ObjectTypes.SkillGroup,
    code: getTestSkillGroupCode(),
  };

  // GIVEN a valid child response payload object
  const givenChild = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.ObjectTypes.Skill,
    isLocalized: true,
  };

  // GIVEN a valid skill POST response payload object
  const givenValidSkillPOSTResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    UUIDHistory: [],
    originUUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    preferredLabel: getTestString(20),
    originUri: "https://foo/bar",
    altLabels: [getTestString(15), getTestString(25)],
    definition: getTestString(50),
    description: getTestString(50),
    scopeNote: getTestString(30),
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    modelId: getMockId(1),
    isLocalized: true,
    parent: givenParent,
    children: [givenChild],
    requiresSkills: [
      {
        id: getMockId(2),
        UUID: randomUUID(),
        preferredLabel: getTestString(20),
        isLocalized: true,
        objectType: SkillEnums.ObjectTypes.Skill,
        relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
      },
    ],
    requiredBySkills: [
      {
        id: getMockId(3),
        UUID: randomUUID(),
        preferredLabel: getTestString(20),
        isLocalized: false,
        objectType: SkillEnums.ObjectTypes.Skill,
        relationType: SkillEnums.SkillToSkillRelationType.OPTIONAL,
      },
    ],
    requiredByOccupations: [
      {
        id: getMockId(4),
        UUID: randomUUID(),
        preferredLabel: getTestString(20),
        isLocalized: true,
        objectType: SkillEnums.OccupationObjectTypes.ESCOOccupation,
        relationType: "essential",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Test with a valid response
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.POST.Response.Payload",
    SkillAPISpecs.Schemas.POST.Response.Payload,
    givenValidSkillPOSTResponse
  );

  // Test with additional properties in the response
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.POST.Response.Payload",
    SkillAPISpecs.Schemas.POST.Response.Payload,
    {
      ...givenValidSkillPOSTResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.POST.Response.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.POST.Response.Payload;

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", givenSchema);
    });

    describe("Test validation of 'UUID'", () => {
      testUUIDField<SkillAPISpecs.Types.POST.Response.Payload>("UUID", givenSchema);
    });

    describe("Test validation of 'originUUID'", () => {
      testUUIDField<SkillAPISpecs.Types.POST.Response.Payload>("originUUID", givenSchema);
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<SkillAPISpecs.Types.POST.Response.Payload>("UUIDHistory", givenSchema, [], true, true);
    });

    describe("Test validation of 'path'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'path'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/path", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          [
            constructSchemaError("/path", "pattern", `must match pattern "^https://.*"`),
            constructSchemaError("/path", "format", 'must match format "uri"'),
          ],
        ],
        [
          CaseType.Failure,
          "only whitespace characters",
          "   ",
          [
            constructSchemaError("/path", "pattern", `must match pattern "^https://.*"`),
            constructSchemaError("/path", "format", 'must match format "uri"'),
          ],
        ],
        [
          CaseType.Failure,
          "too long",
          getTestString(SkillAPISpecs.Constants.PATH_URI_MAX_LENGTH + 1),
          constructSchemaError(
            "/path",
            "maxLength",
            `must NOT have more than ${SkillAPISpecs.Constants.PATH_URI_MAX_LENGTH} characters`
          ),
        ],
        [
          CaseType.Failure,
          "invalid URI",
          "invalid uri",
          constructSchemaError("/path", "format", 'must match format "uri"'),
        ],
        [
          CaseType.Failure,
          "URI without https",
          "http://example.com",
          constructSchemaError("/path", "pattern", `must match pattern "^https://.*"`),
        ],
        [CaseType.Success, "valid URI", "https://example.com/path", undefined],
        [
          CaseType.Failure,
          "valid URN",
          "urn:ietf:rfc:3986",
          constructSchemaError("/path", "pattern", `must match pattern "^https://.*"`),
        ],
      ])("%s Validate path when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidSkillPOSTResponse,
          path: givenValue,
        };
        assertCaseForProperty("path", givenObject, givenSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField("originUri", SkillAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH, givenSchema);
    });

    describe("Test validation of 'preferredLabel'", () => {
      testNonEmptyStringField<SkillAPISpecs.Types.POST.Response.Payload>(
        "preferredLabel",
        SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        givenSchema
      );
    });

    describe("Test validation of 'description'", () => {
      testStringField<SkillAPISpecs.Types.POST.Response.Payload>(
        "description",
        SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        givenSchema
      );
    });

    describe("Test validation of 'definition'", () => {
      testStringField<SkillAPISpecs.Types.POST.Response.Payload>(
        "definition",
        SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH,
        givenSchema
      );
    });

    describe("Test validation of 'scopeNote'", () => {
      testStringField<SkillAPISpecs.Types.POST.Response.Payload>(
        "scopeNote",
        SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH,
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
      ])("(%s) Validate 'altLabels' when %s", (caseType, _desc, value, failure) => {
        assertCaseForProperty("altLabels", { altLabels: value }, givenSchema, caseType, failure);
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
          ...givenValidSkillPOSTResponse,
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
          ...givenValidSkillPOSTResponse,
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

    describe("Test validation of 'parent'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'parent'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/parent", "type", "must be object")],
        [CaseType.Failure, "a string", "foo", constructSchemaError("/parent", "type", "must be object")],
        [CaseType.Failure, "an array", ["foo", "bar"], constructSchemaError("/parent", "type", "must be object")],
        [CaseType.Success, "a valid parent object", givenValidSkillPOSTResponse.parent, undefined],
        [
          CaseType.Failure,
          "parent object missing code",
          {
            id: getMockId(1),
            UUID: randomUUID(),
            preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
            objectType: SkillEnums.ObjectTypes.SkillGroup,
          },
          constructSchemaError("/parent", "required", "must have required property 'code'"),
        ],
        [
          CaseType.Failure,
          "parent object missing id",
          {
            UUID: randomUUID(),
            preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
            objectType: SkillEnums.ObjectTypes.SkillGroup,
            code: getTestSkillGroupCode(SkillGroupConstants.CODE_MAX_LENGTH),
          },
          constructSchemaError("/parent", "required", "must have required property 'id'"),
        ],
        [
          CaseType.Failure,
          "parent object missing UUID",
          {
            id: getMockId(1),
            preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
            objectType: SkillEnums.ObjectTypes.SkillGroup,
            code: getTestSkillGroupCode(SkillGroupConstants.CODE_MAX_LENGTH),
          },
          constructSchemaError("/parent", "required", "must have required property 'UUID'"),
        ],
        [
          CaseType.Failure,
          "parent object missing preferredLabel",
          {
            id: getMockId(1),
            UUID: randomUUID(),
            objectType: SkillEnums.ObjectTypes.SkillGroup,
            code: getTestSkillGroupCode(SkillGroupConstants.CODE_MAX_LENGTH),
          },
          constructSchemaError("/parent", "required", "must have required property 'preferredLabel'"),
        ],
        [
          CaseType.Failure,
          "parent object missing objectType",
          {
            id: getMockId(1),
            UUID: randomUUID(),
            preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
            code: getTestSkillGroupCode(SkillGroupConstants.CODE_MAX_LENGTH),
          },
          constructSchemaError("/parent", "required", "must have required property 'objectType'"),
        ],
      ])("(%s) Validate 'parent' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = {
          ...givenValidSkillPOSTResponse,
          parent: givenValue,
        };
        assertCaseForProperty("parent", givenObject, givenSchema, caseType, failureMessages);
      });
    });

    describe("Test validation of parent fields", () => {
      describe("Test validation of 'parent/id'", () => {
        const testCases = getStdObjectIdTestCases("/parent/id");
        test.each(testCases)(
          `(%s) Validate 'id' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              parent: {
                ...givenParent,
                id: givenValue,
              },
            };
            assertCaseForProperty("/parent/id", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'parent/UUID'", () => {
        const testCases = getStdUUIDTestCases("/parent/UUID");
        test.each(testCases)(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              parent: {
                ...givenParent,
                UUID: givenValue,
              },
            };
            assertCaseForProperty("/parent/UUID", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'parent/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/parent/preferredLabel",
          SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
        );
        test.each(testCases)(
          `(%s) Validate 'preferredLabel' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              parent: {
                ...givenParent,
                preferredLabel: givenValue,
              },
            };
            assertCaseForProperty("/parent/preferredLabel", givenObject, givenSchema, caseType, failureMessage);
          }
        );
      });
      describe("Test validation of 'parent/objectType'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("/parent", "required", "must have required property 'objectType'"),
          ],
          [CaseType.Failure, "null", null, constructSchemaError("/parent/objectType", "type", "must be string")],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError("/parent/objectType", "enum", "must be equal to one of the allowed values"),
          ],
          [
            CaseType.Failure,
            "an invalid objectType",
            "invalidObjectType",
            constructSchemaError("/parent/objectType", "enum", "must be equal to one of the allowed values"),
          ],
          [CaseType.Success, "a valid objectType", SkillEnums.ObjectTypes.SkillGroup, undefined],
        ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            parent: {
              ...givenParent,
              objectType: givenValue,
            },
          };
          assertCaseForProperty("/parent/objectType", givenObject, givenSchema, caseType, failureMessage);
        });
      });
      describe("Test validation of 'parent/code'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("/parent", "required", "must have required property 'code'"),
          ],
          [CaseType.Failure, "null", null, constructSchemaError("/parent/code", "type", "must be string")],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/parent/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "too long",
            getTestString(SkillGroupConstants.CODE_MAX_LENGTH + 1),
            constructSchemaError(
              "/parent/code",
              "maxLength",
              `must NOT have more than ${SkillGroupConstants.CODE_MAX_LENGTH} characters`
            ),
          ],
          [
            CaseType.Failure,
            "invalid pattern - starts with number",
            "1abc",
            constructSchemaError(
              "/parent/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "invalid pattern - special characters",
            "a@bc",
            constructSchemaError(
              "/parent/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
          [CaseType.Success, "valid code with letter and digits", "A123", undefined],
          [CaseType.Success, "valid code with dots", "A1.2.3", undefined],
          [CaseType.Success, "valid single letter", "A", undefined],
        ])("%s Validate 'code' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            parent: {
              ...givenParent,
              code: givenValue,
            },
          };
          assertCaseForProperty("/parent/code", givenObject, givenSchema, caseType, failureMessage);
        });
      });
    });

    describe("Test validation of 'children'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'children'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/children", "type", "must be array")],
        [CaseType.Failure, "a string", "foo", constructSchemaError("/children", "type", "must be array")],
        [
          CaseType.Failure,
          "an array of strings",
          ["foo", "bar"],
          [
            constructSchemaError("/children/0", "type", "must be object"),
            constructSchemaError("/children/1", "type", "must be object"),
          ],
        ],
        [
          CaseType.Success,
          "a valid children object array",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
              objectType: SkillEnums.ObjectTypes.Skill,
              isLocalized: true,
            },
          ],
          undefined,
        ],
        [
          CaseType.Failure,
          "children with Skill missing isLocalized",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              objectType: SkillEnums.ObjectTypes.Skill,
            },
          ],
          [
            constructSchemaError("/children/0", "required", "must have required property 'isLocalized'"),
            constructSchemaError("/children/0", "if", 'must match "then" schema'),
          ],
        ],
      ])("(%s) Validate 'children' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = {
          ...givenValidSkillPOSTResponse,
          children: givenValue,
        };
        assertCaseForProperty("children", givenObject, givenSchema, caseType, failureMessages);
      });
    });

    describe("Test validation of 'requiresSkills'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'requiresSkills'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/requiresSkills", "type", "must be array")],
        [CaseType.Failure, "a string", "foo", constructSchemaError("/requiresSkills", "type", "must be array")],
        [
          CaseType.Failure,
          "an array of strings",
          ["foo", "bar"],
          [
            constructSchemaError("/requiresSkills/0", "type", "must be object"),
            constructSchemaError("/requiresSkills/1", "type", "must be object"),
          ],
        ],
        [CaseType.Success, "a valid requiresSkills object array", [], undefined],
        [
          CaseType.Failure,
          "requiresSkills with missing id",
          [
            {
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              isLocalized: true,
              objectType: SkillEnums.ObjectTypes.Skill,
              relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
            },
          ],
          constructSchemaError("/requiresSkills/0", "required", "must have required property 'id'"),
        ],
        [
          CaseType.Failure,
          "requiresSkills with missing UUID",
          [
            {
              id: getMockId(1),
              preferredLabel: getTestString(10),
              isLocalized: true,
              objectType: SkillEnums.ObjectTypes.Skill,
              relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
            },
          ],
          constructSchemaError("/requiresSkills/0", "required", "must have required property 'UUID'"),
        ],
        [
          CaseType.Failure,
          "requiresSkills with missing preferredLabel",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              isLocalized: true,
              objectType: SkillEnums.ObjectTypes.Skill,
              relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
            },
          ],
          constructSchemaError("/requiresSkills/0", "required", "must have required property 'preferredLabel'"),
        ],
        [
          CaseType.Failure,
          "requiresSkills with missing isLocalized",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              objectType: SkillEnums.ObjectTypes.Skill,
              relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
            },
          ],
          constructSchemaError("/requiresSkills/0", "required", "must have required property 'isLocalized'"),
        ],
        [
          CaseType.Failure,
          "requiresSkills with missing objectType",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              isLocalized: true,
              relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
            },
          ],
          constructSchemaError("/requiresSkills/0", "required", "must have required property 'objectType'"),
        ],
        [
          CaseType.Failure,
          "requiresSkills with missing relationType",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              isLocalized: true,
              objectType: SkillEnums.ObjectTypes.Skill,
            },
          ],
          constructSchemaError("/requiresSkills/0", "required", "must have required property 'relationType'"),
        ],
      ])("(%s) Validate 'requiresSkills' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = {
          ...givenValidSkillPOSTResponse,
          requiresSkills: givenValue,
        };
        assertCaseForProperty("requiresSkills", givenObject, givenSchema, caseType, failureMessages);
      });
    });

    describe("Test validation of 'requiredBySkills'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'requiredBySkills'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/requiredBySkills", "type", "must be array")],
        [CaseType.Failure, "a string", "foo", constructSchemaError("/requiredBySkills", "type", "must be array")],
        [
          CaseType.Failure,
          "an array of strings",
          ["foo", "bar"],
          [
            constructSchemaError("/requiredBySkills/0", "type", "must be object"),
            constructSchemaError("/requiredBySkills/1", "type", "must be object"),
          ],
        ],
        [CaseType.Success, "a valid requiredBySkills object array", [], undefined],
        [
          CaseType.Failure,
          "requiredBySkills with missing id",
          [
            {
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              isLocalized: true,
              objectType: SkillEnums.ObjectTypes.Skill,
              relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
            },
          ],
          constructSchemaError("/requiredBySkills/0", "required", "must have required property 'id'"),
        ],
        [
          CaseType.Failure,
          "requiredBySkills with missing UUID",
          [
            {
              id: getMockId(1),
              preferredLabel: getTestString(10),
              isLocalized: true,
              objectType: SkillEnums.ObjectTypes.Skill,
              relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
            },
          ],
          constructSchemaError("/requiredBySkills/0", "required", "must have required property 'UUID'"),
        ],
        [
          CaseType.Failure,
          "requiredBySkills with missing preferredLabel",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              isLocalized: true,
              objectType: SkillEnums.ObjectTypes.Skill,
              relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
            },
          ],
          constructSchemaError("/requiredBySkills/0", "required", "must have required property 'preferredLabel'"),
        ],
        [
          CaseType.Failure,
          "requiredBySkills with missing isLocalized",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              objectType: SkillEnums.ObjectTypes.Skill,
              relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
            },
          ],
          constructSchemaError("/requiredBySkills/0", "required", "must have required property 'isLocalized'"),
        ],
        [
          CaseType.Failure,
          "requiredBySkills with missing objectType",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              isLocalized: true,
              relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
            },
          ],
          constructSchemaError("/requiredBySkills/0", "required", "must have required property 'objectType'"),
        ],
        [
          CaseType.Failure,
          "requiredBySkills with missing relationType",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              isLocalized: true,
              objectType: SkillEnums.ObjectTypes.Skill,
            },
          ],
          constructSchemaError("/requiredBySkills/0", "required", "must have required property 'relationType'"),
        ],
      ])("(%s) Validate 'requiredBySkills' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = {
          ...givenValidSkillPOSTResponse,
          requiredBySkills: givenValue,
        };
        assertCaseForProperty("requiredBySkills", givenObject, givenSchema, caseType, failureMessages);
      });
    });

    describe("Test validation of 'requiredByOccupations'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'requiredByOccupations'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/requiredByOccupations", "type", "must be array")],
        [CaseType.Failure, "a string", "foo", constructSchemaError("/requiredByOccupations", "type", "must be array")],
        [
          CaseType.Failure,
          "an array of strings",
          ["foo", "bar"],
          [
            constructSchemaError("/requiredByOccupations/0", "type", "must be object"),
            constructSchemaError("/requiredByOccupations/1", "type", "must be object"),
          ],
        ],
        [CaseType.Success, "a valid requiredByOccupations object array", [], undefined],
        [
          CaseType.Failure,
          "requiredByOccupations with missing id",
          [
            {
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              isLocalized: true,
              objectType: SkillEnums.OccupationObjectTypes.ESCOOccupation,
            },
          ],
          constructSchemaError("/requiredByOccupations/0", "required", "must have required property 'id'"),
        ],
        [
          CaseType.Failure,
          "requiredByOccupations with missing UUID",
          [
            {
              id: getMockId(1),
              preferredLabel: getTestString(10),
              isLocalized: true,
              objectType: SkillEnums.OccupationObjectTypes.ESCOOccupation,
            },
          ],
          constructSchemaError("/requiredByOccupations/0", "required", "must have required property 'UUID'"),
        ],
        [
          CaseType.Failure,
          "requiredByOccupations with missing preferredLabel",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              isLocalized: true,
              objectType: SkillEnums.OccupationObjectTypes.ESCOOccupation,
            },
          ],
          constructSchemaError("/requiredByOccupations/0", "required", "must have required property 'preferredLabel'"),
        ],
        [
          CaseType.Failure,
          "requiredByOccupations with missing isLocalized",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              objectType: SkillEnums.OccupationObjectTypes.ESCOOccupation,
            },
          ],
          constructSchemaError("/requiredByOccupations/0", "required", "must have required property 'isLocalized'"),
        ],
        [
          CaseType.Failure,
          "requiredByOccupations with missing objectType",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              preferredLabel: getTestString(10),
              isLocalized: true,
            },
          ],
          constructSchemaError("/requiredByOccupations/0", "required", "must have required property 'objectType'"),
        ],
      ])(
        "(%s) Validate 'requiredByOccupations' when it is %s",
        (caseType, _description, givenValue, failureMessages) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiredByOccupations: givenValue,
          };
          assertCaseForProperty("requiredByOccupations", givenObject, givenSchema, caseType, failureMessages);
        }
      );
    });

    describe("Test validation of requiresSkills fields", () => {
      describe("Test validation of 'requiresSkills/id'", () => {
        const testCases = getStdObjectIdTestCases("/requiresSkills/0/id");
        test.each(testCases)(
          `(%s) Validate 'id' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              requiresSkills: [
                {
                  ...givenValidSkillPOSTResponse.requiresSkills[0],
                  id: givenValue,
                },
              ],
            };
            assertCaseForProperty("/requiresSkills/0/id", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'requiresSkills/UUID'", () => {
        const testCases = getStdUUIDTestCases("/requiresSkills/0/UUID");
        test.each(testCases)(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              requiresSkills: [
                {
                  ...givenValidSkillPOSTResponse.requiresSkills[0],
                  UUID: givenValue,
                },
              ],
            };
            assertCaseForProperty("/requiresSkills/0/UUID", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'requiresSkills/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/requiresSkills/0/preferredLabel",
          SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
        );
        test.each(testCases)(
          `(%s) Validate 'preferredLabel' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              requiresSkills: [
                {
                  ...givenValidSkillPOSTResponse.requiresSkills[0],
                  preferredLabel: givenValue,
                },
              ],
            };
            assertCaseForProperty(
              "/requiresSkills/0/preferredLabel",
              givenObject,
              givenSchema,
              caseType,
              failureMessage
            );
          }
        );
      });
      describe("Test validation of 'requiresSkills/isLocalized'", () => {
        test.each([
          [CaseType.Success, "true", true, undefined],
          [CaseType.Success, "false", false, undefined],
          [
            CaseType.Failure,
            "null",
            null,
            constructSchemaError("/requiresSkills/0/isLocalized", "type", "must be boolean"),
          ],
          [
            CaseType.Failure,
            "string",
            "true",
            constructSchemaError("/requiresSkills/0/isLocalized", "type", "must be boolean"),
          ],
        ])("%s Validate 'isLocalized' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiresSkills: [
              {
                ...givenValidSkillPOSTResponse.requiresSkills[0],
                isLocalized: givenValue,
              },
            ],
          };
          assertCaseForProperty("/requiresSkills/0/isLocalized", givenObject, givenSchema, caseType, failureMessage);
        });
      });
      describe("Test validation of 'requiresSkills/objectType'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("/requiresSkills/0", "required", "must have required property 'objectType'"),
          ],
          [
            CaseType.Failure,
            "null",
            null,
            constructSchemaError("/requiresSkills/0/objectType", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError("/requiresSkills/0/objectType", "enum", "must be equal to one of the allowed values"),
          ],
          [
            CaseType.Failure,
            "an invalid objectType",
            "invalidObjectType",
            constructSchemaError("/requiresSkills/0/objectType", "enum", "must be equal to one of the allowed values"),
          ],
          [CaseType.Success, "a valid objectType", SkillEnums.ObjectTypes.Skill, undefined],
        ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiresSkills: [
              {
                ...givenValidSkillPOSTResponse.requiresSkills[0],
                objectType: givenValue,
              },
            ],
          };
          assertCaseForProperty("/requiresSkills/0/objectType", givenObject, givenSchema, caseType, failureMessage);
        });
      });
      describe("Test validation of 'requiresSkills/relationType'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("/requiresSkills/0", "required", "must have required property 'relationType'"),
          ],
          [
            CaseType.Failure,
            "null",
            null,
            constructSchemaError("/requiresSkills/0/relationType", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/requiresSkills/0/relationType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [
            CaseType.Failure,
            "an invalid relationType",
            "invalidRelationType",
            constructSchemaError(
              "/requiresSkills/0/relationType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [CaseType.Success, "a valid relationType", SkillEnums.SkillToSkillRelationType.ESSENTIAL, undefined],
          [CaseType.Success, "a valid relationType", SkillEnums.SkillToSkillRelationType.OPTIONAL, undefined],
        ])("%s Validate 'relationType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiresSkills: [
              {
                ...givenValidSkillPOSTResponse.requiresSkills[0],
                relationType: givenValue,
              },
            ],
          };
          assertCaseForProperty("/requiresSkills/0/relationType", givenObject, givenSchema, caseType, failureMessage);
        });
      });
    });

    describe("Test validation of requiredBySkills fields", () => {
      describe("Test validation of 'requiredBySkills/id'", () => {
        const testCases = getStdObjectIdTestCases("/requiredBySkills/0/id");
        test.each(testCases)(
          `(%s) Validate 'id' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              requiredBySkills: [
                {
                  ...givenValidSkillPOSTResponse.requiredBySkills[0],
                  id: givenValue,
                },
              ],
            };
            assertCaseForProperty("/requiredBySkills/0/id", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'requiredBySkills/UUID'", () => {
        const testCases = getStdUUIDTestCases("/requiredBySkills/0/UUID");
        test.each(testCases)(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              requiredBySkills: [
                {
                  ...givenValidSkillPOSTResponse.requiredBySkills[0],
                  UUID: givenValue,
                },
              ],
            };
            assertCaseForProperty("/requiredBySkills/0/UUID", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'requiredBySkills/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/requiredBySkills/0/preferredLabel",
          SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
        );
        test.each(testCases)(
          `(%s) Validate 'preferredLabel' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              requiredBySkills: [
                {
                  ...givenValidSkillPOSTResponse.requiredBySkills[0],
                  preferredLabel: givenValue,
                },
              ],
            };
            assertCaseForProperty(
              "/requiredBySkills/0/preferredLabel",
              givenObject,
              givenSchema,
              caseType,
              failureMessage
            );
          }
        );
      });
      describe("Test validation of 'requiredBySkills/isLocalized'", () => {
        test.each([
          [CaseType.Success, "true", true, undefined],
          [CaseType.Success, "false", false, undefined],
          [
            CaseType.Failure,
            "null",
            null,
            constructSchemaError("/requiredBySkills/0/isLocalized", "type", "must be boolean"),
          ],
          [
            CaseType.Failure,
            "string",
            "true",
            constructSchemaError("/requiredBySkills/0/isLocalized", "type", "must be boolean"),
          ],
        ])("%s Validate 'isLocalized' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiredBySkills: [
              {
                ...givenValidSkillPOSTResponse.requiredBySkills[0],
                isLocalized: givenValue,
              },
            ],
          };
          assertCaseForProperty("/requiredBySkills/0/isLocalized", givenObject, givenSchema, caseType, failureMessage);
        });
      });
      describe("Test validation of 'requiredBySkills/objectType'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("/requiredBySkills/0", "required", "must have required property 'objectType'"),
          ],
          [
            CaseType.Failure,
            "null",
            null,
            constructSchemaError("/requiredBySkills/0/objectType", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/requiredBySkills/0/objectType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [
            CaseType.Failure,
            "an invalid objectType",
            "invalidObjectType",
            constructSchemaError(
              "/requiredBySkills/0/objectType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [CaseType.Success, "a valid objectType", SkillEnums.ObjectTypes.Skill, undefined],
        ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiredBySkills: [
              {
                ...givenValidSkillPOSTResponse.requiredBySkills[0],
                objectType: givenValue,
              },
            ],
          };
          assertCaseForProperty("/requiredBySkills/0/objectType", givenObject, givenSchema, caseType, failureMessage);
        });
      });
      describe("Test validation of 'requiredBySkills/relationType'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("/requiredBySkills/0", "required", "must have required property 'relationType'"),
          ],
          [
            CaseType.Failure,
            "null",
            null,
            constructSchemaError("/requiredBySkills/0/relationType", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/requiredBySkills/0/relationType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [
            CaseType.Failure,
            "an invalid relationType",
            "invalidRelationType",
            constructSchemaError(
              "/requiredBySkills/0/relationType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [CaseType.Success, "a valid relationType", SkillEnums.SkillToSkillRelationType.ESSENTIAL, undefined],
          [CaseType.Success, "a valid relationType", SkillEnums.SkillToSkillRelationType.OPTIONAL, undefined],
        ])("%s Validate 'relationType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiredBySkills: [
              {
                ...givenValidSkillPOSTResponse.requiredBySkills[0],
                relationType: givenValue,
              },
            ],
          };
          assertCaseForProperty("/requiredBySkills/0/relationType", givenObject, givenSchema, caseType, failureMessage);
        });
      });
    });

    describe("Test validation of requiredByOccupations fields", () => {
      describe("Test validation of 'requiredByOccupations/id'", () => {
        const testCases = getStdObjectIdTestCases("/requiredByOccupations/0/id");
        test.each(testCases)(
          `(%s) Validate 'id' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              requiredByOccupations: [
                {
                  ...givenValidSkillPOSTResponse.requiredByOccupations[0],
                  id: givenValue,
                },
              ],
            };
            assertCaseForProperty("/requiredByOccupations/0/id", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'requiredByOccupations/UUID'", () => {
        const testCases = getStdUUIDTestCases("/requiredByOccupations/0/UUID");
        test.each(testCases)(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              requiredByOccupations: [
                {
                  ...givenValidSkillPOSTResponse.requiredByOccupations[0],
                  UUID: givenValue,
                },
              ],
            };
            assertCaseForProperty("/requiredByOccupations/0/UUID", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'requiredByOccupations/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/requiredByOccupations/0/preferredLabel",
          SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
        );
        test.each(testCases)(
          `(%s) Validate 'preferredLabel' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              requiredByOccupations: [
                {
                  ...givenValidSkillPOSTResponse.requiredByOccupations[0],
                  preferredLabel: givenValue,
                },
              ],
            };
            assertCaseForProperty(
              "/requiredByOccupations/0/preferredLabel",
              givenObject,
              givenSchema,
              caseType,
              failureMessage
            );
          }
        );
      });
      describe("Test validation of 'requiredByOccupations/isLocalized'", () => {
        test.each([
          [CaseType.Success, "true", true, undefined],
          [CaseType.Success, "false", false, undefined],
          [
            CaseType.Failure,
            "null",
            null,
            constructSchemaError("/requiredByOccupations/0/isLocalized", "type", "must be boolean"),
          ],
          [
            CaseType.Failure,
            "string",
            "true",
            constructSchemaError("/requiredByOccupations/0/isLocalized", "type", "must be boolean"),
          ],
        ])("%s Validate 'isLocalized' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiredByOccupations: [
              {
                ...givenValidSkillPOSTResponse.requiredByOccupations[0],
                isLocalized: givenValue,
              },
            ],
          };
          assertCaseForProperty(
            "/requiredByOccupations/0/isLocalized",
            givenObject,
            givenSchema,
            caseType,
            failureMessage
          );
        });
      });
      describe("Test validation of 'requiredByOccupations/objectType'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("/requiredByOccupations/0", "required", "must have required property 'objectType'"),
          ],
          [
            CaseType.Failure,
            "null",
            null,
            constructSchemaError("/requiredByOccupations/0/objectType", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/requiredByOccupations/0/objectType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [
            CaseType.Failure,
            "an invalid objectType",
            "invalidObjectType",
            constructSchemaError(
              "/requiredByOccupations/0/objectType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [CaseType.Success, "a valid objectType", SkillEnums.OccupationObjectTypes.ESCOOccupation, undefined],
        ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiredByOccupations: [
              {
                ...givenValidSkillPOSTResponse.requiredByOccupations[0],
                objectType: givenValue,
              },
            ],
          };
          assertCaseForProperty(
            "/requiredByOccupations/0/objectType",
            givenObject,
            givenSchema,
            caseType,
            failureMessage
          );
        });
      });
      describe("Test validation of 'requiredByOccupations/relationType'", () => {
        test.each([
          [CaseType.Success, "undefined", undefined, undefined],
          [
            CaseType.Failure,
            "null",
            null,
            constructSchemaError(
              "/requiredByOccupations/0/relationType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/requiredByOccupations/0/relationType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [
            CaseType.Failure,
            "an invalid relationType",
            "invalidRelationType",
            constructSchemaError(
              "/requiredByOccupations/0/relationType",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [CaseType.Success, "a valid relationType", "essential", undefined],
        ])("%s Validate 'relationType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiredByOccupations: [
              {
                ...givenValidSkillPOSTResponse.requiredByOccupations[0],
                relationType: givenValue,
              },
            ],
          };
          assertCaseForProperty(
            "/requiredByOccupations/0/relationType",
            givenObject,
            givenSchema,
            caseType,
            failureMessage
          );
        });
      });
      describe("Test validation of 'requiredByOccupations/signallingValue'", () => {
        test.each([
          [CaseType.Success, "undefined", undefined, undefined],
          [CaseType.Success, "null", null, undefined],
          [
            CaseType.Failure,
            "string",
            "1",
            constructSchemaError("/requiredByOccupations/0/signallingValue", "type", "must be number,null"),
          ],
          [
            CaseType.Failure,
            "below min",
            SkillConstants.SIGNALLING_VALUE_MIN - 1,
            constructSchemaError(
              "/requiredByOccupations/0/signallingValue",
              "minimum",
              `must be >= ${SkillConstants.SIGNALLING_VALUE_MIN}`
            ),
          ],
          [
            CaseType.Failure,
            "above max",
            SkillConstants.SIGNALLING_VALUE_MAX + 1,
            constructSchemaError(
              "/requiredByOccupations/0/signallingValue",
              "maximum",
              `must be <= ${SkillConstants.SIGNALLING_VALUE_MAX}`
            ),
          ],
          [CaseType.Success, "min", SkillConstants.SIGNALLING_VALUE_MIN, undefined],
          [CaseType.Success, "max", SkillConstants.SIGNALLING_VALUE_MAX, undefined],
        ])("%s Validate 'signallingValue' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillPOSTResponse,
            requiredByOccupations: [
              {
                ...givenValidSkillPOSTResponse.requiredByOccupations[0],
                signallingValue: givenValue,
              },
            ],
          };
          assertCaseForProperty(
            "/requiredByOccupations/0/signallingValue",
            givenObject,
            givenSchema,
            caseType,
            failureMessage
          );
        });
      });
      describe("Test validation of 'requiredByOccupations/signallingValueLabel'", () => {
        test.each([
          [CaseType.Success, "undefined", undefined, undefined],
          [
            CaseType.Failure,
            "null",
            null,
            constructSchemaError(
              "/requiredByOccupations/0/signallingValueLabel",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [
            CaseType.Failure,
            "number",
            1,
            constructSchemaError("/requiredByOccupations/0/signallingValueLabel", "type", "must be string,null"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/requiredByOccupations/0/signallingValueLabel",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [
            CaseType.Failure,
            "invalid label",
            "invalid",
            constructSchemaError(
              "/requiredByOccupations/0/signallingValueLabel",
              "enum",
              "must be equal to one of the allowed values"
            ),
          ],
          [CaseType.Success, "a valid label", SkillEnums.SignallingValueLabel.HIGH, undefined],
        ])(
          "%s Validate 'signallingValueLabel' when it is %s",
          (caseType, __description, givenValue, failureMessage) => {
            const givenObject = {
              ...givenValidSkillPOSTResponse,
              requiredByOccupations: [
                {
                  ...givenValidSkillPOSTResponse.requiredByOccupations[0],
                  signallingValueLabel: givenValue,
                },
              ],
            };
            assertCaseForProperty(
              "/requiredByOccupations/0/signallingValueLabel",
              givenObject,
              givenSchema,
              caseType,
              failureMessage
            );
          }
        );
      });
    });

    describe("Test validation of 'createdAt'", () => {
      testTimestampField<SkillAPISpecs.Types.POST.Response.Payload>("createdAt", givenSchema);
    });

    describe("Test validation of 'updatedAt'", () => {
      testTimestampField<SkillAPISpecs.Types.POST.Response.Payload>("updatedAt", givenSchema);
    });
  });
});
