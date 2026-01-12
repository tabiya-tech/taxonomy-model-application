import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
  testNonEmptyStringField,
  testURIField,
  testUUIDField,
  testStringField,
  testUUIDArray,
  testNonEmptyURIStringField,
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
import {
  getTestESCOOccupationCode,
  getTestISCOGroupCode,
  getTestLocalGroupCode,
  getTestLocalOccupationCode,
} from "../../../_test_utilities/testUtils";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import OccupationConstants from "../../constants";
import OccupationAPISpecs from "../../index";
import OccupationEnums from "../../enums";
import { ObjectTypes } from "../../../common/objectTypes";

describe("Test Occupation Children Response Schema Validity", () => {
  // WHEN the OccupationAPISpecs.GET.Children.Response.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationAPISpecs.Schemas.GET.Children.Response.Payload",
    OccupationAPISpecs.Schemas.GET.Children.Response.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Schemas.GET.Children.Response.Payload schema", () => {
  // GIVEN a minimal parent (for embedded field in full occupation)
  const givenMinimalParent = {
    id: getMockId(2),
    UUID: randomUUID(),
    code: getTestISCOGroupCode(),
    occupationGroupCode: getTestISCOGroupCode(),
    preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationEnums.Relations.Parent.ObjectTypes.ISCOGroup,
  };

  // GIVEN a minimal child (for embedded field in full occupation)
  const givenMinimalChild = {
    id: getMockId(3),
    UUID: randomUUID(),
    code: getTestLocalOccupationCode(),
    occupationGroupCode: getTestLocalGroupCode(),
    preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationEnums.Relations.Children.ObjectTypes.LocalOccupation,
  };

  // GIVEN a full child object (which mimics a full occupation response)
  const givenValidChild = {
    id: getMockId(1),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID(), randomUUID()],
    originUUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
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
    parent: givenMinimalParent,
    children: [givenMinimalChild],
    requiresSkills: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // GIVEN a valid paginated response
  const givenValidPaginatedResponse = {
    data: [givenValidChild],
    limit: OccupationConstants.MAX_LIMIT,
    nextCursor: getTestString(OccupationConstants.MAX_CURSOR_LENGTH),
  };

  // Test with a valid paginated response
  testSchemaWithValidObject(
    "OccupationAPISpecs.Schemas.GET.Children.Response.Payload",
    OccupationAPISpecs.Schemas.GET.Children.Response.Payload,
    givenValidPaginatedResponse
  );

  // Test with additional properties
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Schemas.GET.Children.Response.Payload",
    OccupationAPISpecs.Schemas.GET.Children.Response.Payload,
    {
      ...givenValidPaginatedResponse,
      extraProperty: "extra test property",
    }
  );

  describe("Validate OccupationAPISpecs.Schemas.GET.Children.Response.Payload fields", () => {
    const givenSchema = OccupationAPISpecs.Schemas.GET.Children.Response.Payload;

    describe("Test validation of 'limit'", () => {
      const testCases = getStdLimitTestCases("limit", OccupationConstants.MAX_LIMIT, true);
      test.each(testCases)("%s %s", (caseType, desc, value, failure) => {
        const givenObject = { ...givenValidPaginatedResponse, limit: value };
        if (value === undefined) delete (givenObject as Record<string, unknown>).limit;
        assertCaseForProperty("limit", givenObject, givenSchema, caseType, failure);
      });
    });

    describe("Test validation of 'nextCursor'", () => {
      const testCases = getStdCursorTestCases("nextCursor", OccupationConstants.MAX_CURSOR_LENGTH, false, true);

      test.each(testCases)(`(%s) Validate 'nextCursor' when it is %s`, (caseType, _desc, value, failureMessage) => {
        const givenObject = { ...givenValidPaginatedResponse, nextCursor: value };
        // We need to delete the property if it is undefined, to make sure it is not added as undefined
        if (value === undefined) delete (givenObject as Record<string, unknown>).nextCursor;
        assertCaseForProperty("nextCursor", givenObject, givenSchema, caseType, failureMessage);
      });
    });

    describe("Test validation of child item fields", () => {
      const itemSchema = OccupationAPISpecs.Schemas.GET.Children.Response.Payload.properties.data.items;
      const givenValidOccupationGETResponse = givenValidChild; // Alias for reused tests

      describe("Test validation of 'id'", () => {
        testObjectIdField("id", itemSchema);
      });

      describe("Test validation of 'UUID'", () => {
        testUUIDField<OccupationAPISpecs.Types.GET.Children.Response.Payload>("UUID", itemSchema);
      });

      describe("Test validation of 'originUUID'", () => {
        testUUIDField<OccupationAPISpecs.Types.GET.Children.Response.Payload>("originUUID", itemSchema);
      });

      describe("Test validation of 'UUIDHistory'", () => {
        testUUIDArray<OccupationAPISpecs.Types.GET.Children.Response.Payload>(
          "UUIDHistory",
          itemSchema,
          [],
          true,
          true
        );
      });

      describe("Test validation of 'path'", () => {
        testURIField<OccupationAPISpecs.Types.GET.Children.Response.Payload>(
          "path",
          OccupationAPISpecs.Constants.PATH_URI_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'tabiyaPath'", () => {
        testURIField<OccupationAPISpecs.Types.GET.Children.Response.Payload>(
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
            CaseType.Success,
            "a valid local occupation code",
            getTestLocalOccupationCode(),
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
            CaseType.Success,
            "a valid ISCO Group code",
            getTestISCOGroupCode(),
            OccupationEnums.OccupationType.ESCOOccupation,
            undefined,
          ],
          [
            CaseType.Success,
            "a valid Local Group code",
            getTestLocalGroupCode(),
            OccupationEnums.OccupationType.LocalOccupation,
            undefined,
          ],
          [
            CaseType.Success,
            "a valid ISCO Group code",
            getTestISCOGroupCode(),
            OccupationEnums.OccupationType.LocalOccupation,
            undefined,
          ],
          [
            CaseType.Failure,
            "invalid code",
            "!!!",
            OccupationEnums.OccupationType.LocalOccupation,
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}|${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "invalid code",
            "!!!",
            OccupationEnums.OccupationType.ESCOOccupation,
            constructSchemaError(
              "/occupationGroupCode",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
            ),
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
        testNonEmptyStringField<OccupationAPISpecs.Types.GET.Children.Response.Payload>(
          "preferredLabel",
          OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'description'", () => {
        testStringField<OccupationAPISpecs.Types.GET.Children.Response.Payload>(
          "description",
          OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
          itemSchema
        );
      });

      describe("Test validation of 'definition'", () => {
        testStringField<OccupationAPISpecs.Types.GET.Children.Response.Payload>(
          "definition",
          OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH,
          itemSchema
        );
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

          test.each(testCases)(
            `(%s) Validate 'id' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = {
                ...givenValidOccupationGETResponse,
                parent: {
                  ...givenValidOccupationGETResponse.parent,
                  id: givenValue,
                },
              };
              assertCaseForProperty("/parent/id", givenObject, itemSchema, caseType, failureMessages);
            }
          );
        });

        describe("Test validation of 'parent/UUID'", () => {
          const testCases = getStdUUIDTestCases("/parent/UUID").filter((testCase) => testCase[1] !== "undefined");

          test.each(testCases)(
            `(%s) Validate 'UUID' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = {
                ...givenValidOccupationGETResponse,
                parent: {
                  ...givenValidOccupationGETResponse.parent,
                  UUID: givenValue,
                },
              };
              assertCaseForProperty("/parent/UUID", givenObject, itemSchema, caseType, failureMessages);
            }
          );
        });

        describe("Test validation of 'parent/code'", () => {
          test.each([
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
            [CaseType.Success, "a valid code", getTestISCOGroupCode(), ObjectTypes.ISCOGroup, undefined],
          ] as const)(
            "%s Validate 'parent/code' when it is %s with %s objectType",
            (caseType, _description, givenValue, objectType, failureMessage) => {
              const givenObject = {
                ...givenValidOccupationGETResponse,
                parent: {
                  ...givenValidOccupationGETResponse.parent,
                  code: givenValue,
                  objectType,
                },
              };
              assertCaseForProperty("/parent/code", givenObject, itemSchema, caseType, failureMessage);
            }
          );
        });

        describe("Test validation of 'parent/preferredLabel'", () => {
          const testCases = getStdNonEmptyStringTestCases(
            "/parent/preferredLabel",
            OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
          ).filter((testCase) => testCase[1] !== "undefined");

          test.each(testCases)(
            `(%s) Validate 'preferredLabel' when it is %s`,
            (caseType, _description, givenValue, failureMessage) => {
              const givenObject = {
                ...givenValidOccupationGETResponse,
                parent: {
                  ...givenValidOccupationGETResponse.parent,
                  preferredLabel: givenValue,
                },
              };
              assertCaseForProperty("/parent/preferredLabel", givenObject, itemSchema, caseType, failureMessage);
            }
          );
        });

        describe("Test validation of 'parent/objectType'", () => {
          test.each([
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
            [CaseType.Success, "a valid objectType", ObjectTypes.LocalGroup, undefined],
            [CaseType.Success, "a valid objectType", ObjectTypes.ESCOOccupation, undefined],
            [CaseType.Success, "a valid objectType", ObjectTypes.LocalOccupation, undefined],
          ])("%s Validate 'objectType' when it is %s", (caseType, _description, givenValue, failureMessage) => {
            let givenCode = givenValidOccupationGETResponse.parent.code;
            if (givenValue === ObjectTypes.ISCOGroup) givenCode = getTestISCOGroupCode();
            if (givenValue === ObjectTypes.LocalGroup) givenCode = getTestLocalGroupCode();
            if (givenValue === ObjectTypes.ESCOOccupation) givenCode = getTestESCOOccupationCode();
            if (givenValue === ObjectTypes.LocalOccupation) givenCode = getTestLocalOccupationCode();

            const givenObject = {
              ...givenValidOccupationGETResponse,
              parent: {
                ...givenValidOccupationGETResponse.parent,
                code: givenCode,
                objectType: givenValue,
              },
            };
            assertCaseForProperty("/parent/objectType", givenObject, itemSchema, caseType, failureMessage);
          });
        });

        describe("Test validation of 'parent/occupationGroupCode'", () => {
          test.each([
            [
              CaseType.Failure,
              "null",
              null,
              ObjectTypes.ISCOGroup,
              constructSchemaError("/parent/occupationGroupCode", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              "",
              ObjectTypes.ISCOGroup,
              constructSchemaError(
                "/parent/occupationGroupCode",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
              ),
            ],
            [CaseType.Success, "a valid ISCO group code", getTestISCOGroupCode(), ObjectTypes.ISCOGroup, undefined],
            [
              CaseType.Failure,
              "invalid code",
              "!!!",
              ObjectTypes.ISCOGroup,
              constructSchemaError(
                "/parent/occupationGroupCode",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "null",
              null,
              ObjectTypes.LocalGroup,
              constructSchemaError("/parent/occupationGroupCode", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              "",
              ObjectTypes.LocalGroup,
              constructSchemaError(
                "/parent/occupationGroupCode",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
              ),
            ],
            [CaseType.Success, "a valid local group code", getTestLocalGroupCode(), ObjectTypes.LocalGroup, undefined],
            [
              CaseType.Failure,
              "invalid code",
              "!!!",
              ObjectTypes.LocalGroup,
              constructSchemaError(
                "/parent/occupationGroupCode",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "null",
              null,
              ObjectTypes.ESCOOccupation,
              constructSchemaError("/parent/occupationGroupCode", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              "",
              ObjectTypes.ESCOOccupation,
              constructSchemaError(
                "/parent/occupationGroupCode",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "invalid code",
              "!!!",
              ObjectTypes.ESCOOccupation,
              constructSchemaError(
                "/parent/occupationGroupCode",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
              ),
            ],
            [
              CaseType.Success,
              "a valid ISCO group code",
              getTestISCOGroupCode(),
              ObjectTypes.ESCOOccupation,
              undefined,
            ],
            [
              CaseType.Failure,
              "null",
              null,
              ObjectTypes.LocalOccupation,
              constructSchemaError("/parent/occupationGroupCode", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "empty string",
              "",
              ObjectTypes.LocalOccupation,
              constructSchemaError(
                "/parent/occupationGroupCode",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}|${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
              ),
            ],
            [
              CaseType.Failure,
              "invalid code",
              "!!!",
              ObjectTypes.LocalOccupation,
              constructSchemaError(
                "/parent/occupationGroupCode",
                "pattern",
                `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}|${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
              ),
            ],
            [
              CaseType.Success,
              "a valid local group code",
              getTestLocalGroupCode(),
              ObjectTypes.LocalOccupation,
              undefined,
            ],
          ] as const)(
            "%s Validate 'parent/occupationGroupCode' when it is %s with %s objectType",
            (caseType, _description, givenValue, objectType, failureMessage) => {
              let givenCode = givenValidOccupationGETResponse.parent.code;
              if (objectType === ObjectTypes.ISCOGroup) givenCode = getTestISCOGroupCode();
              if (objectType === ObjectTypes.LocalGroup) givenCode = getTestLocalGroupCode();
              if (objectType === ObjectTypes.ESCOOccupation) givenCode = getTestESCOOccupationCode();
              if (objectType === ObjectTypes.LocalOccupation) givenCode = getTestLocalOccupationCode();

              const givenObject = {
                ...givenValidOccupationGETResponse,
                parent: {
                  ...givenValidOccupationGETResponse.parent,
                  code: givenCode,
                  occupationGroupCode: givenValue,
                  objectType,
                },
              };
              assertCaseForProperty("/parent/occupationGroupCode", givenObject, itemSchema, caseType, failureMessage);
            }
          );
        });
      });
    });
  });
});
