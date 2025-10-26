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
import { RegExp_Str_NotEmptyString } from "../../regex";

import { getTestString } from "_test_utilities/specialCharacters";
import {
  getTestESCOLocalOccupationCode,
  getTestESCOOccupationCode,
  getTestISCOGroupCode,
  getTestLocalGroupCode,
  getTestLocalOccupationCode,
} from "../_test_utilities/testUtils";
import { ObjectTypes } from "../common/objectTypes";

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
    objectType: OccupationEnums.ObjectTypes.Skill,
    relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL,
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
        true,
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
            ...givenValidOccupationPOSTResponse,
            code: givenValue,
            occupationType,
          };

          assertCaseForProperty(
            "code",
            givenObject,
            OccupationAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessage
          );
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
        // Cannot test local group code against ISCO group pattern due to regex overlap
        // Local group code pattern is too permissive and may match other patterns
        // [
        //   CaseType.Failure,
        //   "a valid code of different type",
        //   getTestLocalGroupCode(),
        //   OccupationEnums.OccupationType.ESCOOccupation,
        //   constructSchemaError(
        //     "/occupationGroupCode",
        //     "pattern",
        //     `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
        //   ),
        // ],
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
        // Cannot test ISCO group code against local group pattern due to regex overlap
        // Local group code pattern is too permissive and may accept ISCO group codes
        // [
        //   CaseType.Failure,
        //   "a valid code of different type",
        //   getTestISCOGroupCode(),
        //   OccupationEnums.OccupationType.LocalOccupation,
        //   constructSchemaError(
        //     "/occupationGroupCode",
        //     "pattern",
        //     `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
        //   ),
        // ],
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
            ...givenValidOccupationPOSTResponse,
            occupationGroupCode: givenValue,
            occupationType,
          };

          assertCaseForProperty(
            "occupationGroupCode",
            givenObject,
            OccupationAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessage
          );
        }
      );
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
        [CaseType.Success, "null", null, undefined],
        [CaseType.Failure, "a string", "foo", constructSchemaError("/parent", "type", "must be object,null")],
        [CaseType.Failure, "an array", ["foo", "bar"], constructSchemaError("/parent", "type", "must be object,null")],
        [CaseType.Success, "a valid parent object", givenParent, undefined],
      ])("(%s) Validate 'parent' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        const givenObject = { ...givenValidOccupationPOSTResponse, parent: givenValue };
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
          // Cannot test local group code against ISCO group pattern due to regex overlap
          // Local group code pattern is too permissive and may match other patterns
          // [
          //   CaseType.Failure,
          //   "a valid code of different type",
          //   getTestLocalGroupCode(),
          //   ObjectTypes.ISCOGroup,
          //   constructSchemaError(
          //     "/parent/code",
          //     "pattern",
          //     `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
          //   ),
          // ],
          [CaseType.Success, "a valid code", getTestISCOGroupCode(), ObjectTypes.ISCOGroup, undefined],
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
          // [
          //   CaseType.Failure,
          //   "an invalid code",
          //   "invalidCode",
          //   ObjectTypes.LocalGroup,
          //   constructSchemaError(
          //     "/parent/code",
          //     "pattern",
          //     `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
          //   ),
          // ],
          [
            CaseType.Failure,
            "a valid code of different type",
            getTestISCOGroupCode(),
            ObjectTypes.LocalGroup,
            constructSchemaError(
              "/parent/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
            ),
          ],
          [CaseType.Success, "a valid code", getTestLocalGroupCode(), ObjectTypes.LocalGroup, undefined],
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
              ...givenValidOccupationPOSTResponse,
              parent: {
                ...givenValidOccupationPOSTResponse.parent,
                code: givenValue,
                objectType,
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
          [CaseType.Success, "undefined", undefined, ObjectTypes.ISCOGroup, undefined],
          [
            CaseType.Failure,
            "null",
            null,
            ObjectTypes.ISCOGroup,
            constructSchemaError("/children/0/code", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            ObjectTypes.ISCOGroup,
            constructSchemaError(
              "/children/0/code",
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
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          // Cannot test local group code against ISCO group pattern due to regex overlap
          // Local group code pattern is too permissive and may match other patterns
          // [
          //   CaseType.Failure,
          //   "a valid code of different type",
          //   getTestLocalGroupCode(),
          //   ObjectTypes.ISCOGroup,
          //   constructSchemaError(
          //     "/children/0/code",
          //     "pattern",
          //     `must match pattern "${OccupationAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
          //   ),
          // ],
          [CaseType.Success, "a valid code", getTestISCOGroupCode(), ObjectTypes.ISCOGroup, undefined],
          [
            CaseType.Failure,
            "empty string",
            "",
            ObjectTypes.LocalGroup,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
            ),
          ],
          // Cannot test invalid codes against local group pattern due to regex overlap
          // Local group code pattern is too permissive and accepts many "invalid" codes
          // [
          //   CaseType.Failure,
          //   "an invalid code",
          //   "invalidCode",
          //   ObjectTypes.LocalGroup,
          //   constructSchemaError(
          //     "/children/0/code",
          //     "pattern",
          //     `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
          //   ),
          // ],
          // Cannot test ISCO group code against local group pattern due to regex overlap
          // Local group code pattern is too permissive and may accept ISCO group codes
          // [
          //   CaseType.Failure,
          //   "a valid code of different type",
          //   getTestISCOGroupCode(),
          //   ObjectTypes.LocalGroup,
          //   constructSchemaError(
          //     "/children/0/code",
          //     "pattern",
          //     `must match pattern "${OccupationAPISpecs.Patterns.Str.LOCAL_GROUP_CODE}"`
          //   ),
          // ],
          [CaseType.Success, "a valid code", getTestLocalGroupCode(), ObjectTypes.LocalGroup, undefined],
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
              ...givenValidOccupationPOSTResponse,
              children: [
                {
                  code: givenValue,
                  objectType,
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
            assertCaseForProperty(
              "/requiresSkills/0/id",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages
            );
          });
        });

        describe("Test validation of 'requiresSkills/UUID'", () => {
          const testCases = getStdUUIDTestCases("/requiresSkills/0/UUID").filter((tc) => tc[1] !== "undefined");
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
            assertCaseForProperty(
              "/requiresSkills/0/UUID",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages
            );
          });
        });

        describe("Test validation of 'requiresSkills/preferredLabel'", () => {
          const testCases = getStdNonEmptyStringTestCases(
            "/requiresSkills/0/preferredLabel",
            OccupationConstants.PREFERRED_LABEL_MAX_LENGTH
          ).filter((tc) => tc[1] !== "undefined");
          test.each([
            ...testCases,
            [
              CaseType.Failure,
              "undefined",
              undefined,
              constructSchemaError("/requiresSkills/0", "required", "must have required property 'preferredLabel'"),
            ],
          ])(`(%s) Validate 'preferredLabel' when it is %s`, (caseType, _description, givenValue, failureMessages) => {
            const givenObject = { requiresSkills: [{ preferredLabel: givenValue }] };
            assertCaseForProperty(
              "/requiresSkills/0/preferredLabel",
              givenObject,
              OccupationAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages
            );
          });
        });

        describe("Test validation of 'requiresSkills/isLocalized'", () => {
          test.each([
            [
              CaseType.Failure,
              "undefined",
              { ...givenSkill, isLocalized: undefined },
              constructSchemaError("/requiresSkills/0", "required", "must have required property 'isLocalized'"),
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

        describe("Test validation of 'requiresSkills/objectType'", () => {
          test.each([
            [
              CaseType.Success,
              "valid Skill objectType",
              { ...givenSkill, objectType: OccupationEnums.ObjectTypes.Skill },
              undefined,
            ],
            [
              CaseType.Failure,
              "invalid objectType",
              { ...givenSkill, objectType: "InvalidType" },
              constructSchemaError(
                "/requiresSkills/0/objectType",
                "enum",
                "must be equal to one of the allowed values"
              ),
            ],
            [
              CaseType.Failure,
              "undefined objectType",
              { ...givenSkill, objectType: undefined },
              constructSchemaError("/requiresSkills/0", "required", "must have required property 'objectType'"),
            ],
          ])(
            "%s Validate requiresSkills/0/objectType when it is %s",
            (caseType, _description, skillValue, expectedError) => {
              const givenObject = { requiresSkills: [skillValue] };
              assertCaseForProperty(
                "requiresSkills/0/objectType",
                givenObject,
                OccupationAPISpecs.Schemas.POST.Response.Payload,
                caseType,
                expectedError
              );
            }
          );
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
                ...givenValidOccupationPOSTResponse,
                occupationType: skillValue.occupationType,
                requiresSkills: [skillValue],
              };
              assertCaseForProperty(
                "requiresSkills/0/relationType",
                givenObject,
                OccupationAPISpecs.Schemas.POST.Response.Payload,
                caseType,
                expectedError
              );
            }
          );
        });

        describe("Test validation of 'requiresSkills/relationType'", () => {
          test.each([
            [
              CaseType.Success,
              "ESSENTIAL relationType for ESCOOccupation",
              OccupationEnums.OccupationType.ESCOOccupation,
              { ...givenSkill, relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL },
              undefined,
            ],
            [
              CaseType.Success,
              "OPTIONAL relationType for ESCOOccupation",
              OccupationEnums.OccupationType.ESCOOccupation,
              { ...givenSkill, relationType: OccupationEnums.OccupationToSkillRelationType.OPTIONAL },
              undefined,
            ],
            [
              CaseType.Success,
              "NONE relationType for ESCOOccupation",
              OccupationEnums.OccupationType.ESCOOccupation,
              { ...givenSkill, relationType: OccupationEnums.OccupationToSkillRelationType.NONE },
              undefined,
            ],
            [
              CaseType.Failure,
              "undefined relationType for ESCOOccupation",
              OccupationEnums.OccupationType.ESCOOccupation,
              { ...givenSkill, relationType: undefined },
              constructSchemaError("/requiresSkills/0", "required", "must have required property 'relationType'"),
            ],
            [
              CaseType.Failure,
              "null relationType for ESCOOccupation",
              OccupationEnums.OccupationType.ESCOOccupation,
              { ...givenSkill, relationType: null },
              constructSchemaError("/requiresSkills/0/relationType", "type", "must be string"),
            ],
            [
              CaseType.Failure,
              "invalid relationType for ESCOOccupation",
              OccupationEnums.OccupationType.ESCOOccupation,
              { ...givenSkill, relationType: "InvalidRelation" },
              constructSchemaError(
                "/requiresSkills/0/relationType",
                "enum",
                "must be equal to one of the allowed values"
              ),
            ],
            [
              CaseType.Success,
              "undefined relationType for LocalOccupation",
              OccupationEnums.OccupationType.LocalOccupation,
              { ...givenSkill, relationType: undefined },
              undefined,
            ],
            [
              CaseType.Success,
              "null relationType for LocalOccupation",
              OccupationEnums.OccupationType.LocalOccupation,
              { ...givenSkill, relationType: null },
              undefined,
            ],
            [
              CaseType.Success,
              "valid relationType for LocalOccupation (allowed but not required)",
              OccupationEnums.OccupationType.LocalOccupation,
              { ...givenSkill, relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL },
              undefined,
            ],
            [
              CaseType.Failure,
              "invalid relationType for LocalOccupation",
              OccupationEnums.OccupationType.LocalOccupation,
              { ...givenSkill, relationType: "InvalidRelation" },
              constructSchemaError(
                "/requiresSkills/0/relationType",
                "enum",
                "must be equal to one of the allowed values"
              ),
            ],
          ])(
            "%s Validate requiresSkills/0/relationType when it is %s",
            (caseType, _description, occupationType, skillValue, expectedError) => {
              const givenObject = {
                ...givenValidOccupationPOSTResponse,
                occupationType,
                requiresSkills: [skillValue],
              };
              assertCaseForProperty(
                "requiresSkills/0/relationType",
                givenObject,
                OccupationAPISpecs.Schemas.POST.Response.Payload,
                caseType,
                expectedError
              );
            }
          );
        });
        describe("Test validation of 'requiresSkills/relationType'", () => {
          test.each([
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
          ])(
            "%s Validate requiresSkills/0/relationType when it is %s",
            (caseType, _description, skillValue, expectedError) => {
              const givenObject = {
                ...givenValidOccupationPOSTResponse,
                occupationType: skillValue.occupationType,
                requiresSkills: [skillValue],
              };
              assertCaseForProperty(
                "requiresSkills/0/relationType",
                givenObject,
                OccupationAPISpecs.Schemas.POST.Response.Payload,
                caseType,
                expectedError
              );
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
                OccupationAPISpecs.Schemas.POST.Response.Payload,
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
