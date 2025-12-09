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
import { RegExp_Str_NotEmptyString } from "../../regex";

import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import SkillAPISpecs from "./index";
import SkillConstants from "./constants";
import SkillEnums from "./enums";

describe("Test Skill Schema Validity", () => {
  // WHEN the SkillAPISpecs.GET.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillAPISpecs.Schemas.GET.Response.Payload", SkillAPISpecs.Schemas.GET.Response.Payload);
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Response.Payload schema", () => {
  // GIVEN a valid parent response payload object
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.ObjectTypes.Skill,
  };

  // GIVEN a valid child response payload object
  const givenChild = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.ObjectTypes.Skill,
  };

  // GIVEN valid relationship objects
  const givenRequiresSkills = [
    {
      id: getMockId(2),
      UUID: randomUUID(),
      preferredLabel: getTestString(20),
      isLocalized: true,
      objectType: SkillEnums.ObjectTypes.Skill,
      relationType: SkillEnums.SkillToSkillRelationType.BROADER,
    },
  ];

  const givenRequiredBySkills = [
    {
      id: getMockId(3),
      UUID: randomUUID(),
      preferredLabel: getTestString(20),
      isLocalized: false,
      objectType: SkillEnums.ObjectTypes.Skill,
      relationType: SkillEnums.SkillToSkillRelationType.NARROWER,
    },
  ];

  const givenRequiredByOccupations = [
    {
      id: getMockId(4),
      UUID: randomUUID(),
      preferredLabel: getTestString(20),
      isLocalized: true,
      objectType: "ESCOOccupation",
      relationType: "essential",
      signallingValue: null,
      signallingValueLabel: "",
    },
  ];

  // GIVEN a valid skill response payload object
  const givenValidSkillGETResponse = {
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
    requiresSkills: givenRequiresSkills,
    requiredBySkills: givenRequiredBySkills,
    requiredByOccupations: givenRequiredByOccupations,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Create a valid paginated response object
  const givenValidPaginatedResponse = {
    items: [givenValidSkillGETResponse],
    limit: SkillConstants.MAX_LIMIT,
    next_cursor: getTestString(SkillConstants.MAX_CURSOR_LENGTH),
  };

  // Test with a valid paginated response
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Response.Payload",
    SkillAPISpecs.Schemas.GET.Response.Payload,
    givenValidPaginatedResponse
  );

  // Test with additional properties in the paginated response
  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Response.Payload",
    SkillAPISpecs.Schemas.GET.Response.Payload,
    {
      ...givenValidPaginatedResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate SkillAPISpecs.Schemas.GET.Response.Payload fields", () => {
    const givenSchema = SkillAPISpecs.Schemas.GET.Response.Payload;

    describe("Test validation of 'limit'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          { items: [givenValidSkillGETResponse] }, // Include valid items
          constructSchemaError("", "required", "must have required property 'limit'"), // Adjusted error path
        ],
        [
          CaseType.Failure,
          "null",
          { items: [givenValidSkillGETResponse], limit: null },
          constructSchemaError("/limit", "type", "must be integer"),
        ],
        [
          CaseType.Failure,
          "string",
          { items: [givenValidSkillGETResponse], limit: "10" },
          constructSchemaError("/limit", "type", "must be integer"),
        ],
        [
          CaseType.Failure,
          "float",
          { items: [givenValidSkillGETResponse], limit: 1.1 },
          constructSchemaError("/limit", "type", "must be integer"),
        ],
        [
          CaseType.Failure,
          "zero",
          { items: [givenValidSkillGETResponse], limit: 0 },
          constructSchemaError("/limit", "minimum", "must be >= 1"),
        ],
        [
          CaseType.Failure,
          "over max",
          { items: [givenValidSkillGETResponse], limit: SkillConstants.MAX_LIMIT + 1 },
          constructSchemaError("/limit", "maximum", `must be <= ${SkillConstants.MAX_LIMIT}`),
        ],
        [CaseType.Success, "one", { items: [givenValidSkillGETResponse], limit: 1 }, undefined],
        [CaseType.Success, "ten", { items: [givenValidSkillGETResponse], limit: 10 }, undefined],
      ])("%s %s", (caseType, desc, value, failure) => {
        assertCaseForProperty("limit", value, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'next_cursor'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Success, "null", null, undefined],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/next_cursor", "pattern", `must match pattern "${RegExp_Str_NotEmptyString}"`),
        ],
        [
          CaseType.Failure,
          "too long",
          getTestString(SkillAPISpecs.Constants.MAX_CURSOR_LENGTH + 1),
          constructSchemaError(
            "/next_cursor",
            "maxLength",
            `must NOT have more than ${SkillAPISpecs.Constants.MAX_CURSOR_LENGTH} characters`
          ),
        ],
        [CaseType.Success, "valid string", getTestString(SkillAPISpecs.Constants.MAX_CURSOR_LENGTH), undefined],
      ])(`(%s) Validate 'next_cursor' when it is %s`, (caseType, _desc, value, failureMessage) => {
        assertCaseForProperty(
          "next_cursor",
          { next_cursor: value },
          SkillAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    // Nested validation for individual skill items
    describe("Test validation of skill items", () => {
      const itemSchema = SkillAPISpecs.Schemas.GET.Response.Payload.properties.items.items;

      describe("Test validation of 'id'", () => {
        testObjectIdField("id", itemSchema);
      });

      describe("Test validation of 'UUID'", () => {
        testUUIDField<SkillAPISpecs.Types.POST.Request.Payload>("UUID", itemSchema);
      });

      describe("Test validation of 'originUUID'", () => {
        testUUIDField<SkillAPISpecs.Types.POST.Request.Payload>("originUUID", itemSchema);
      });

      describe("Test validation of 'UUIDHistory'", () => {
        testUUIDArray<SkillAPISpecs.Types.GET.Response.Payload>("UUIDHistory", itemSchema, [], true, true);
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
            ...givenValidSkillGETResponse,
            path: givenValue,
          };
          assertCaseForProperty("path", givenObject, itemSchema, caseType, failureMessage);
        });
      });

      describe("Test validation of 'originUri'", () => {
        testNonEmptyURIStringField("originUri", SkillAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'preferredLabel'", () => {
        testNonEmptyStringField<SkillAPISpecs.Types.POST.Request.Payload>(
          "preferredLabel",
          SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'description'", () => {
        testStringField<SkillAPISpecs.Types.POST.Request.Payload>(
          "description",
          SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'definition'", () => {
        testStringField<SkillAPISpecs.Types.POST.Request.Payload>(
          "definition",
          SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'scopeNote'", () => {
        testStringField<SkillAPISpecs.Types.POST.Request.Payload>(
          "scopeNote",
          SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH,
          itemSchema
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
        ])("%s Validate 'skillType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillGETResponse,
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
        ])("%s Validate 'reuseLevel' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            ...givenValidSkillGETResponse,
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
          assertCaseForProperty("isLocalized", givenObject, itemSchema, caseType, failureMessage);
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
          [CaseType.Success, "null", null, undefined],
          [CaseType.Failure, "a string", "foo", constructSchemaError("/parent", "type", "must be object,null")],
          [
            CaseType.Failure,
            "an array",
            ["foo", "bar"],
            constructSchemaError("/parent", "type", "must be object,null"),
          ],
          [CaseType.Success, "a valid parent object", givenValidSkillGETResponse.parent, undefined],
        ])("(%s) Validate 'parent' when it is %s", (caseType, _description, givenValue, failureMessages) => {
          const givenObject = {
            ...givenValidSkillGETResponse,
            parent: givenValue,
          };
          assertCaseForProperty("parent", givenObject, itemSchema, caseType, failureMessages);
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
              },
            ],
            undefined,
          ],
        ])("(%s) Validate 'children' when it is %s", (caseType, _description, givenValue, failureMessages) => {
          const givenObject = {
            children: givenValue,
          };
          assertCaseForProperty("children", givenObject, itemSchema, caseType, failureMessages);
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
        ])("(%s) Validate 'requiresSkills' when it is %s", (caseType, _description, givenValue, failureMessages) => {
          const givenObject = {
            requiresSkills: givenValue,
          };
          assertCaseForProperty("requiresSkills", givenObject, itemSchema, caseType, failureMessages);
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
        ])("(%s) Validate 'requiredBySkills' when it is %s", (caseType, _description, givenValue, failureMessages) => {
          const givenObject = {
            requiredBySkills: givenValue,
          };
          assertCaseForProperty("requiredBySkills", givenObject, itemSchema, caseType, failureMessages);
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
          [
            CaseType.Failure,
            "a string",
            "foo",
            constructSchemaError("/requiredByOccupations", "type", "must be array"),
          ],
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
        ])(
          "(%s) Validate 'requiredByOccupations' when it is %s",
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = {
              requiredByOccupations: givenValue,
            };
            assertCaseForProperty("requiredByOccupations", givenObject, itemSchema, caseType, failureMessages);
          }
        );
      });

      describe("Test validation of 'createdAt'", () => {
        testTimestampField<SkillAPISpecs.Types.POST.Request.Payload>("createdAt", itemSchema);
      });

      describe("Test validation of 'updatedAt'", () => {
        testTimestampField<SkillAPISpecs.Types.POST.Request.Payload>("updatedAt", itemSchema);
      });
    });
  });
});
