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
} from "_test_utilities/stdSchemaTests";
import {
  getStdLimitTestCases,
  getStdCursorTestCases,
  getStdObjectIdTestCases,
  getStdUUIDTestCases,
  getStdNonEmptyStringTestCases,
} from "_test_utilities/stdSchemaTestCases";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import OccupationConstants from "../../constants";
import OccupationAPISpecs from "../../index";
import OccupationEnums from "../../enums";
import SkillEnums from "../../../skill/enums";
import SkillConstants from "../../../skill/constants";
import { getTestSkillGroupCode } from "../../../_test_utilities/testUtils";

describe("Test Occupation Skills Response Schema Validity", () => {
  testValidSchema(
    "OccupationAPISpecs.Schemas.GET.Skills.Response.Payload",
    OccupationAPISpecs.Schemas.GET.Skills.Response.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Schemas.GET.Skills.Response.Payload schema", () => {
  // GIVEN a valid parent for skill
  const givenParent = {
    id: getMockId(2),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillConstants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.ObjectTypes.SkillGroup,
    code: getTestSkillGroupCode(),
  };

  // GIVEN a valid child for skill
  const givenChild = {
    id: getMockId(3),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillConstants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.ObjectTypes.Skill,
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    isLocalized: true,
  };

  // GIVEN valid relationship arrays
  const givenRequiresSkills = [
    {
      id: getMockId(4),
      UUID: randomUUID(),
      preferredLabel: getTestString(20),
      isLocalized: true,
      objectType: SkillEnums.ObjectTypes.Skill,
      skillType: SkillEnums.SkillType.SkillCompetence,
      reuseLevel: SkillEnums.ReuseLevel.CrossSector,
      relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
    },
  ];

  const givenRequiredBySkills = [
    {
      id: getMockId(5),
      UUID: randomUUID(),
      preferredLabel: getTestString(20),
      isLocalized: false,
      objectType: SkillEnums.ObjectTypes.Skill,
      skillType: SkillEnums.SkillType.Knowledge,
      reuseLevel: SkillEnums.ReuseLevel.CrossSector,
      relationType: SkillEnums.SkillToSkillRelationType.OPTIONAL,
    },
  ];

  const givenRequiredByOccupations = [
    {
      id: getMockId(6),
      UUID: randomUUID(),
      preferredLabel: getTestString(20),
      isLocalized: true,
      objectType: SkillEnums.OccupationObjectTypes.ESCOOccupation,
      relationType: SkillEnums.OccupationToSkillRelationType.ESSENTIAL,
      signallingValue: null,
      signallingValueLabel: null,
    },
    {
      id: getMockId(7),
      UUID: randomUUID(),
      preferredLabel: getTestString(20),
      isLocalized: false,
      objectType: SkillEnums.OccupationObjectTypes.LocalOccupation,
      relationType: null,
      signallingValue: 75,
      signallingValueLabel: SkillEnums.SignallingValueLabel.HIGH,
    },
  ];

  // GIVEN a valid skill item with full information plus relationship metadata
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
    objectType: SkillEnums.ObjectTypes.Skill,
    skillGroupCode: "S1.2.3",
    parent: givenParent,
    children: [givenChild],
    requiresSkills: givenRequiresSkills,
    requiredBySkills: givenRequiredBySkills,
    requiredByOccupations: givenRequiredByOccupations,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValue: 50,
    signallingValueLabel: getTestString(20),
  };

  // GIVEN a valid paginated response
  const givenValidPaginatedResponse = {
    data: [givenValidSkill],
    limit: OccupationConstants.MAX_LIMIT,
    nextCursor: getTestString(OccupationConstants.MAX_CURSOR_LENGTH),
  };

  testSchemaWithValidObject(
    "OccupationAPISpecs.Schemas.GET.Skills.Response.Payload",
    OccupationAPISpecs.Schemas.GET.Skills.Response.Payload,
    givenValidPaginatedResponse
  );

  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Schemas.GET.Skills.Response.Payload",
    OccupationAPISpecs.Schemas.GET.Skills.Response.Payload,
    {
      ...givenValidPaginatedResponse,
      extraProperty: "extra test property",
    }
  );

  describe("Validate OccupationAPISpecs.Schemas.GET.Skills.Response.Payload fields", () => {
    const givenSchema = OccupationAPISpecs.Schemas.GET.Skills.Response.Payload;

    describe("Test validation of 'limit'", () => {
      const testCases = getStdLimitTestCases("limit", OccupationConstants.MAX_LIMIT, true);

      test.each(testCases)("%s %s", (caseType, desc, value, failure) => {
        const givenObject = { ...givenValidPaginatedResponse, limit: value };
        if (value === undefined) delete (givenObject as Record<string, unknown>).limit;
        assertCaseForProperty("limit", givenObject, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'nextCursor'", () => {
      // nextCursor is optional and nullable.
      const testCases = getStdCursorTestCases("nextCursor", OccupationConstants.MAX_CURSOR_LENGTH, false, true);

      test.each(testCases)("%s %s", (caseType, desc, value, failure) => {
        const givenObject = { ...givenValidPaginatedResponse, nextCursor: value };
        // We need to delete the property if it is undefined, to make sure it is not added as undefined
        if (value === undefined) delete (givenObject as Record<string, unknown>).nextCursor;
        assertCaseForProperty("nextCursor", givenObject, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'data'", () => {
      test("should succeed with valid data array", () => {
        const givenObject = { ...givenValidPaginatedResponse };
        assertCaseForProperty("data", givenObject, givenSchema, CaseType.Success, undefined);
      });

      test("should succeed with empty data array", () => {
        const givenObject = { ...givenValidPaginatedResponse, data: [] };
        assertCaseForProperty("data", givenObject, givenSchema, CaseType.Success, undefined);
      });

      test("should fail when data is undefined", () => {
        const givenObject = { ...givenValidPaginatedResponse };
        delete (givenObject as Record<string, unknown>).data;
        assertCaseForProperty(
          "data",
          givenObject,
          givenSchema,
          CaseType.Failure,
          constructSchemaError("", "required", "must have required property 'data'")
        );
      });
    });

    // Test individual skill item fields
    describe("Test validation of skill item fields", () => {
      const itemSchema = OccupationAPISpecs.Schemas.GET.Skills.Response.Payload.properties.data.items;

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
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'path'"),
          ],
          [CaseType.Failure, "null", null, constructSchemaError("/path", "type", "must be string")],
          [CaseType.Success, "valid URI", "https://example.com/path", undefined],
        ])("%s Validate path when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            path: givenValue,
          };
          assertCaseForProperty("path", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'tabiyaPath'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'tabiyaPath'"),
          ],
          [CaseType.Success, "valid URI", "https://example.com/tabiya", undefined],
        ])("%s Validate tabiyaPath when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            tabiyaPath: givenValue,
          };
          assertCaseForProperty("tabiyaPath", givenObject, itemSchema, caseType, failureMessage);
        });
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
          [CaseType.Success, "empty array", [], undefined],
          [CaseType.Success, "valid array", [getTestString(15), getTestString(20)], undefined],
        ])("(%s) Validate 'altLabels' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            altLabels: givenValue,
          };
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
          [CaseType.Success, "valid skillType", SkillEnums.SkillType.SkillCompetence, undefined],
        ])("%s Validate 'skillType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            skillType: givenValue,
          };
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
          [CaseType.Success, "valid reuseLevel", SkillEnums.ReuseLevel.CrossSector, undefined],
        ])("%s Validate 'reuseLevel' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            reuseLevel: givenValue,
          };
          assertCaseForProperty("reuseLevel", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'modelId'", () => {
        testObjectIdField("modelId", itemSchema);
      });

      describe("Test validation of 'isLocalized'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'isLocalized'"),
          ],
          [CaseType.Failure, "string", "true", constructSchemaError("/isLocalized", "type", "must be boolean")],
          [CaseType.Success, "true", true, undefined],
          [CaseType.Success, "false", false, undefined],
        ])("%s Validate 'isLocalized' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = { isLocalized: givenValue };
          assertCaseForProperty("isLocalized", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'createdAt'", () => {
        testTimestampField("createdAt", itemSchema);
      });

      describe("Test validation of 'updatedAt'", () => {
        testTimestampField("updatedAt", itemSchema);
      });

      // Test relationship metadata fields
      describe("Test validation of 'relationType' (relationship metadata)", () => {
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

      describe("Test validation of 'signallingValue' (relationship metadata)", () => {
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

      describe("Test validation of 'signallingValueLabel' (relationship metadata)", () => {
        test.each([
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "valid string", getTestString(20), undefined],
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

      // Test nested parent fields
      describe("Test validation of 'parent' field", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'parent'"),
          ],
          [CaseType.Success, "null", null, undefined],
          [CaseType.Success, "valid parent", givenParent, undefined],
        ])("%s Validate 'parent' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            parent: givenValue,
          };
          assertCaseForProperty("parent", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of parent nested fields", () => {
        describe("Test validation of 'parent/id'", () => {
          const testCases = getStdObjectIdTestCases("/parent/id");
          test.each(testCases)(
            `(%s) Validate 'id' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = {
                ...givenValidSkill,
                parent: {
                  ...givenParent,
                  id: givenValue,
                },
              };
              assertCaseForProperty("/parent/id", givenObject, itemSchema, caseType, failureMessages);
            }
          );
        });

        describe("Test validation of 'parent/UUID'", () => {
          const testCases = getStdUUIDTestCases("/parent/UUID");
          test.each(testCases)(
            `(%s) Validate 'UUID' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = {
                ...givenValidSkill,
                parent: {
                  ...givenParent,
                  UUID: givenValue,
                },
              };
              assertCaseForProperty("/parent/UUID", givenObject, itemSchema, caseType, failureMessages);
            }
          );
        });

        describe("Test validation of 'parent/preferredLabel'", () => {
          const testCases = getStdNonEmptyStringTestCases(
            "/parent/preferredLabel",
            SkillConstants.PREFERRED_LABEL_MAX_LENGTH
          );
          test.each(testCases)(
            `(%s) Validate 'preferredLabel' when it is %s`,
            (caseType, _description, givenValue, failureMessage) => {
              const givenObject = {
                ...givenValidSkill,
                parent: {
                  ...givenParent,
                  preferredLabel: givenValue,
                },
              };
              assertCaseForProperty("/parent/preferredLabel", givenObject, itemSchema, caseType, failureMessage);
            }
          );
        });
      });

      // Test nested children fields
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

      // Test nested requiresSkills fields
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
          [CaseType.Success, "valid requiresSkills array", givenRequiresSkills, undefined],
        ])("(%s) Validate 'requiresSkills' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            requiresSkills: givenValue,
          };
          assertCaseForProperty("requiresSkills", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of requiresSkills item fields", () => {
        test("should validate requiresSkills item has required relationType", () => {
          const invalidItem = {
            id: getMockId(4),
            UUID: randomUUID(),
            preferredLabel: getTestString(20),
            isLocalized: true,
            objectType: SkillEnums.ObjectTypes.Skill,
            // missing relationType
          };
          const givenObject = {
            ...givenValidSkill,
            requiresSkills: [invalidItem],
          };
          assertCaseForProperty(
            "requiresSkills",
            givenObject,
            itemSchema,
            CaseType.Failure,
            constructSchemaError("/requiresSkills/0", "required", "must have required property 'relationType'")
          );
        });
      });

      // Test nested requiredBySkills fields
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
          [CaseType.Success, "valid requiredBySkills array", givenRequiredBySkills, undefined],
        ])("(%s) Validate 'requiredBySkills' when it is %s", (caseType, _description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkill,
            requiredBySkills: givenValue,
          };
          assertCaseForProperty("requiredBySkills", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      // Test nested requiredByOccupations fields
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
          [CaseType.Success, "valid requiredByOccupations array", givenRequiredByOccupations, undefined],
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

      describe("Test validation of requiredByOccupations item fields", () => {
        test("should validate ESCOOccupation has required relationType", () => {
          const invalidItem = {
            id: getMockId(6),
            UUID: randomUUID(),
            preferredLabel: getTestString(20),
            isLocalized: true,
            objectType: SkillEnums.OccupationObjectTypes.ESCOOccupation,
            // missing relationType - should fail for ESCO
            signallingValue: null,
            signallingValueLabel: null,
          };
          const givenObject = {
            ...givenValidSkill,
            requiredByOccupations: [invalidItem],
          };
          assertCaseForProperty(
            "requiredByOccupations",
            givenObject,
            itemSchema,
            CaseType.Failure,
            constructSchemaError("/requiredByOccupations/0", "required", "must have required property 'relationType'")
          );
        });

        test("should validate LocalOccupation has required signallingValue", () => {
          const invalidItem = {
            id: getMockId(7),
            UUID: randomUUID(),
            preferredLabel: getTestString(20),
            isLocalized: false,
            objectType: SkillEnums.OccupationObjectTypes.LocalOccupation,
            relationType: null,
            // missing signallingValue - should fail for Local
            signallingValueLabel: SkillEnums.SignallingValueLabel.HIGH,
          };
          const givenObject = {
            ...givenValidSkill,
            requiredByOccupations: [invalidItem],
          };
          assertCaseForProperty(
            "requiredByOccupations",
            givenObject,
            itemSchema,
            CaseType.Failure,
            constructSchemaError(
              "/requiredByOccupations/0",
              "required",
              "must have required property 'signallingValue'"
            )
          );
        });

        test("should validate LocalOccupation has required signallingValueLabel", () => {
          const invalidItem = {
            id: getMockId(7),
            UUID: randomUUID(),
            preferredLabel: getTestString(20),
            isLocalized: false,
            objectType: SkillEnums.OccupationObjectTypes.LocalOccupation,
            relationType: null,
            signallingValue: 75,
            // missing signallingValueLabel - should fail for Local
          };
          const givenObject = {
            ...givenValidSkill,
            requiredByOccupations: [invalidItem],
          };
          assertCaseForProperty(
            "requiredByOccupations",
            givenObject,
            itemSchema,
            CaseType.Failure,
            constructSchemaError(
              "/requiredByOccupations/0",
              "required",
              "must have required property 'signallingValueLabel'"
            )
          );
        });
      });
    });
  });
});
