import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
  testNonEmptyStringField,
  testURIField,
  testUUIDField,
  testStringField,
  testTimestampField,
  testUUIDArray,
  testNonEmptyURIStringField,
} from "_test_utilities/stdSchemaTests";
import { RegExp_Str_NotEmptyString } from "../../regex";
import {
  getStdNonEmptyStringTestCases,
  getStdObjectIdTestCases,
  getStdUUIDTestCases,
} from "_test_utilities/stdSchemaTestCases";

import { ObjectTypes } from "../common/objectTypes";
import { getTestString } from "_test_utilities/specialCharacters";
import {
  getTestESCOOccupationCode,
  getTestISCOGroupCode,
  getTestLocalGroupCode,
  getTestLocalOccupationCode,
  getTestESCOLocalOccupationCode,
} from "../_test_utilities/testUtils";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import OccupationConstants from "./constants";

import OccupationAPISpecs from "./index";
import OccupationEnums from "./enums";

describe("Test Occupation Schema Validity", () => {
  // WHEN the OccupationAPISpecs.GET.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("OccupationAPISpecs.Schemas.GET.Response.Payload", OccupationAPISpecs.Schemas.GET.Response.Payload);
});

describe("Test objects against the OccupationAPISpecs.Schemas.GET.Response.Payload schema", () => {
  // GIVEN a valid response payloafd object
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestISCOGroupCode(),
    preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationEnums.Relations.Parent.ObjectTypes.ISCOGroup,
  };

  const givenChild = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestLocalOccupationCode(),
    preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationEnums.Relations.Children.ObjectTypes.LocalOccupation,
  };

  const givenSkill = {
    id: getMockId(3),
    UUID: randomUUID(),
    preferredLabel: "Skill Label",
    isLocalized: false,
    objectType: OccupationEnums.Relations.RequiredSkills.ObjectTypes.Skill,
    relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValue: null,
    signallingValueLabel: null,
  };

  const givenValidOccupationGETResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID(), randomUUID()],
    originUUID: randomUUID(),
    path: "https://example.com/some/path",
    tabiyaPath: "https://example.com/some/tabiya",
    code: getTestESCOOccupationCode(),
    occupationGroupCode: getTestISCOGroupCode(),
    preferredLabel: getTestString(20),
    originUri: "https://foo/bar",
    altLabels: [getTestString(OccupationConstants.ALT_LABEL_MAX_LENGTH)],
    definition: getTestString(50),
    description: getTestString(50),
    regulatedProfessionNote: getTestString(30),
    scopeNote: getTestString(30),
    occupationType: OccupationEnums.OccupationType.ESCOOccupation,
    modelId: getMockId(1),
    isLocalized: true,
    parent: givenParent,
    children: [givenChild],
    requiresSkills: [givenSkill],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Create a valid paginated response object
  const givenValidPaginatedResponse = {
    data: [givenValidOccupationGETResponse],
    limit: OccupationConstants.MAX_LIMIT,
    nextCursor: getTestString(OccupationConstants.CODE_MAX_LENGTH),
  };

  // Test with a valid paginated response
  testSchemaWithValidObject(
    "OccupationAPISpecs.Schemas.GET.Response.Payload",
    OccupationAPISpecs.Schemas.GET.Response.Payload,
    givenValidPaginatedResponse
  );

  // Test with additional properties in the paginated response
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Schemas.GET.Response.Payload",
    OccupationAPISpecs.Schemas.GET.Response.Payload,
    {
      ...givenValidPaginatedResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate OccupationAPISpecs.Schemas.GET.Response.Payload fields", () => {
    const givenSchema = OccupationAPISpecs.Schemas.GET.Response.Payload;

    describe("Test validation of 'limit'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          { data: [givenValidOccupationGETResponse] }, // Include valid data
          constructSchemaError("", "required", "must have required property 'limit'"), // Adjusted error path
        ],
        [
          CaseType.Failure,
          "null",
          { data: [givenValidOccupationGETResponse], limit: null },
          constructSchemaError("/limit", "type", "must be integer"),
        ],
        [
          CaseType.Failure,
          "string",
          { data: [givenValidOccupationGETResponse], limit: "10" },
          constructSchemaError("/limit", "type", "must be integer"),
        ],
        [
          CaseType.Failure,
          "float",
          { data: [givenValidOccupationGETResponse], limit: 1.1 },
          constructSchemaError("/limit", "type", "must be integer"),
        ],
        [
          CaseType.Failure,
          "zero",
          { data: [givenValidOccupationGETResponse], limit: 0 },
          constructSchemaError("/limit", "minimum", "must be >= 1"),
        ],
        [
          CaseType.Failure,
          "over max",
          { data: [givenValidOccupationGETResponse], limit: OccupationConstants.MAX_LIMIT + 1 },
          constructSchemaError("/limit", "maximum", `must be <= ${OccupationConstants.MAX_LIMIT}`),
        ],
        [CaseType.Success, "one", { data: [givenValidOccupationGETResponse], limit: 1 }, undefined],
        [CaseType.Success, "ten", { data: [givenValidOccupationGETResponse], limit: 10 }, undefined],
      ])("%s %s", (caseType, desc, value, failure) => {
        assertCaseForProperty("limit", value, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of required properties", () => {
      test.each([
        [
          CaseType.Failure,
          "missing data",
          { limit: OccupationConstants.MAX_LIMIT, nextCursor: getTestString(OccupationConstants.MAX_CURSOR_LENGTH) },
          constructSchemaError("", "required", "must have required property 'data'"),
        ],
        [
          CaseType.Failure,
          "missing limit",
          { data: [givenValidOccupationGETResponse], nextCursor: getTestString(OccupationConstants.MAX_CURSOR_LENGTH) },
          constructSchemaError("", "required", "must have required property 'limit'"),
        ],
      ])("%s %s", (caseType, desc, value, failure) => {
        assertCaseForProperty("", value, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'nextCursor'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, undefined],
        [CaseType.Success, "null", null, undefined],
        [
          CaseType.Failure,
          "too long",
          getTestString(OccupationAPISpecs.Constants.MAX_CURSOR_LENGTH + 1),
          constructSchemaError(
            "/nextCursor",
            "maxLength",
            `must NOT have more than ${OccupationAPISpecs.Constants.MAX_CURSOR_LENGTH} characters`
          ),
        ],
        [CaseType.Success, "valid string", getTestString(OccupationAPISpecs.Constants.MAX_CURSOR_LENGTH), undefined],
      ])(`(%s) Validate 'nextCursor' when it is %s`, (caseType, _desc, value, failureMessage) => {
        assertCaseForProperty(
          "nextCursor",
          { nextCursor: value },
          OccupationAPISpecs.Schemas.GET.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    // Nested validation for individual occupation items
    describe("Test validation of occupation data", () => {
      const itemSchema = OccupationAPISpecs.Schemas.GET.Response.Payload.properties.data.items;

      describe("Test validation of 'id'", () => {
        testObjectIdField("id", itemSchema);
      });

      describe("Test validation of 'UUID'", () => {
        testUUIDField<OccupationAPISpecs.Types.POST.Request.Payload>("UUID", itemSchema);
      });

      describe("Test validation of 'originUUID'", () => {
        testUUIDField<OccupationAPISpecs.Types.POST.Request.Payload>("originUUID", itemSchema);
      });

      describe("Test validation of 'UUIDHistory'", () => {
        testUUIDArray<OccupationAPISpecs.Types.GET.Response.Payload>("UUIDHistory", itemSchema, [], true, true);
      });

      describe("Test validation of 'path'", () => {
        testURIField<OccupationAPISpecs.Types.GET.Response.Payload>(
          "path",
          OccupationAPISpecs.Constants.PATH_URI_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'tabiyaPath'", () => {
        testURIField<OccupationAPISpecs.Types.GET.Response.Payload>(
          "tabiyaPath",
          OccupationAPISpecs.Constants.TABIYA_PATH_URI_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'originUri'", () => {
        testNonEmptyURIStringField("originUri", OccupationAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH, itemSchema);
      });

      describe("Test validation of 'code'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError("", "required", "must have required property 'code'"),
          ],
          [
            CaseType.Failure,
            "null",
            null,
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError("/code", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError(
              "/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "1234",
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError(
              "/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "a valid code of different type",
            getTestLocalOccupationCode(),
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError(
              "/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Success,
            "a valid code",
            getTestESCOOccupationCode(),
            OccupationEnums.OccupationType.ESCOOccupation,
            undefined,
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            OccupationEnums.OccupationType.LocalOccupation,
            constructSchemaError(
              "/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "1234",
            OccupationEnums.OccupationType.LocalOccupation,
            constructSchemaError(
              "/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "a valid code of different type",
            getTestESCOOccupationCode(),
            OccupationEnums.OccupationType.LocalOccupation,
            constructSchemaError(
              "/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Success,
            "a valid local occupation code",
            getTestLocalOccupationCode(),
            OccupationEnums.OccupationType.LocalOccupation,
            undefined,
          ],
          [
            CaseType.Success,
            "a valid ESCO local occupation code",
            getTestESCOLocalOccupationCode(),
            OccupationEnums.OccupationType.LocalOccupation,
            undefined,
          ],
        ] as const)(
          "%s Validate 'code' when it is %s with %s occupationType",
          (caseType, _description, givenValue, occupationType, failureMessage) => {
            const givenObject = {
              ...givenValidOccupationGETResponse,
              code: givenValue,
              occupationType,
            };

            assertCaseForProperty("code", givenObject, itemSchema, caseType, failureMessage);
          }
        );
      });

      describe("Test validation of 'occupationGroupCode'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError("", "required", "must have required property 'occupationGroupCode'"),
          ],
          [
            CaseType.Failure,
            "null",
            null,
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError("/occupationGroupCode", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "abcd",
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "a valid code of different type",
            getTestLocalGroupCode(),
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Success,
            "a valid code",
            getTestISCOGroupCode(),
            OccupationEnums.OccupationType.ESCOOccupation,
            undefined,
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            OccupationEnums.OccupationType.LocalOccupation,
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "1234",
            OccupationEnums.OccupationType.LocalOccupation,
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "a valid code of different type",
            getTestISCOGroupCode(),
            OccupationEnums.OccupationType.LocalOccupation,
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Success,
            "a valid code",
            getTestLocalGroupCode(),
            OccupationEnums.OccupationType.LocalOccupation,
            undefined,
          ],
        ] as const)(
          "%s Validate 'occupationGroupCode' when it is %s with %s occupationType",
          (caseType, _description, givenValue, occupationType, failureMessage) => {
            const givenObject = {
              ...givenValidOccupationGETResponse,
              occupationType,
              occupationGroupCode: givenValue,
            };

            assertCaseForProperty("occupationGroupCode", givenObject, itemSchema, caseType, failureMessage);
          }
        );
      });

      describe("Test validation of 'preferredLabel'", () => {
        testNonEmptyStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
          "preferredLabel",
          OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'description'", () => {
        testStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
          "description",
          OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'definition'", () => {
        testStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
          "definition",
          OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'regulatedProfessionNote'", () => {
        testStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
          "regulatedProfessionNote",
          OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'scopeNote'", () => {
        testStringField<OccupationAPISpecs.Types.POST.Request.Payload>(
          "scopeNote",
          OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH,
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
              getTestString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
              getTestString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1),
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

      describe("Test validation of 'occupationType'", () => {
        test.each([
          [
            CaseType.Failure,
            "undefined",
            undefined,
            constructSchemaError("", "required", "must have required property 'occupationType'"),
          ],
          [CaseType.Failure, "null", null, constructSchemaError("/occupationType", "type", "must be string")],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError("/occupationType", "enum", "must be equal to one of the allowed values"),
          ],
          [
            CaseType.Failure,
            "invalid occupationType",
            "invalidType",
            constructSchemaError("/occupationType", "enum", "must be equal to one of the allowed values"),
          ],
          [
            CaseType.Success,
            "a valid occupationType (escooccupation)",
            OccupationEnums.OccupationType.ESCOOccupation,
            undefined,
          ],
          [
            CaseType.Success,
            "a valid occupationType (localoccupation)",
            OccupationEnums.OccupationType.LocalOccupation,
            undefined,
          ],
        ])("%s Validate 'occupationType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = {
            occupationType: givenValue,
          };
          assertCaseForProperty("occupationType", givenObject, itemSchema, caseType, failureMessage);
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
          [CaseType.Success, "a valid parent object", givenValidOccupationGETResponse.parent, undefined],
        ])("(%s) Validate 'parent' when it is %s", (caseType, _description, givenValue, failureMessages) => {
          const givenObject = {
            ...givenValidOccupationGETResponse,
            parent: givenValue,
          };
          assertCaseForProperty("parent", givenObject, itemSchema, caseType, failureMessages);
        });
      });

      describe("Test validation of parent fields", () => {
        describe("Test validation of 'parent/id'", () => {
          const testCases = getStdObjectIdTestCases("/parent/id").filter((testCase) => testCase[1] !== "undefined");

          test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
            `(%s) Validate 'id' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = {
                parent: {
                  id: givenValue,
                },
              };
              assertCaseForProperty("/parent/id", givenObject, itemSchema, caseType, failureMessages);
            }
          );
        });

        describe("Test validation of 'parent/UUID'", () => {
          const testCases = getStdUUIDTestCases("/parent/UUID").filter((testCase) => testCase[1] !== "undefined");

          test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
            `(%s) Validate 'UUID' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = {
                parent: {
                  UUID: givenValue,
                },
              };
              assertCaseForProperty("/parent/UUID", givenObject, itemSchema, caseType, failureMessages);
            }
          );
        });

        describe("Test validation of '/parent/code'", () => {
          test.each([
            // ISCOGroup tests
            [CaseType.Success, "undefined", undefined, ObjectTypes.ISCOGroup, undefined],
            [
              CaseType.Failure,
              "null",
              null,
              ObjectTypes.ISCOGroup,
              constructSchemaError("/parent/code", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              "",
              ObjectTypes.ISCOGroup,
              constructSchemaError(
                "/parent/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "an invalid code",
              "invalidCode",
              ObjectTypes.ISCOGroup,
              constructSchemaError(
                "/parent/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "a valid code of different type",
              getTestLocalGroupCode(),
              ObjectTypes.ISCOGroup,
              constructSchemaError(
                "/parent/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
              ),
            ],
            [CaseType.Success, "a valid code", getTestISCOGroupCode(), ObjectTypes.ISCOGroup, undefined],
            // LocalGroup tests
            [CaseType.Success, "undefined", undefined, ObjectTypes.LocalGroup, undefined],
            [
              CaseType.Failure,
              "null",
              null,
              ObjectTypes.LocalGroup,
              constructSchemaError("/parent/code", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              "",
              ObjectTypes.LocalGroup,
              constructSchemaError(
                "/parent/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
              ),
            ],
            // Cannot test invalid codes against local group pattern due to regex overlap
            // Local group code pattern is too permissive and accepts many "invalid" codes
            // Cannot test ISCO group code against local group pattern due to regex overlap
            // Local group code pattern is too permissive and may accept ISCO group codes
            [CaseType.Success, "a valid code", getTestLocalGroupCode(), ObjectTypes.LocalGroup, undefined],
            // ESCOOccupation tests
            [CaseType.Success, "undefined", undefined, ObjectTypes.ESCOOccupation, undefined],
            [
              CaseType.Failure,
              "null",
              null,
              ObjectTypes.ESCOOccupation,
              constructSchemaError("/parent/code", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              "",
              ObjectTypes.ESCOOccupation,
              constructSchemaError(
                "/parent/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "an invalid code",
              "invalidCode",
              ObjectTypes.ESCOOccupation,
              constructSchemaError(
                "/parent/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "a valid code of different type",
              getTestLocalOccupationCode(),
              ObjectTypes.ESCOOccupation,
              constructSchemaError(
                "/parent/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
              ),
            ],
            [CaseType.Success, "a valid code", getTestESCOOccupationCode(), ObjectTypes.ESCOOccupation, undefined],
            // LocalOccupation tests
            [CaseType.Success, "undefined", undefined, ObjectTypes.LocalOccupation, undefined],
            [
              CaseType.Failure,
              "null",
              null,
              ObjectTypes.LocalOccupation,
              constructSchemaError("/parent/code", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              "",
              ObjectTypes.LocalOccupation,
              constructSchemaError(
                "/parent/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "an invalid code",
              "invalidCode",
              ObjectTypes.LocalOccupation,
              constructSchemaError(
                "/parent/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "a valid code of different type",
              getTestESCOOccupationCode(),
              ObjectTypes.LocalOccupation,
              constructSchemaError(
                "/parent/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
              ),
            ],
            [
              CaseType.Success,
              "a valid local occupation code",
              getTestLocalOccupationCode(),
              ObjectTypes.LocalOccupation,
              undefined,
            ],
            [
              CaseType.Success,
              "a valid ESCO local occupation code",
              getTestESCOLocalOccupationCode(),
              ObjectTypes.LocalOccupation,
              undefined,
            ],
          ] as const)(
            "%s Validate '/parent/code' when it is %s with %s(%s) objectType",
            (caseType, __description, givenValue, objectType, failureMessage) => {
              // GIVEN an object with given value
              const givenObject = {
                ...givenValidOccupationGETResponse,
                parent: {
                  ...givenValidOccupationGETResponse.parent,
                  code: givenValue,
                  objectType,
                },
              };

              // THEN export the object to validation accordingly
              assertCaseForProperty("/parent/code", givenObject, itemSchema, caseType, failureMessage);
            }
          );
        });

        describe("Test validation of 'parent/preferredLabel'", () => {
          const testCases = getStdNonEmptyStringTestCases(
            "/parent/preferredLabel",
            OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
          ).filter((testCase) => testCase[1] !== "undefined");

          test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
            `(%s) Validate 'preferredLabel' when it is %s`,
            (caseType, _description, givenValue, failureMessage) => {
              const givenObject = {
                parent: {
                  preferredLabel: givenValue,
                },
              };
              assertCaseForProperty("/parent/preferredLabel", givenObject, itemSchema, caseType, failureMessage);
            }
          );
        });

        describe("Test validation of '/parent/objectType'", () => {
          test.each([
            [CaseType.Success, "undefined", undefined, undefined],
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
            [CaseType.Success, "a valid objectType", ObjectTypes.ISCOGroup, undefined],
          ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
            const givenObject = {
              parent: {
                objectType: givenValue,
              },
            };
            assertCaseForProperty("/parent/objectType", givenObject, itemSchema, caseType, failureMessage);
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
                code: getTestString(OccupationAPISpecs.Constants.CODE_MAX_LENGTH),
                preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
                objectType: ObjectTypes.ESCOOccupation,
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

      describe("Test validation of children fields", () => {
        describe("Test validation of 'children/id'", () => {
          const testCases = getStdObjectIdTestCases("/children/0/id").filter((testCase) => testCase[1] !== "undefined");

          test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
            `(%s) Validate 'id' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = {
                children: [
                  {
                    id: givenValue,
                  },
                ],
              };
              assertCaseForProperty("/children/0/id", givenObject, itemSchema, caseType, failureMessages);
            }
          );
        });

        describe("Test validation of 'children/UUID'", () => {
          const testCases = getStdUUIDTestCases("/children/0/UUID").filter((testCase) => testCase[1] !== "undefined");

          test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
            `(%s) Validate 'UUID' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = {
                children: [
                  {
                    UUID: givenValue,
                  },
                ],
              };
              assertCaseForProperty("/children/0/UUID", givenObject, itemSchema, caseType, failureMessages);
            }
          );
        });

        describe("Test validation of 'children/code'", () => {
          test.each([
            // ESCOOccupation tests
            [CaseType.Success, "undefined", undefined, ObjectTypes.ESCOOccupation, undefined],
            [
              CaseType.Failure,
              "null",
              null,
              ObjectTypes.ESCOOccupation,
              constructSchemaError("/children/0/code", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              "",
              ObjectTypes.ESCOOccupation,
              constructSchemaError(
                "/children/0/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "an invalid code",
              "invalidCode",
              ObjectTypes.ESCOOccupation,
              constructSchemaError(
                "/children/0/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "a valid code of different type",
              getTestLocalOccupationCode(),
              ObjectTypes.ESCOOccupation,
              constructSchemaError(
                "/children/0/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
              ),
            ],
            [CaseType.Success, "a valid code", getTestESCOOccupationCode(), ObjectTypes.ESCOOccupation, undefined],
            // LocalOccupation tests
            [CaseType.Success, "undefined", undefined, ObjectTypes.LocalOccupation, undefined],
            [
              CaseType.Failure,
              "null",
              null,
              ObjectTypes.LocalOccupation,
              constructSchemaError("/children/0/code", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              "",
              ObjectTypes.LocalOccupation,
              constructSchemaError(
                "/children/0/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "an invalid code",
              "invalidCode",
              ObjectTypes.LocalOccupation,
              constructSchemaError(
                "/children/0/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "a valid code of different type",
              getTestESCOOccupationCode(),
              ObjectTypes.LocalOccupation,
              constructSchemaError(
                "/children/0/code",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
              ),
            ],
            [
              CaseType.Success,
              "a valid local occupation code",
              getTestLocalOccupationCode(),
              ObjectTypes.LocalOccupation,
              undefined,
            ],
            [
              CaseType.Success,
              "a valid ESCO local occupation code",
              getTestESCOLocalOccupationCode(),
              ObjectTypes.LocalOccupation,
              undefined,
            ],
          ] as const)(
            "%s Validate '/children/0/code' when it is %s with %s(%s) objectType",
            (caseType, __description, givenValue, objectType, failureMessage) => {
              // GIVEN an object with given value
              const givenObject = {
                ...givenValidOccupationGETResponse,
                children: [
                  {
                    code: givenValue,
                    objectType,
                  },
                ],
              };

              // THEN export the object to validation accordingly
              assertCaseForProperty("/children/0/code", givenObject, itemSchema, caseType, failureMessage);
            }
          );
        });

        describe("Test validation of 'children/preferredLabel'", () => {
          const testCases = getStdNonEmptyStringTestCases(
            "/children/0/preferredLabel",
            OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
          ).filter((testCase) => testCase[1] !== "undefined");

          test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
            `(%s) Validate 'preferredLabel' when it is %s`,
            (caseType, _description, givenValue, failureMessage) => {
              const givenObject = {
                children: [
                  {
                    preferredLabel: givenValue,
                  },
                ],
              };
              assertCaseForProperty("/children/0/preferredLabel", givenObject, itemSchema, caseType, failureMessage);
            }
          );
        });

        describe("Test validation of '/children/objectType'", () => {
          test.each([
            [CaseType.Success, "undefined", undefined, undefined],
            [CaseType.Failure, "null", null, constructSchemaError("/children/0/objectType", "type", "must be string")],
            [
              CaseType.Failure,
              "empty string",
              "",
              constructSchemaError("/children/0/objectType", "enum", "must be equal to one of the allowed values"),
            ],
            [
              CaseType.Failure,
              "an invalid objectType",
              "invalidObjectType",
              constructSchemaError("/children/0/objectType", "enum", "must be equal to one of the allowed values"),
            ],
          ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
            const givenObject = {
              children: [
                {
                  objectType: givenValue,
                },
              ],
            };
            assertCaseForProperty("/children/0/objectType", givenObject, itemSchema, caseType, failureMessage);
          });
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
          [CaseType.Success, "a valid requiresSkills object array", [givenSkill], undefined],
        ])("(%s) Validate 'requiresSkills' when it is %s", (caseType, _description, givenValue, failureMessages) => {
          const givenObject = {
            requiresSkills: givenValue,
          };
          assertCaseForProperty("requiresSkills", givenObject, itemSchema, caseType, failureMessages);
        });
      });

      describe("Test validation of requiresSkills fields", () => {
        describe("Test validation of 'requiresSkills/id'", () => {
          const testCases = getStdObjectIdTestCases("/requiresSkills/0/id").filter((t) => t[1] !== "undefined");

          test.each([
            ...testCases,
            [
              CaseType.Failure,
              "undefined",
              undefined,
              constructSchemaError("/requiresSkills/0", "required", "must have required property 'id'"),
            ],
          ])(`(%s) Validate 'id' when it is %s`, (caseType, _description, givenValue, failureMessages) => {
            const givenObject = { requiresSkills: [{ id: givenValue }] };
            assertCaseForProperty("/requiresSkills/0/id", givenObject, itemSchema, caseType, failureMessages);
          });
        });

        describe("Test validation of 'requiresSkills/UUID'", () => {
          const testCases = getStdUUIDTestCases("/requiresSkills/0/UUID").filter((t) => t[1] !== "undefined");

          test.each([
            ...testCases,
            [
              CaseType.Failure,
              "undefined",
              undefined,
              constructSchemaError("/requiresSkills/0", "required", "must have required property 'UUID'"),
            ],
          ])(`(%s) Validate 'UUID' when it is %s`, (caseType, _description, givenValue, failureMessages) => {
            const givenObject = { requiresSkills: [{ UUID: givenValue }] };
            assertCaseForProperty("/requiresSkills/0/UUID", givenObject, itemSchema, caseType, failureMessages);
          });
        });

        describe("Test validation of 'requiresSkills/preferredLabel'", () => {
          const testCases = getStdNonEmptyStringTestCases(
            "/requiresSkills/0/preferredLabel",
            OccupationConstants.PREFERRED_LABEL_MAX_LENGTH
          ).filter((t) => t[1] !== "undefined");

          test.each([
            ...testCases,
            [
              CaseType.Failure,
              "undefined",
              undefined,
              constructSchemaError("/requiresSkills/0", "required", "must have required property 'preferredLabel'"),
            ],
          ])(`(%s) Validate 'preferredLabel' when it is %s`, (caseType, _description, givenValue, failureMessage) => {
            const givenObject = { requiresSkills: [{ preferredLabel: givenValue }] };
            assertCaseForProperty(
              "/requiresSkills/0/preferredLabel",
              givenObject,
              itemSchema,
              caseType,
              failureMessage
            );
          });
        });

        describe("Test validation of 'requiresSkills/isLocalized'", () => {
          test.each([
            [CaseType.Success, "true", true, undefined],
            [CaseType.Success, "false", false, undefined],
            [
              CaseType.Failure,
              "string instead of boolean",
              "true",
              constructSchemaError("/requiresSkills/0/isLocalized", "type", "must be boolean"),
            ],
          ])(`(%s) Validate 'isLocalized' when it is %s`, (caseType, _desc, givenValue, failureMessage) => {
            const givenObject = { requiresSkills: [{ isLocalized: givenValue }] };
            assertCaseForProperty("/requiresSkills/0/isLocalized", givenObject, itemSchema, caseType, failureMessage);
          });
        });

        describe("Test validation of 'requiresSkills/objectType'", () => {
          test.each([
            [
              CaseType.Success,
              "valid Skill objectType",
              OccupationEnums.Relations.RequiredSkills.ObjectTypes.Skill,
              undefined,
            ],
            [
              CaseType.Failure,
              "invalid objectType",
              "InvalidType",
              constructSchemaError(
                "/requiresSkills/0/objectType",
                "enum",
                "must be equal to one of the allowed values"
              ),
            ],
            [
              CaseType.Failure,
              "undefined objectType",
              undefined,
              constructSchemaError("/requiresSkills/0", "required", "must have required property 'objectType'"),
            ],
          ])(`(%s) Validate 'objectType' when it is %s`, (caseType, _desc, givenValue, failureMessage) => {
            const givenObject = { requiresSkills: [{ objectType: givenValue }] };
            assertCaseForProperty("/requiresSkills/0/objectType", givenObject, itemSchema, caseType, failureMessage);
          });
        });

        describe("Test validation of 'requiresSkills/relationType'", () => {
          test.each([
            // Success cases for ESCOOccupation
            [
              CaseType.Success,
              "ESSENTIAL relationType for ESCOOccupation",
              {
                ...givenSkill,
                relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL,
                occupationType: OccupationEnums.OccupationType.ESCOOccupation,
              },
              undefined,
            ],
            [
              CaseType.Success,
              "OPTIONAL relationType for ESCOOccupation",
              {
                ...givenSkill,
                relationType: OccupationEnums.OccupationToSkillRelationType.OPTIONAL,
                occupationType: OccupationEnums.OccupationType.ESCOOccupation,
              },
              undefined,
            ],
            [
              CaseType.Success,
              "NONE relationType for ESCOOccupation",
              {
                ...givenSkill,
                relationType: OccupationEnums.OccupationToSkillRelationType.NONE,
                occupationType: OccupationEnums.OccupationType.ESCOOccupation,
              },
              undefined,
            ],
            [
              CaseType.Failure,
              "undefined relationType for ESCOOccupation",
              {
                ...givenSkill,
                relationType: undefined,
                occupationType: OccupationEnums.OccupationType.ESCOOccupation,
              },
              constructSchemaError("/requiresSkills/0", "required", "must have required property 'relationType'"),
            ],
            [
              CaseType.Failure,
              "null relationType for ESCOOccupation",
              {
                ...givenSkill,
                relationType: null,
                occupationType: OccupationEnums.OccupationType.ESCOOccupation,
              },
              constructSchemaError("/requiresSkills/0/relationType", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "invalid relationType for ESCOOccupation",
              {
                ...givenSkill,
                relationType: "InvalidRelation",
                occupationType: OccupationEnums.OccupationType.ESCOOccupation,
              },
              constructSchemaError(
                "/requiresSkills/0/relationType",
                "enum",
                "must be equal to one of the allowed values"
              ),
            ],

            // Success cases for LocalOccupation
            [
              CaseType.Success,
              "undefined relationType for LocalOccupation",
              {
                ...givenSkill,
                relationType: undefined,
                occupationType: OccupationEnums.OccupationType.LocalOccupation,
              },
              undefined,
            ],
            [
              CaseType.Success,
              "null relationType for LocalOccupation",
              {
                ...givenSkill,
                relationType: null,
                occupationType: OccupationEnums.OccupationType.LocalOccupation,
              },
              undefined,
            ],
            [
              CaseType.Success,
              "valid relationType for LocalOccupation (not enforced)",
              {
                ...givenSkill,
                relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL,
                occupationType: OccupationEnums.OccupationType.LocalOccupation,
              },
              undefined,
            ],
            [
              CaseType.Failure,
              "invalid relationType for LocalOccupation",
              {
                ...givenSkill,
                relationType: "InvalidRelation",
                occupationType: OccupationEnums.OccupationType.LocalOccupation,
              },
              constructSchemaError(
                "/requiresSkills/0/relationType",
                "enum",
                "must be equal to one of the allowed values"
              ),
            ],
          ])(
            "%s Validate requiresSkills/0/relationType when it is %s",
            (caseType, _description, skillValue, expectedError) => {
              const givenObject = {
                ...givenValidOccupationGETResponse,
                occupationType: skillValue.occupationType,
                requiresSkills: [skillValue],
              };
              assertCaseForProperty("requiresSkills/0/relationType", givenObject, itemSchema, caseType, expectedError);
            }
          );
        });
        describe("Test validation of 'requiresSkills/signallingValue'", () => {
          test.each([
            [
              CaseType.Failure,
              "undefined",
              { ...givenSkill, signallingValue: undefined },
              constructSchemaError("/requiresSkills/0", "required", "must have required property 'signallingValue'"),
            ],
            [
              CaseType.Failure,
              "null",
              { ...givenSkill, signallingValue: null },
              constructSchemaError("/requiresSkills/0/signallingValue", "type", "must be number"),
            ],
            [
              CaseType.Failure,
              "negative value",
              { ...givenSkill, signallingValue: -1 },
              constructSchemaError(
                "/requiresSkills/0/signallingValue",
                "minimum",
                `must be >= ${OccupationConstants.SIGNALLING_VALUE_MIN}`
              ),
            ],
            [
              CaseType.Failure,
              "value over max",
              { ...givenSkill, signallingValue: OccupationConstants.SIGNALLING_VALUE_MAX + 1 },
              constructSchemaError(
                "/requiresSkills/0/signallingValue",
                "maximum",
                `must be <= ${OccupationConstants.SIGNALLING_VALUE_MAX}`
              ),
            ],
            [CaseType.Success, "valid value", { ...givenSkill, signallingValue: 5 }, undefined],
          ])(
            "%s Validate requiresSkills/0/signallingValue when it is %s",
            (caseType, _description, skillValue, expectedError) => {
              const givenObject = { requiresSkills: [skillValue] };
              assertCaseForProperty(
                "requiresSkills/0/signallingValue",
                givenObject,
                itemSchema,
                caseType,
                expectedError
              );
            }
          );
        });

        describe("Test validation of 'requiresSkills/signallingValueLabel'", () => {
          test.each([
            [
              CaseType.Failure,
              "undefined",
              { ...givenSkill, signallingValueLabel: undefined },
              constructSchemaError(
                "/requiresSkills/0",
                "required",
                "must have required property 'signallingValueLabel'"
              ),
            ],
            [
              CaseType.Failure,
              "null",
              { ...givenSkill, signallingValueLabel: null },
              constructSchemaError("/requiresSkills/0/signallingValueLabel", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              { ...givenSkill, signallingValueLabel: "" },
              constructSchemaError(
                "/requiresSkills/0/signallingValueLabel",
                "pattern",
                `must match pattern "${RegExp_Str_NotEmptyString}"`
              ),
            ],
            [CaseType.Success, "valid value", { ...givenSkill, signallingValueLabel: "High Priority" }, undefined],
          ])(
            "%s Validate requiresSkills/0/signallingValueLabel when it is %s",
            (caseType, _description, skillValue, expectedError) => {
              const givenObject = { requiresSkills: [skillValue] };
              assertCaseForProperty(
                "requiresSkills/0/signallingValueLabel",
                givenObject,
                itemSchema,
                caseType,
                expectedError
              );
            }
          );
        });
      });

      describe("Test validation of 'createdAt'", () => {
        testTimestampField<OccupationAPISpecs.Types.POST.Request.Payload>("createdAt", itemSchema);
      });

      describe("Test validation of 'updatedAt'", () => {
        testTimestampField<OccupationAPISpecs.Types.POST.Request.Payload>("updatedAt", itemSchema);
      });
    });
  });
});
