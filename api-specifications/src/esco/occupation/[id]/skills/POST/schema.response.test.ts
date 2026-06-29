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
  testTimestampField,
  testURIField,
  testBooleanField,
} from "_test_utilities/stdSchemaTests";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getTestString } from "../../../../../_test_utilities/specialCharacters";
import {
  getStdNonEmptyStringTestCases,
  getStdObjectIdTestCases,
  getStdUUIDTestCases,
} from "_test_utilities/stdSchemaTestCases";
import OccupationAPISpecs from "../../../index";
import OccupationEnums from "../../../_shared/enums";
import OccupationConstants from "../../../_shared/constants";
import SkillConstants from "../../../../skill/_shared/constants";
import SkillEnums from "../../../../skill/_shared/enums";
import { getTestSkillGroupCode } from "../../../../_test_utilities/testUtils";

describe("OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload schema", () => {
  testValidSchema(
    "OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload schema", () => {
  const givenParent = {
    id: getMockId(2),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillConstants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.ObjectTypes.SkillGroup,
    code: getTestSkillGroupCode(),
  };

  const givenChild = {
    id: getMockId(3),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillConstants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.ObjectTypes.Skill,
    isLocalized: true,
  };

  const givenValidSkill = {
    id: getMockId(1),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    originUUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    preferredLabel: getTestString(20),
    originUri: "https://foo/bar",
    altLabels: [getTestString(15)],
    definition: getTestString(50),
    description: getTestString(50),
    scopeNote: getTestString(30),
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    modelId: getMockId(1),
    isLocalized: true,
    parents: [givenParent],
    children: [givenChild],
    requiresSkills: [],
    requiredBySkills: [],
    requiredByOccupations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValue: 50,
    signallingValueLabel: getTestString(20),
  };

  testSchemaWithValidObject(
    "valid skill response with all fields",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload,
    givenValidSkill
  );

  testSchemaWithValidObject(
    "valid skill response with null relationship metadata",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload,
    { ...givenValidSkill, relationType: null, signallingValue: null, signallingValueLabel: null }
  );

  testSchemaWithValidObject(
    "valid skill response with empty arrays",
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload,
    {
      ...givenValidSkill,
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
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload,
    {
      ...givenValidSkill,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload fields", () => {
    const itemSchema = OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload;

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
          const givenObject = { altLabels: givenValue };
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
            "invalid value",
            "invalid",
            constructSchemaError("/skillType", "enum", "must be equal to one of the allowed values"),
          ],
          [CaseType.Success, "skill/competence", SkillEnums.SkillType.SkillCompetence, undefined],
          [CaseType.Success, "knowledge", SkillEnums.SkillType.Knowledge, undefined],
          [CaseType.Success, "language", SkillEnums.SkillType.Language, undefined],
          [CaseType.Success, "attitude", SkillEnums.SkillType.Attitude, undefined],
        ])("%s Validate 'skillType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = { ...givenValidSkill, skillType: givenValue };
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
            "invalid value",
            "invalid",
            constructSchemaError("/reuseLevel", "enum", "must be equal to one of the allowed values"),
          ],
          [CaseType.Success, "cross-sector", SkillEnums.ReuseLevel.CrossSector, undefined],
          [CaseType.Success, "sector-specific", SkillEnums.ReuseLevel.SectorSpecific, undefined],
          [CaseType.Success, "occupation-specific", SkillEnums.ReuseLevel.OccupationSpecific, undefined],
        ])("%s Validate 'reuseLevel' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = { ...givenValidSkill, reuseLevel: givenValue };
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

    describe("Test validation of relationship metadata fields", () => {
      describe("Test validation of 'relationType'", () => {
        test.each([
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "essential", OccupationEnums.OccupationToSkillRelationType.ESSENTIAL, undefined],
          [CaseType.Success, "optional", OccupationEnums.OccupationToSkillRelationType.OPTIONAL, undefined],
          [
            CaseType.Failure,
            "invalid string",
            "invalid",
            constructSchemaError("/relationType", "enum", "must be equal to one of the allowed values"),
          ],
        ])("%s Validate 'relationType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            relationType: givenValue,
          };
          assertCaseForProperty("relationType", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'signallingValue'", () => {
        test.each([
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "valid number", 50, undefined],
          [CaseType.Success, "minimum", OccupationConstants.SIGNALLING_VALUE_MIN, undefined],
          [CaseType.Success, "maximum", OccupationConstants.SIGNALLING_VALUE_MAX, undefined],
          [
            CaseType.Failure,
            "below minimum",
            OccupationConstants.SIGNALLING_VALUE_MIN - 1,
            constructSchemaError(
              "/signallingValue",
              "minimum",
              `must be >= ${OccupationConstants.SIGNALLING_VALUE_MIN}`
            ),
          ],
          [
            CaseType.Failure,
            "above maximum",
            OccupationConstants.SIGNALLING_VALUE_MAX + 1,
            constructSchemaError(
              "/signallingValue",
              "maximum",
              `must be <= ${OccupationConstants.SIGNALLING_VALUE_MAX}`
            ),
          ],
        ])("%s Validate 'signallingValue' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            signallingValue: givenValue,
          };
          assertCaseForProperty("signallingValue", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'signallingValueLabel'", () => {
        test.each([
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "valid string", getTestString(20), undefined],
          [
            CaseType.Failure,
            "only whitespace",
            "   ",
            constructSchemaError("/signallingValueLabel", "pattern", `must match pattern "\\S"`),
          ],
          [
            CaseType.Failure,
            "too long",
            getTestString(OccupationConstants.SIGNALLING_VALUE_LABEL_MAX_LENGTH + 1),
            constructSchemaError(
              "/signallingValueLabel",
              "maxLength",
              `must NOT have more than ${OccupationConstants.SIGNALLING_VALUE_LABEL_MAX_LENGTH} characters`
            ),
          ],
        ])("%s Validate 'signallingValueLabel' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            signallingValueLabel: givenValue,
          };
          assertCaseForProperty("signallingValueLabel", givenObject, itemSchema, caseType, failureMessage);
        });
      });
    });

    describe("Test validation of 'parents' field", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'parents'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/parents", "type", "must be array")],
        [CaseType.Success, "empty array", [], undefined],
        [CaseType.Success, "valid parents", [givenParent], undefined],
      ])("%s Validate 'parents' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidSkill,
          parents: givenValue,
        };
        assertCaseForProperty("parents", givenObject, itemSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of parents nested fields", () => {
      describe("Test validation of 'parents/0/id'", () => {
        const testCases = getStdObjectIdTestCases("/parents/0/id");
        test.each(testCases)(
          `(%s) Validate 'id' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              ...givenValidSkill,
              parents: [{ ...givenParent, id: givenValue }],
            };
            assertCaseForProperty("/parents/0/id", givenObject, itemSchema, caseType, failureMessages);
          }
        );
      });

      describe("Test validation of 'parents/0/UUID'", () => {
        const testCases = getStdUUIDTestCases("/parents/0/UUID");
        test.each(testCases)(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              ...givenValidSkill,
              parents: [{ ...givenParent, UUID: givenValue }],
            };
            assertCaseForProperty("/parents/0/UUID", givenObject, itemSchema, caseType, failureMessages);
          }
        );
      });

      describe("Test validation of 'parents/0/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/parents/0/preferredLabel",
          SkillConstants.PREFERRED_LABEL_MAX_LENGTH
        );
        test.each(testCases)(
          `(%s) Validate 'preferredLabel' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            const givenObject = {
              ...givenValidSkill,
              parents: [{ ...givenParent, preferredLabel: givenValue }],
            };
            assertCaseForProperty("/parents/0/preferredLabel", givenObject, itemSchema, caseType, failureMessage);
          }
        );
      });
    });

    describe("Test validation of 'children' field", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'children'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/children", "type", "must be array")],
        [CaseType.Success, "empty array", [], undefined],
        [CaseType.Success, "valid children array", [givenChild], undefined],
      ])("(%s) Validate 'children' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidSkill,
          children: givenValue,
        };
        assertCaseForProperty("children", givenObject, itemSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of 'requiresSkills' field", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'requiresSkills'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/requiresSkills", "type", "must be array")],
        [CaseType.Success, "empty array", [], undefined],
      ])("(%s) Validate 'requiresSkills' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidSkill,
          requiresSkills: givenValue,
        };
        assertCaseForProperty("requiresSkills", givenObject, itemSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of 'requiredBySkills' field", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'requiredBySkills'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/requiredBySkills", "type", "must be array")],
        [CaseType.Success, "empty array", [], undefined],
      ])("(%s) Validate 'requiredBySkills' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidSkill,
          requiredBySkills: givenValue,
        };
        assertCaseForProperty("requiredBySkills", givenObject, itemSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of 'requiredByOccupations' field", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'requiredByOccupations'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/requiredByOccupations", "type", "must be array")],
        [CaseType.Success, "empty array", [], undefined],
      ])(
        "(%s) Validate 'requiredByOccupations' when it is %s",
        (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            requiredByOccupations: givenValue,
          };
          assertCaseForProperty("requiredByOccupations", givenObject, itemSchema, caseType, failureMessage);
        }
      );
    });

    describe("Test validation of 'createdAt'", () => {
      testTimestampField("createdAt", itemSchema);
    });

    describe("Test validation of 'updatedAt'", () => {
      testTimestampField("updatedAt", itemSchema);
    });
  });
});
