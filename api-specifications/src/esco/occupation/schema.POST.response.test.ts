import { randomUUID } from "crypto";
import {
  testNonEmptyStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testNonEmptyURIStringField,
  testSchemaWithValidObject,
  testStringField,
  testTimestampField,
  testUUIDField,
  testValidSchema,
  testBooleanField,
  testUUIDArray,
  testURIField,
} from "_test_utilities/stdSchemaTests";

import OccupationAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationEnums from "./enums";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import LocaleAPISpecs from "locale";
import OccupationConstants from "./constants";
import {
  getStdNonEmptyStringTestCases,
  getStdObjectIdTestCases,
  getStdUUIDTestCases,
} from "_test_utilities/stdSchemaTestCases";

import { getTestString } from "_test_utilities/specialCharacters";
import {
  getTestESCOLocalOccupationCode,
  getTestESCOOccupationCode,
  getTestISCOGroupCode,
  getTestLocalGroupCode,
  getTestLocalOccupationCode,
} from "../_test_utilities/testUtils";

describe("Test OccupationAPISpecs schema validity", () => {
  // WHEN the OccupationAPISpecs.POST.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("OccupationAPISpecs.Schemas.POST.Response.Payload", OccupationAPISpecs.Schemas.POST.Response.Payload);
});

