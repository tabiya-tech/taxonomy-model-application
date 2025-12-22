import { randomUUID } from "crypto";
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
import OccupationGroupAPISpecs from ".";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationGroupEnums from "./enums";
import { getTestString } from "_test_utilities/specialCharacters";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import {
  getStdNonEmptyStringTestCases,
  getStdObjectIdTestCases,
  getStdUUIDTestCases,
} from "_test_utilities/stdSchemaTestCases";
import OccupationGroupRegexes from "./regex";
import {
  getTestESCOLocalOccupationCode,
  getTestESCOOccupationCode,
  getTestISCOGroupCode,
  getTestLocalGroupCode,
  getTestLocalOccupationCode,
} from "../_test_utilities/testUtils";

describe("Test OccupationGroupAPISpecs schema validity", () => {
  // WHEN the OccupationGroupAPISpecs.GET.Parent.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload
  );
});

describe("Test objects against the  OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload schema", () => {
  // GIVEN a valid response payload object
  const givenValidOccupationGroupGETParentResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    UUIDHistory: [],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    groupType: OccupationGroupEnums.ObjectTypes.LocalGroup,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    originUri: "https://foo/bar",
    code: getTestLocalGroupCode(),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(15), getTestString(25)],
    modelId: getMockId(1),
    parent: null,
    children: [],
  };

  // WHEN the object is valid
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
    givenValidOccupationGroupGETParentResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
    { ...givenValidOccupationGroupGETParentResponse, extraProperty: "foo" }
  );
  describe("Validate OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload fields", () => {
    describe("Test validate of 'id'", () => {
      testObjectIdField("id", OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload);
    });
    describe("Test validate of 'UUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload>(
        "UUID",
        OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload
      );
    });
    describe("Test validate of 'originUUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload>(
        "originUUID",
        OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload
      );
    });
    describe("Test validate of 'UUIDHistory'", () => {
      testUUIDArray<OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload>(
        "UUIDHistory",
        OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
        [],
        true
      );
    });
    describe("Test validation of 'path'", () => {
      testURIField<OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload>(
        "path",
        OccupationGroupAPISpecs.Constants.MAX_PATH_URI_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload
      );
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload>(
        "tabiyaPath",
        OccupationGroupAPISpecs.Constants.MAX_TABIYA_PATH_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload
      );
    });
    describe("Test validate of 'groupType'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'groupType'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/groupType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/groupType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "an invalid groupType",
          "invalidGroupType",
          constructSchemaError("/groupType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "a valid groupType", OccupationGroupEnums.ObjectTypes.ISCOGroup, undefined],
        [CaseType.Success, "a valid groupType:localGroup", OccupationGroupEnums.ObjectTypes.LocalGroup, undefined],
      ])("%s Validate 'groupType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          groupType: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "groupType",
          givenObject,
          OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
          caseType,
          failureMessage
        );
      });
    });
    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload>(
        "originUri",
        OccupationGroupAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload
      );
    });
    describe("Test validate of 'code'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          constructSchemaError("", "required", "must have required property 'code'"),
        ],
        [
          CaseType.Failure,
          "null",
          null,
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          constructSchemaError("/code", "type", "must be string"),
        ],
        [
          CaseType.Failure,
          "empty string",
          "",
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.LOCAL_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "an invalid code",
          "1234",
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.LOCAL_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Success,
          "a valid Local code",
          getTestLocalGroupCode(),
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          undefined,
        ],
        [
          CaseType.Success,
          "a valid ISCO code",
          getTestISCOGroupCode(),
          OccupationGroupEnums.ObjectTypes.ISCOGroup,
          undefined,
        ],
        // Wrong pattern for wrong groupType
        [
          CaseType.Failure,
          "ISCO code with LocalGroup type",
          getTestISCOGroupCode(),
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.LOCAL_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "Local code with ISCOGroup type",
          getTestLocalGroupCode(),
          OccupationGroupEnums.ObjectTypes.ISCOGroup,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.ISCO_GROUP_CODE}"`
          ),
        ],
      ])(
        "%s Validate 'code' when it is %s with %s groupType",
        (caseType, _description, givenValue, groupType, failureMessage) => {
          const givenObject = {
            ...givenValidOccupationGroupGETParentResponse,
            code: givenValue,
            groupType,
          };

          assertCaseForProperty(
            "code",
            givenObject,
            OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });
    describe("Test validate of 'description'", () => {
      testStringField<OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload>(
        "description",
        OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload
      );
    });
    describe("Test validate of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload>(
        "preferredLabel",
        OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload
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
            getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1),
          ],
          undefined,
        ],
      ])("%s Validate 'altLabels' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          altLabels: givenValue,
        };

        // THEN export the array to validate accordingly
        assertCaseForProperty(
          "altLabels",
          givenObject,
          OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
          caseType,
          failureMessage
        );
      });
    });
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload);
    });

    describe("Test validate of 'createdAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload>(
        "createdAt",
        OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload
      );
    });
    describe("Test validate of 'updatedAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.GET.Response.Parent.Payload>(
        "updatedAt",
        OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload
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
        [CaseType.Failure, "a string", "foo", constructSchemaError("/parent", "type", "must be object,null")],
        [CaseType.Failure, "an array", ["foo", "bar"], constructSchemaError("/parent", "type", "must be object,null")],
        [
          CaseType.Success,
          "a valid parent object",
          {
            id: getMockId(1),
            UUID: randomUUID(),
            code: getTestISCOGroupCode(),
            preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
            objectType: OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
          },
          undefined,
        ],
      ])("(%s) Validate 'parent' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = {
          ...givenValidOccupationGroupGETParentResponse,
          parent: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "parent",
          givenObject,
          OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
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
            // GIVEN an object with given value
            const givenObject = {
              parent: {
                id: givenValue,
              },
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "/parent/id",
              givenObject,
              OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
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
            // GIVEN an object with given value
            const givenObject = {
              parent: {
                UUID: givenValue,
              },
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "/parent/UUID",
              givenObject,
              OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
              caseType,
              failureMessages
            );
          }
        );
      });
      describe("Test validation of '/parent/code'", () => {
        test.each([
          [
            CaseType.Success,
            "undefined",
            undefined,
            OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
            undefined,
          ],
          [
            CaseType.Failure,
            "null",
            null,
            OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
            constructSchemaError("/parent/code", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
            constructSchemaError(
              "/parent/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "invalidCode",
            OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
            constructSchemaError(
              "/parent/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "Too long code",
            getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH + 1),
            OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
            constructSchemaError(
              "/parent/code",
              "maxLength",
              `must NOT have more than ${OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH} characters`
            ),
          ],
          [
            CaseType.Success,
            "a valid ISCO code",
            getTestISCOGroupCode(),
            OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
            undefined,
          ],
          [
            CaseType.Success,
            "a valid Local code",
            getTestLocalGroupCode(),
            OccupationGroupEnums.Relations.Parent.ObjectTypes.LocalGroup,
            undefined,
          ],
          // Wrong pattern for wrong objectType
          [
            CaseType.Failure,
            "ISCO code with LocalGroup objectType",
            getTestISCOGroupCode(),
            OccupationGroupEnums.Relations.Parent.ObjectTypes.LocalGroup,
            constructSchemaError(
              "/parent/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.LOCAL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "Local code with ISCOGroup objectType",
            getTestLocalGroupCode(),
            OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
            constructSchemaError(
              "/parent/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.ISCO_GROUP_CODE}"`
            ),
          ],
        ])(
          "%s Validate '/parent/code' when it is %s with %s objectType",
          (caseType, __description, givenValue, objectType, failureMessage) => {
            // GIVEN an object with given value
            const givenObject = {
              parent: {
                code: givenValue,
                objectType,
              },
            };

            // THEN export the object to validate accordingly
            assertCaseForProperty(
              "/parent/code",
              givenObject,
              OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
              caseType,
              failureMessage
            );
          }
        );
      });
      describe("Test validation of 'parent/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/parent/preferredLabel",
          OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "undefined");

        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'preferredLabel' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            // GIVEN an object with given value
            const givenObject = {
              parent: {
                preferredLabel: givenValue,
              },
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "/parent/preferredLabel",
              givenObject,
              OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
              caseType,
              failureMessage
            );
          }
        );
      });
      describe("Test validate of '/parent/objectType'", () => {
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
          [
            CaseType.Success,
            "a valid objectType",
            OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup,
            undefined,
          ],
        ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          // GIVEN an object with given value
          const givenObject = {
            parent: {
              objectType: givenValue,
            },
          };

          // THEN export the object to validate accordingly
          assertCaseForProperty(
            "/parent/objectType",
            givenObject,
            OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
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

        [
          CaseType.Failure,
          "a valid children object",
          {
            id: getMockId(1),
            UUID: randomUUID(),
            code: getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
            preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
            objectType: OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation,
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
              code: getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
              preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
              objectType: OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation,
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
        assertCaseForProperty(
          "children",
          givenObject,
          OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
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
            // GIVEN an object with given value
            const givenObject = {
              children: [
                {
                  id: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "/children/0/id",
              givenObject,
              OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
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
            // GIVEN an object with given value
            const givenObject = {
              children: [
                {
                  UUID: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty(
              "/children/0/UUID",
              givenObject,
              OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
              caseType,
              failureMessages
            );
          }
        );
      });
      describe("Test validation of 'children/code'", () => {
        test.each([
          [
            CaseType.Success,
            "undefined",
            undefined,
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
            undefined,
          ],
          [
            CaseType.Failure,
            "null",
            null,
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
            constructSchemaError("/children/0/code", "type", "must be string"),
          ],
          [
            CaseType.Failure,
            "empty string",
            "",
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "a random string",
            getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "an invalid code",
            "invalidCode",
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "Too long code",
            getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH + 1),
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
            constructSchemaError(
              "/children/0/code",
              "maxLength",
              `must NOT have more than ${OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH} characters`
            ),
          ],
          // Valid codes for each objectType
          [
            CaseType.Success,
            "valid ISCO group code",
            getTestISCOGroupCode(),
            OccupationGroupEnums.Relations.Children.ObjectTypes.ISCOGroup,
            undefined,
          ],
          [
            CaseType.Success,
            "valid Local group code",
            getTestLocalGroupCode(),
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalGroup,
            undefined,
          ],
          [
            CaseType.Success,
            "valid ESCO occupation code",
            getTestESCOOccupationCode(),
            OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation,
            undefined,
          ],
          [
            CaseType.Success,
            "valid Local occupation code",
            getTestLocalOccupationCode(),
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
            undefined,
          ],
          [
            CaseType.Success,
            "valid ESCO local occupation code",
            getTestESCOLocalOccupationCode(),
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
            undefined,
          ],
          // Wrong patterns for wrong objectTypes
          [
            CaseType.Failure,
            "ISCO code with LocalGroup objectType",
            getTestISCOGroupCode(),
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalGroup,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.LOCAL_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "Local group code with ISCOGroup objectType",
            getTestLocalGroupCode(),
            OccupationGroupEnums.Relations.Children.ObjectTypes.ISCOGroup,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.ISCO_GROUP_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "Local occupation code with ESCOOccupation objectType",
            getTestLocalOccupationCode(),
            OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.ESCO_OCCUPATION_CODE}"`
            ),
          ],
          [
            CaseType.Failure,
            "ESCO occupation code with LocalOccupation objectType",
            getTestESCOOccupationCode(),
            OccupationGroupEnums.Relations.Children.ObjectTypes.LocalOccupation,
            constructSchemaError(
              "/children/0/code",
              "pattern",
              `must match pattern "${OccupationGroupRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
            ),
          ],
        ])(
          "%s Validate '/children/0/code' when it is %s with %s objectType",
          (caseType, __description, givenValue, objectType, failureMessage) => {
            // GIVEN an object with given value
            const givenObject = {
              ...givenValidOccupationGroupGETParentResponse,
              children: [
                {
                  code: givenValue,
                  objectType,
                },
              ],
            };

            // THEN export the object to validate accordingly
            assertCaseForProperty(
              "/children/0/code",
              givenObject,
              OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
              caseType,
              failureMessage
            );
          }
        );
      });
      describe("Test validation of 'children/preferredLabel'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/children/0/preferredLabel",
          OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH
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
            assertCaseForProperty(
              "/children/0/preferredLabel",
              givenObject,
              OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
              caseType,
              failureMessage
            );
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
            OccupationGroupEnums.Relations.Children.ObjectTypes.ISCOGroup,
            undefined,
          ],
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
          assertCaseForProperty(
            "/children/0/objectType",
            givenObject,
            OccupationGroupAPISpecs.Schemas.GET.Response.Parent.Payload,
            caseType,
            failureMessage
          );
        });
      });
    });
  });
});
