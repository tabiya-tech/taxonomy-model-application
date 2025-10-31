import {
  testNonEmptyStringField,
  testNonEmptyURIStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testTimestampField,
  testURIField,
  testUUIDArray,
  testUUIDField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillGroupAPISpecs from "./index";
import SkillGroupEnums from "./enums";
import SkillGroupRegexes from "./regex";

import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import {
  getStdNonEmptyStringTestCases,
  getStdObjectIdTestCases,
  getStdUUIDTestCases,
} from "_test_utilities/stdSchemaTestCases";
import { getTestSkillGroupCode } from "../_test_utilities/testUtils";

describe("Test SkillGroup Schema Validity", () => {
  testValidSchema(
    "SkillGroupAPISpecs.Schemas.GET.Response.Schema.Payload",
    SkillGroupAPISpecs.Schemas.GET.Response.Payload
  );
});

describe("Test the object against the SkillGroupAPISpecs.Schemas.GET.Response.Payload schema", () => {
  // GIVEN a valid response payload objet
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestSkillGroupCode(),
    preferredLabel: getTestString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillGroupEnums.Relations.Parents.ObjectTypes.SkillGroup,
  };
  const givenChild = {
    id: getMockId(2),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
    code: getTestSkillGroupCode(),
  };
  const validSkillGroupResponsePayload = {
    id: getMockId(1),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    code: getTestSkillGroupCode(),
    description: getTestString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    preferredLabel: getTestString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    parents: [givenParent],
    children: [givenChild],
    altLabels: [getTestString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    modelId: getMockId(1),
    scopeNote: getTestString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    UUIDHistory: [randomUUID()],
  };

  const givenValidSkillGroupGETResponse = {
    data: [validSkillGroupResponsePayload],
    limit: 1,
    nextCursor: null,
  };
  // WHEN the object is valid
  // THEN expect the objet to validate successfully
  testSchemaWithValidObject(
    "SkillGroupAPISpecs.Schemas.GET.Response.Payload",
    SkillGroupAPISpecs.Schemas.GET.Response.Payload,
    givenValidSkillGroupGETResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to fail validation
  testSchemaWithAdditionalProperties(
    "SkillGroupAPISpecs.Schemas.GET.Response.Payload",
    SkillGroupAPISpecs.Schemas.GET.Response.Payload,
    givenValidSkillGroupGETResponse
  );
  describe("Validate SkillGroupAPISpecs.Schemas.GET.Response.Payload fields", () => {
    // spread the items of the schema into the schema itself
    // we do this because we want to test the fields, not the fact that they are in an array
    // and in cases where we use reusable test functions we do not have control over the givenObject
    const { properties, ...rest } = SkillGroupAPISpecs.Schemas.GET.Response.Payload;
    const givenSchema = { ...rest, ...properties.data.items };

    describe("Test validate of 'id' ", () => {
      testObjectIdField("id", givenSchema);
    });
    describe("Test Validate of 'UUID'", () => {
      testUUIDField<SkillGroupAPISpecs.Types.GET.Response.Payload>("UUID", givenSchema);
    });

    describe("Test validate of 'originUUID'", () => {
      testUUIDField<SkillGroupAPISpecs.Types.GET.Response.Payload>("originUUID", givenSchema);
    });

    describe("Test validate of 'UUIDHistory'", () => {
      testUUIDArray<SkillGroupAPISpecs.Types.GET.Response.Payload>("UUIDHistory", givenSchema, [], true, true);
    });

    describe("Test validate of 'path'", () => {
      testURIField<SkillGroupAPISpecs.Types.GET.Response.Payload>(
        "path",
        SkillGroupAPISpecs.Constants.MAX_PATH_URI_LENGTH,
        givenSchema
      );
    });

    describe("Test validate of 'tabiyaPath'", () => {
      testURIField<SkillGroupAPISpecs.Types.GET.Response.Payload>(
        "tabiyaPath",
        SkillGroupAPISpecs.Constants.MAX_TABIYA_PATH_LENGTH,
        givenSchema
      );
    });

    describe("Test validate of 'originUri'", () => {
      testNonEmptyURIStringField<SkillGroupAPISpecs.Types.GET.Response.Payload>(
        "originUri",
        SkillGroupAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        givenSchema
      );
    });
    describe("Test validate of 'code'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'code'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/code", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/code", "pattern", `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`),
        ],
        [
          CaseType.Failure,
          "an invalid code",
          "invalidCode",
          constructSchemaError("/code", "pattern", `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`),
        ],
        [
          CaseType.Failure,
          "Too long code",
          getTestString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH + 1),
          constructSchemaError(
            "/code",
            "maxLength",
            `must NOT have more than ${SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH} characters`
          ),
        ],
        [CaseType.Success, "a valid code", getTestSkillGroupCode(), undefined],
      ])("%s Validate 'code' when it is %s with", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          code: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty("code", givenObject, givenSchema, caseType, failureMessage);
      });
    });
    describe("Test validate of 'description'", () => {
      testStringField<SkillGroupAPISpecs.Types.GET.Response.Payload>(
        "description",
        SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        givenSchema
      );
    });
    describe("Test validate of 'scopeNote'", () => {
      testStringField<SkillGroupAPISpecs.Types.GET.Response.Payload>(
        "scopeNote",
        SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH,
        givenSchema
      );
    });

    describe("Test validate of 'preferredLabel'", () => {
      testNonEmptyStringField<SkillGroupAPISpecs.Types.GET.Response.Payload>(
        "preferredLabel",
        SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        givenSchema
      );
    });
    describe("Test validate of 'altLabels'", () => {
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
            getTestString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1),
          ],
          undefined,
        ],
      ])("%s Validate 'altLabels' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          altLabels: givenValue,
        };

        // THEN export the array to validate accordingly
        assertCaseForProperty("altLabels", givenObject, givenSchema, caseType, failureMessage);
      });
    });
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", givenSchema);
    });
    describe("Test validate of 'createdAt'", () => {
      testTimestampField<SkillGroupAPISpecs.Types.GET.Response.Payload>("createdAt", givenSchema);
    });
    describe("Test validate of 'updatedAt'", () => {
      testTimestampField<SkillGroupAPISpecs.Types.GET.Response.Payload>("updatedAt", givenSchema);
    });
    describe("Test validation of 'parents'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'parents'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/parents", "type", "must be array")],
        [CaseType.Failure, "a string", "foo", constructSchemaError("/parents", "type", "must be array")],
        [
          CaseType.Failure,
          "an array of strings",
          ["foo", "bar"],
          [
            constructSchemaError("/parents/0", "type", "must be object"),
            constructSchemaError("/parents/1", "type", "must be object"),
          ],
        ],

        [
          CaseType.Failure,
          "a valid parents object",
          {
            id: getMockId(1),
            UUID: randomUUID(),
            code: getTestSkillGroupCode(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
            preferredLabel: getTestString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
            objectType: SkillGroupEnums.Relations.Parents.ObjectTypes.SkillGroup,
          },
          constructSchemaError("/parents", "type", "must be array"),
        ],
        [
          CaseType.Success,
          "a valid parents object array",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              code: getTestSkillGroupCode(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
              preferredLabel: getTestString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
              objectType: SkillGroupEnums.Relations.Parents.ObjectTypes.SkillGroup,
            },
          ],
          undefined,
        ],
      ])("(%s) Validate 'parents' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = {
          parents: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty("parents", givenObject, givenSchema, caseType, failureMessages);
      });
    });
    describe("Test validation of parents fields", () => {
      describe("Test validation of 'parents/id'", () => {
        const testCases = getStdObjectIdTestCases("/parents/0/id").filter((testCase) => testCase[1] !== "undefined");
        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'id' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with given value
            const givenObject = {
              parents: [
                {
                  id: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty("/parents/0/id", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'parents/UUID'", () => {
        const testCases = getStdUUIDTestCases("/parents/0/UUID").filter((testCase) => testCase[1] !== "undefined");
        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with given value
            const givenObject = {
              parents: [
                {
                  UUID: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty("/parents/0/UUID", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'parents/code'", () => {
        test.each([
          [CaseType.Success, "undefined", undefined, undefined],
          [CaseType.Failure, "null", null, constructSchemaError("/parents/0/code", "type", "must be string")],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/parents/0/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "a random string",
            getTestString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
            constructSchemaError(
              "/parents/0/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "invalidCode",
            constructSchemaError(
              "/parents/0/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "Too long code",
            getTestString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH + 1),
            constructSchemaError(
              "/parents/0/code",
              "maxLength",
              `must NOT have more than ${SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH} characters`
            ),
          ],
          // Valid codes for each objectType
          [CaseType.Success, "valid Skill group code", getTestSkillGroupCode(), undefined],

          [
            CaseType.Failure,
            "invalid Skill group code",
            getTestString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH - 2, "9"),
            constructSchemaError(
              "/parents/0/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
        ])(
          "%s Validate '/parents/0/code' when it is %s with ",
          (caseType, __description, givenValue, failureMessage) => {
            // GIVEN an object with given value
            const givenObject = {
              ...validSkillGroupResponsePayload,
              parents: [
                {
                  code: givenValue,
                },
              ],
            };

            // THEN export the object to validate accordingly
            assertCaseForProperty("/parents/0/code", givenObject, givenSchema, caseType, failureMessage);
          }
        );
      });
      describe("Test validation of 'parents/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/parents/0/preferredLabel",
          SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "undefined");

        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'preferredLabel' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            // GIVEN an object with given value
            const givenObject = {
              parents: [
                {
                  preferredLabel: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty("/parents/0/preferredLabel", givenObject, givenSchema, caseType, failureMessage);
          }
        );
      });
      describe("Test validate of '/parents/objectType'", () => {
        test.each([
          [CaseType.Success, "undefined", undefined, undefined],
          [CaseType.Failure, "null", null, constructSchemaError("/parents/0/objectType", "type", "must be string")],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError("/parents/0/objectType", "enum", "must be equal to one of the allowed values"),
          ],
          [
            CaseType.Failure,
            "an invalid objectType",
            "invalidObjectType",
            constructSchemaError("/parents/0/objectType", "enum", "must be equal to one of the allowed values"),
          ],
          [CaseType.Success, "a valid objectType", SkillGroupEnums.Relations.Parents.ObjectTypes.SkillGroup, undefined],
        ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          // GIVEN an object with given value
          const givenObject = {
            parents: [
              {
                objectType: givenValue,
              },
            ],
          };

          // THEN export the object to validate accordingly
          assertCaseForProperty("/parents/0/objectType", givenObject, givenSchema, caseType, failureMessage);
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
          CaseType.Failure,
          "a valid parents object",
          {
            id: getMockId(1),
            UUID: randomUUID(),
            code: getTestSkillGroupCode(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
            preferredLabel: getTestString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
            objectType: SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
          },
          constructSchemaError("/children", "type", "must be array"),
        ],
        [
          CaseType.Success,
          "a valid children object array",
          [
            {
              id: getMockId(1),
              UUID: randomUUID(),
              code: getTestSkillGroupCode(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
              preferredLabel: getTestString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
              objectType: SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
            },
            {
              id: getMockId(1),
              UUID: randomUUID(),
              isLocalized: false,
              preferredLabel: getTestString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
              objectType: SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
            },
          ],
          undefined,
        ],
      ])("(%s) Validate 'children' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = {
          children: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty("children", givenObject, givenSchema, caseType, failureMessages);
      });
    });

    describe("Test validation of children fields", () => {
      describe("Test validation of 'children/id'", () => {
        const testCases = getStdObjectIdTestCases("/children/0/id").filter((testCase) => testCase[1] !== "undefined");
        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'id' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with given value
            const givenObject = {
              children: [
                {
                  id: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty("/children/0/id", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });
      describe("Test validation of 'children/UUID'", () => {
        const testCases = getStdUUIDTestCases("/children/0/UUID").filter((testCase) => testCase[1] !== "undefined");
        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            // GIVEN an object with given value
            const givenObject = {
              children: [
                {
                  UUID: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty("/children/0/UUID", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });

      describe("Test validation of 'children/isLocalized'", () => {
        test.each([
          [
            CaseType.Success,
            "undefined",
            undefined,
            SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
            undefined,
          ],
          [
            CaseType.Failure,
            "null",
            null,
            SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
            constructSchemaError("/children/0/isLocalized", "type", "must be boolean"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
            constructSchemaError("/children/0/isLocalized", "type", "must be boolean"),
          ],
          [
            CaseType.Failure,
            "a random string",
            getTestString(20),
            SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
            constructSchemaError("/children/0/isLocalized", "type", "must be boolean"),
          ],

          // Valid isLocalized for each objectType
          [
            CaseType.Success,
            "valid isLocalized for group",
            true,
            SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
            undefined,
          ],
          [
            CaseType.Success,
            "valid isLocalized for group",
            false,
            SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
            undefined,
          ],
        ])(
          "%s Validate '/children/0/isLocalized' when it is %s with ",
          (caseType, __description, givenValue, objectType, failureMessage) => {
            // GIVEN an object with given value
            const givenObject = {
              ...validSkillGroupResponsePayload,
              children: [
                {
                  objectType,
                  isLocalized: givenValue,
                },
              ],
            };

            // THEN export the object to validate accordingly
            assertCaseForProperty("/children/0/isLocalized", givenObject, givenSchema, caseType, failureMessage);
          }
        );
      });
      describe("Test validation of 'children/code'", () => {
        test.each([
          [CaseType.Success, "undefined", undefined, SkillGroupEnums.Relations.Children.ObjectTypes.Skill, undefined],
          [
            CaseType.Failure,
            "null",
            null,
            SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
            constructSchemaError("/children/0/code", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "a random string",
            getTestString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH),
            SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "invalidCode",
            SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "Too long code",
            getTestString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH + 1),
            SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
            constructSchemaError(
              "/children/0/code",
              "maxLength",
              `must NOT have more than ${SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH} characters`
            ),
          ],
          // Valid codes for each objectType
          [
            CaseType.Success,
            "valid Skill group code",
            getTestSkillGroupCode(),
            SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
            undefined,
          ],

          [
            CaseType.Failure,
            "invalid Skill group code",
            getTestString(SkillGroupAPISpecs.Constants.CODE_MAX_LENGTH - 2, "9"),
            SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`
            ),
          ],
        ])(
          "%s Validate '/children/0/code' when it is %s with ",
          (caseType, __description, givenValue, objectType, failureMessage) => {
            // GIVEN an object with given value
            const givenObject = {
              ...validSkillGroupResponsePayload,
              children: [
                {
                  objectType,
                  code: givenValue,
                },
              ],
            };

            // THEN export the object to validate accordingly
            assertCaseForProperty("/children/0/code", givenObject, givenSchema, caseType, failureMessage);
          }
        );
      });
      describe("Test validation of 'children/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/children/0/preferredLabel",
          SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "undefined");

        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'preferredLabel' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            // GIVEN an object with given value
            const givenObject = {
              children: [
                {
                  preferredLabel: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty("/children/0/preferredLabel", givenObject, givenSchema, caseType, failureMessage);
          }
        );
      });
      describe("Test validate of '/children/objectType'", () => {
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
          [
            CaseType.Success,
            "a valid objectType",
            SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
            undefined,
          ],
          [CaseType.Success, "a valid objectType", SkillGroupEnums.Relations.Children.ObjectTypes.Skill, undefined],
        ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          // GIVEN an object with given value
          const givenObject = {
            children: [
              {
                objectType: givenValue,
              },
            ],
          };

          // THEN export the object to validate accordingly
          assertCaseForProperty("/children/0/objectType", givenObject, givenSchema, caseType, failureMessage);
        });
      });
    });
  });
});