describe("Test objects against the OccupationAPISpecs.Schemas.POST.Response.Payload schema", () => {
  // GIVEN a valid OccupationPOSTResponse object
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestESCOOccupationCode(),
    preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationEnums.ObjectTypes.ESCOOccupation, // conditional check passes
  };

  const givenChild = {
    id: getMockId(2),
    UUID: randomUUID(),
    code: getTestLocalOccupationCode(),
    preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationEnums.ObjectTypes.LocalOccupation,
  };

  const givenSkill = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(OccupationConstants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: true,
  };

  const givenValidOccupationPOSTResponse = {
    id: getMockId(4),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID(), randomUUID()],
    originUUID: randomUUID(),
    code: getTestESCOOccupationCode(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    occupationGroupCode: getTestISCOGroupCode(),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(OccupationConstants.ALT_LABEL_MAX_LENGTH)],
    definition: getTestString(100),
    regulatedProfessionNote: getTestString(75),
    scopeNote: getTestString(60),
    occupationType: OccupationEnums.OccupationType.ESCOOccupation,
    modelId: getMockId(5),
    isLocalized: true,
    parent: givenParent,
    children: [givenChild],
    requiresSkills: [givenSkill],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // WHEN the object is valid
  // THEN expect the object to validation successfully
  testSchemaWithValidObject(
    "OccupationAPISpecs.Schemas.POST.Response.Payload",
    OccupationAPISpecs.Schemas.POST.Response.Payload,
    givenValidOccupationPOSTResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validation
  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Schemas.POST.Response.Payload",
    OccupationAPISpecs.Schemas.POST.Response.Payload,
    {
      ...givenValidOccupationPOSTResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );

  describe("Validate OccupationAPISpecs.Schemas.POST.Response.Payload fields", () => {
    describe("Test validation of 'id'", () => {
      testObjectIdField("id", OccupationAPISpecs.Schemas.POST.Response.Payload, [LocaleAPISpecs.Schemas.Payload]);
    });

    describe("Test validation of 'UUID'", () => {
      testUUIDField<OccupationAPISpecs.Types.POST.Response.Payload>(
        "UUID",
        OccupationAPISpecs.Schemas.POST.Response.Payload
      );
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<OccupationAPISpecs.Types.POST.Response.Payload>(
        "UUIDHistory",
        OccupationAPISpecs.Schemas.POST.Response.Payload,
        [],
        true
      );
    });

    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<OccupationAPISpecs.Types.POST.Response.Payload>(
        "originUri",
        OccupationAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Response.Payload
      );
    });

    describe("Test validation of 'path'", () => {
      testURIField<OccupationAPISpecs.Types.POST.Response.Payload>(
        "path",
        OccupationAPISpecs.Constants.PATH_URI_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Response.Payload
      );
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<OccupationAPISpecs.Types.POST.Response.Payload>(
        "tabiyaPath",
        OccupationAPISpecs.Constants.TABIYA_PATH_URI_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Response.Payload
      );
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
          "an invalid occupationType",
          "invalidOccupationType",
          constructSchemaError("/occupationType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "a valid occupationType", OccupationEnums.OccupationType.ESCOOccupation, undefined],
        [CaseType.Success, "a valid occupationType", OccupationEnums.OccupationType.LocalOccupation, undefined],
      ])("%s Validate 'occupationType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        const givenObject = { occupationType: givenValue };
        assertCaseForProperty(
          "occupationType",
          givenObject,
          OccupationAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'code'", () => {
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
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
          ),
        ],
        [CaseType.Success, "a valid code", getTestESCOOccupationCode(), undefined],
      ])("%s Validate 'code' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidOccupationPOSTResponse,
          code: givenValue,
        };

        assertCaseForProperty(
          "code",
          givenObject,
          OccupationAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'occupationGroupCode'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'occupationGroupCode'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/occupationGroupCode", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
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
          constructSchemaError(
            "/occupationGroupCode",
            "pattern",
            `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
          ),
        ],
        [CaseType.Success, "a valid code", getTestLocalGroupCode(), undefined],
      ])("%s Validate 'occupationGroupCode' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...givenValidOccupationPOSTResponse,
          occupationGroupCode: givenValue,
          // Override occupationType so the conditional schema applies correctly
          occupationType: OccupationEnums.OccupationType.LocalOccupation,
        };

        assertCaseForProperty(
          "occupationGroupCode",
          givenObject,
          OccupationAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'description'", () => {
      testStringField<OccupationAPISpecs.Types.POST.Response.Payload>(
        "description",
        OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Response.Payload
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationAPISpecs.Types.POST.Response.Payload>(
        "preferredLabel",
        OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Response.Payload
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
      ])("%s Validate 'altLabels' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          altLabels: givenValue,
        };

        // THEN export the array to validation accordingly
        assertCaseForProperty(
          "altLabels",
          givenObject,
          OccupationAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'definition'", () => {
      testStringField<OccupationAPISpecs.Types.POST.Response.Payload>(
        "definition",
        OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Response.Payload
      );
    });

    describe("Test validation of 'regulatedProfessionNote'", () => {
      testStringField<OccupationAPISpecs.Types.POST.Response.Payload>(
        "regulatedProfessionNote",
        OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Response.Payload
      );
    });

    describe("Test validation of 'scopeNote'", () => {
      testStringField<OccupationAPISpecs.Types.POST.Response.Payload>(
        "scopeNote",
        OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH,
        OccupationAPISpecs.Schemas.POST.Response.Payload
      );
    });

    describe("Test validation of 'isLocalized'", () => {
      testBooleanField("isLocalized", OccupationAPISpecs.Schemas.POST.Response.Payload, [
        LocaleAPISpecs.Schemas.Payload,
      ]);
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationAPISpecs.Schemas.POST.Response.Payload, [LocaleAPISpecs.Schemas.Payload]);
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
        [CaseType.Success, "a valid parent object", givenParent, undefined],
      ])("(%s) Validate 'parent' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = { parent: givenValue };
        assertCaseForProperty(
          "parent",
          givenObject,
          OccupationAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });

    describe("Test validation of parent fields", () => {
      describe("Test validation of 'parent/id'", () => {
        const testCases = getStdObjectIdTestCases("/parent/id").filter((testCase) => testCase[1] !== "undefined");
        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'id' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = { parent: { id: givenValue } };
            assertCaseForProperty(
              "/parent/id",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages
            );
          }
        );
      });

      describe("Test validation of 'parent/UUID'", () => {
        const testCases = getStdUUIDTestCases("/parent/UUID").filter((testCase) => testCase[1] !== "undefined");
        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = { parent: { UUID: givenValue } };
            assertCaseForProperty(
              "/parent/UUID",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages
            );
          }
        );
      });

      describe("Test validation of '/parent/code'", () => {
        test.each([
          [CaseType.Success, "undefined", undefined, undefined],
          [CaseType.Failure, "null", null, constructSchemaError("/parent/code", "type", "must be string")],
          [
            CaseType.Failure,
            "empty string",
            "",
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
            constructSchemaError(
              "/parent/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "Too long code",
            getTestString(OccupationAPISpecs.Constants.CODE_MAX_LENGTH + 1),
            constructSchemaError(
              "/parent/code",
              "maxLength",
              `must NOT have more than ${OccupationAPISpecs.Constants.CODE_MAX_LENGTH} characters`
            ),
          ],
          [CaseType.Success, "a valid code", getTestESCOOccupationCode(), undefined],
        ])("%s Validate '/parent/code' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          // GIVEN an object with given value
          const givenObject = {
            ...givenValidOccupationPOSTResponse,
            parent: {
              ...givenValidOccupationPOSTResponse.parent,
              code: givenValue,
            },
          };

          // THEN export the object to validation accordingly
          assertCaseForProperty(
            "/parent/code",
            givenObject,
            OccupationAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessage
          );
        });
      });

      describe("Test validation of 'parent/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/parent/preferredLabel",
          OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "undefined");
        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'preferredLabel' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            const givenObject = { parent: { preferredLabel: givenValue } };
            assertCaseForProperty(
              "/parent/preferredLabel",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessage
            );
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
          [CaseType.Success, "a valid objectType", OccupationEnums.ObjectTypes.ISCOGroup, undefined],
        ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = { parent: { objectType: givenValue } };
          assertCaseForProperty(
            "/parent/objectType",
            givenObject,
            OccupationAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessage
          );
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
        [CaseType.Success, "a valid children object array", [givenChild], undefined],
      ])("(%s) Validate 'children' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = { children: givenValue };
        assertCaseForProperty(
          "children",
          givenObject,
          OccupationAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessages
        );
      });
    });

    describe("Test validation of children fields", () => {
      describe("Test validation of 'children/id'", () => {
        const testCases = getStdObjectIdTestCases("/children/0/id").filter((testCase) => testCase[1] !== "undefined");
        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'id' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = { children: [{ id: givenValue }] };
            assertCaseForProperty(
              "/children/0/id",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages
            );
          }
        );
      });

      describe("Test validation of 'children/UUID'", () => {
        const testCases = getStdUUIDTestCases("/children/0/UUID").filter((testCase) => testCase[1] !== "undefined");
        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'UUID' when it is %s`,
          (caseType, _description, givenValue, failureMessages) => {
            const givenObject = { children: [{ UUID: givenValue }] };
            assertCaseForProperty(
              "/children/0/UUID",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages
            );
          }
        );
      });

      describe("Test validation of 'children/code'", () => {
        test.each([
          [CaseType.Success, "undefined", undefined, undefined],
          [CaseType.Failure, "null", null, constructSchemaError("/children/0/code", "type", "must be string")],
          [
            CaseType.Failure,
            "empty string",
            "",
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "a random string",
            getTestString(OccupationAPISpecs.Constants.CODE_MAX_LENGTH),
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
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "Too long code",
            getTestString(OccupationAPISpecs.Constants.CODE_MAX_LENGTH + 1),
            constructSchemaError(
              "/children/0/code",
              "maxLength",
              `must NOT have more than ${OccupationAPISpecs.Constants.CODE_MAX_LENGTH} characters`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid local occupation code",
            getTestESCOOccupationCode(),
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid local occupation code",
            getTestISCOGroupCode(),
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid local occupation code",
            getTestLocalGroupCode(),
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [CaseType.Success, "valid local occupation code", getTestLocalOccupationCode(), undefined],
          [CaseType.Success, "valid local occupation code", getTestESCOLocalOccupationCode(), undefined],
        ])("%s Validate '/children/0/code' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          // GIVEN an object with given value
          const givenObject = {
            ...givenValidOccupationPOSTResponse,
            children: [
              {
                code: givenValue,
                objectType: givenValidOccupationPOSTResponse.children[0].objectType,
              },
            ],
          };

          // THEN export the object to validation accordingly
          assertCaseForProperty(
            "/children/0/code",
            givenObject,
            OccupationAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessage
          );
        });
      });
      describe("Test validation of 'children/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/children/0/preferredLabel",
          OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "undefined");
        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'preferredLabel' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            const givenObject = { children: [{ preferredLabel: givenValue }] };
            assertCaseForProperty(
              "/children/0/preferredLabel",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessage
            );
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
          [CaseType.Success, "a valid objectType", OccupationEnums.ObjectTypes.ISCOGroup, undefined],
        ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          const givenObject = { children: [{ objectType: givenValue }] };
          assertCaseForProperty(
            "/children/0/objectType",
            givenObject,
            OccupationAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessage
          );
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
        [CaseType.Success, "a valid requiresSkills array", [givenSkill], undefined],
      ])("(%s) Validate 'requiresSkills' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = { requiresSkills: givenValue };
        assertCaseForProperty(
          "requiresSkills",
          givenObject,
          OccupationAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessages
        );
      });

      describe("Test validation of requiresSkills fields", () => {
        describe("Test validation of 'requiresSkills/id'", () => {
          const testCases = getStdObjectIdTestCases("/requiresSkills/0/id").filter((tc) => tc[1] !== "undefined");
          test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
            `(%s) Validate 'id' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = { requiresSkills: [{ id: givenValue }] };
              assertCaseForProperty(
                "/requiresSkills/0/id",
                givenObject,
                OccupationAPISpecs.Schemas.POST.Response.Payload,
                caseType,
                failureMessages
              );
            }
          );
        });

        describe("Test validation of 'requiresSkills/UUID'", () => {
          const testCases = getStdUUIDTestCases("/requiresSkills/0/UUID").filter((tc) => tc[1] !== "undefined");
          test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
            `(%s) Validate 'UUID' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = { requiresSkills: [{ UUID: givenValue }] };
              assertCaseForProperty(
                "/requiresSkills/0/UUID",
                givenObject,
                OccupationAPISpecs.Schemas.POST.Response.Payload,
                caseType,
                failureMessages
              );
            }
          );
        });

        describe("Test validation of 'requiresSkills/preferredLabel'", () => {
          const testCases = getStdNonEmptyStringTestCases(
            "/requiresSkills/0/preferredLabel",
            OccupationConstants.PREFERRED_LABEL_MAX_LENGTH
          ).filter((tc) => tc[1] !== "undefined");
          test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
            `(%s) Validate 'preferredLabel' when it is %s`,
            (caseType, _description, givenValue, failureMessages) => {
              const givenObject = { requiresSkills: [{ preferredLabel: givenValue }] };
              assertCaseForProperty(
                "/requiresSkills/0/preferredLabel",
                givenObject,
                OccupationAPISpecs.Schemas.POST.Response.Payload,
                caseType,
                failureMessages
              );
            }
          );
        });

        describe("Test validation of 'requiresSkills/isLocalized'", () => {
          test.each([
            [
              CaseType.Success,
              "undefined",
              { ...givenSkill, isLocalized: undefined },
              constructSchemaError("/requiresSkills/0/isLocalized", "type", "must be boolean"),
            ],
            [
              CaseType.Failure,
              "null",
              { ...givenSkill, isLocalized: null },
              constructSchemaError("/requiresSkills/0/isLocalized", "type", "must be boolean"),
            ],
            [CaseType.Success, "true", { ...givenSkill, isLocalized: true }, undefined],
            [CaseType.Success, "false", { ...givenSkill, isLocalized: false }, undefined],
          ])(
            "%s Validate requiresSkills/0/isLocalized when it is %s",
            (caseType, _description, skillValue, expectedError) => {
              const givenObject = { requiresSkills: [skillValue] };
              assertCaseForProperty(
                "requiresSkills/0/isLocalized",
                givenObject,
                OccupationAPISpecs.Schemas.POST.Response.Payload,
                caseType,
                expectedError
              );
            }
          );
        });
      });

      describe("Test validation of 'createdAt'", () => {
        testTimestampField<OccupationAPISpecs.Types.POST.Response.Payload>(
          "createdAt",
          OccupationAPISpecs.Schemas.POST.Response.Payload
        );
      });

      describe("Test validation of 'updatedAt'", () => {
        testTimestampField<OccupationAPISpecs.Types.POST.Response.Payload>(
          "updatedAt",
          OccupationAPISpecs.Schemas.POST.Response.Payload
        );
      });
    });
  });
});
