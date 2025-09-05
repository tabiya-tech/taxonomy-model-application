import {
  testNonEmptyStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testTimestampField,
  testURIField,
  testURIOrURNField,
  testUUIDArray,
  testUUIDField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupAPISpecs from "./index";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import OccupationGroupEnums from "./enums";
import {
  getStdNonEmptyStringTestCases,
  getStdObjectIdTestCases,
  getStdUUIDTestCases,
} from "_test_utilities/stdSchemaTestCases";

describe("Test OccupationGroup Schema Validity", () => {
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Schema.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.GET.Response.Payload schema", () => {
  // GIVEN a valid response payload object
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupEnums.ObjectTypes.ISCOGroup,
  };

  const givenChild = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupEnums.ObjectTypes.ESCOOccupation,
  };

  const ValidOccupationGroupData = {
    id: getMockId(1),
    modelId: getMockId(1),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    UUIDHistory: [],
    code: getTestString(10),
    preferredLabel: getTestString(20),
    originUri: "https://foo/bar",
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    description: getTestString(50),
    altLabels: [getTestString(15), getTestString(25)],
    groupType: OccupationGroupEnums.ObjectTypes.ISCOGroup,
    parent: givenParent,
    children: [givenChild],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const givenValidOccupationGroupGETResponse = {
    data: [ValidOccupationGroupData],
    limit: 1,
    nextCursor: null,
  };

  // WHEN the object is valid
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Payload,
    givenValidOccupationGroupGETResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Payload,
    { ...givenValidOccupationGroupGETResponse, extraProperty: "foo" }
  );

  describe("Validate OccupationGroupAPISpecs.Schemas.GET.Response.Payload fields", () => {
    // spread the items of the schema into the schema itself
    // we do this because we want to test the fields, not the fact that they are in an array
    // and in cases where we use reusable test functions we do not have control over the givenObject
    const { properties, ...rest } = OccupationGroupAPISpecs.Schemas.GET.Response.Payload;
    const givenSchema = { ...rest, ...properties.data.items };

    describe("Test validate of 'id' ", () => {
      testObjectIdField("id", givenSchema);
    });

    describe("Test Validate of 'UUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.Types.GET.Response.Payload>("UUID", givenSchema);
    });

    describe("Test validate of 'originUUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.Types.GET.Response.Payload>("originUUID", givenSchema);
    });

    describe("Test validate of 'UUIDHistory'", () => {
      testUUIDArray<OccupationGroupAPISpecs.Types.GET.Response.Payload>("UUIDHistory", givenSchema, [], true);
    });

    describe("Test validate of 'path'", () => {
      testURIField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "path",
        OccupationGroupAPISpecs.Constants.MAX_PATH_URI_LENGTH,
        givenSchema
      );
    });

    describe("Test validate of 'tabiyaPath'", () => {
      testURIField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "tabiyaPath",
        OccupationGroupAPISpecs.Constants.MAX_TABIYA_PATH_LENGTH,
        givenSchema
      );
    });

    describe("Test validate of 'originUri'", () => {
      testURIOrURNField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "originUri",
        OccupationGroupAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        givenSchema
      );
    });

    describe("Test validate of 'code'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "code",
        OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH,
        givenSchema
      );
    });

    describe("Test validate of 'description'", () => {
      testStringField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "description",
        OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        givenSchema
      );
    });
    describe("Test validate of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.GET.Response.Payload>(
        "preferredLabel",
        OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        givenSchema
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
        assertCaseForProperty("groupType", givenObject, givenSchema, caseType, failureMessage);
      });
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
          CaseType.Success,
          "an array of valid altLabels strings",
          [
            getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
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
      testTimestampField<OccupationGroupAPISpecs.Types.GET.Response.Payload>("createdAt", givenSchema);
    });
    describe("Test validate of 'updatedAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.GET.Response.Payload>("updatedAt", givenSchema);
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
        [CaseType.Success, "a valid parent object", ValidOccupationGroupData.parent, undefined],
      ])("(%s) Validate 'parent' when it is %s", (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        const givenObject = {
          parent: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty("parent", givenObject, givenSchema, caseType, failureMessages);
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
            assertCaseForProperty("/parent/id", givenObject, givenSchema, caseType, failureMessages);
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
            assertCaseForProperty("/parent/UUID", givenObject, givenSchema, caseType, failureMessages);
          }
        );
      });

      describe("Test validation of 'parent/code'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/parent/code",
          OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "undefined");

        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'code' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            // GIVEN an object with given value
            const givenObject = {
              parent: {
                code: givenValue,
              },
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty("/parent/code", givenObject, givenSchema, caseType, failureMessage);
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
            assertCaseForProperty("/parent/preferredLabel", givenObject, givenSchema, caseType, failureMessage);
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
          [CaseType.Success, "a valid objectType", OccupationGroupEnums.ObjectTypes.ISCOGroup, undefined],
        ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
          // GIVEN an object with given value
          const givenObject = {
            parent: {
              objectType: givenValue,
            },
          };

          // THEN export the object to validate accordingly
          assertCaseForProperty("/parent/objectType", givenObject, givenSchema, caseType, failureMessage);
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
            objectType: OccupationGroupEnums.ObjectTypes.ESCOOccupation,
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
              objectType: OccupationGroupEnums.ObjectTypes.ESCOOccupation,
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
      describe("Test validation of 'children/code'", () => {
        const testCases = getStdNonEmptyStringTestCases(
          "/children/0/code",
          OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH
        ).filter((testCase) => testCase[1] !== "undefined");

        test.each([...testCases, [CaseType.Success, "undefined", undefined, undefined]])(
          `(%s) Validate 'code' when it is %s`,
          (caseType, _description, givenValue, failureMessage) => {
            // GIVEN an object with given value
            const givenObject = {
              children: [
                {
                  code: givenValue,
                },
              ],
            };
            // THEN expect the object to validate accordingly
            assertCaseForProperty("/children/0/code", givenObject, givenSchema, caseType, failureMessage);
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
          [CaseType.Success, "a valid objectType", OccupationGroupEnums.ObjectTypes.ISCOGroup, undefined],
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
