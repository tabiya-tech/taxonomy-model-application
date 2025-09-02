import { randomUUID } from "crypto";
import {
  testNonEmptyStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testTimestampField,
  testURIField,
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

describe("Test OccupationGroupAPISpecs schema validity", () => {
  // WHEN the OccupationGroupAPISpecs.POST.Response.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.POST.Request.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Request.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.POST.Response.Payload schema", () => {
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupEnums.ENUMS.ObjectTypes.ISCOGroup,
  };

  const givenChild = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupEnums.ENUMS.ObjectTypes.ESCOOccupation,
  };

  const givenValidOccupationGroupPOSTResponse = {
    id: getMockId(1),
    UUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    groupType: OccupationGroupEnums.ENUMS.ObjectTypes.LocalGroup,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    originUri: "https://foo/bar",
    code: getTestString(10),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(15), getTestString(25)],
    importId: getTestString(10),
    modelId: getMockId(1),
    parent: givenParent,
    children: [givenChild],
  };

  // WHEN the object is valid
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.POST.Response.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
    givenValidOccupationGroupPOSTResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.POST.Response.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
    givenValidOccupationGroupPOSTResponse
  );

  describe("Validate OccupationGroupAPISpecs.Schemas.POST.Response.Payload fields", () => {
    describe("Test validate of 'id'", () => {
      testObjectIdField("id", OccupationGroupAPISpecs.Schemas.POST.Response.Payload);
    });

    describe("Test validate of 'UUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "UUID",
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload
      );
    });

    describe("Test validation of 'path'", () => {
      testURIField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "path",
        OccupationGroupAPISpecs.Constants.MAX_URI_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload
      );
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "tabiyaPath",
        OccupationGroupAPISpecs.Constants.MAX_URI_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload
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
        [CaseType.Success, "a valid groupType", OccupationGroupEnums.ENUMS.ObjectTypes.ISCOGroup, undefined],
      ])("%s Validate 'groupType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          groupType: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "groupType",
          givenObject,
          OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validate of 'createdAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "createdAt",
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload
      );
    });
    describe("Test validate of 'updatedAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "updatedAt",
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload
      );
    });
    describe("Test validation of 'originUri'", () => {
      testURIField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "originUri",
        OccupationGroupAPISpecs.Constants.MAX_URI_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload
      );
    });
    describe("Test validate of 'code'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "code",
        OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload
      );
    });
    describe("Test validate of 'description'", () => {
      testStringField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "description",
        OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload
      );
    });
    describe("Test validate of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "preferredLabel",
        OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload
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
        assertCaseForProperty(
          "altLabels",
          givenObject,
          OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validate of 'importId'", () => {
      testStringField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "importId",
        OccupationGroupAPISpecs.Constants.IMPORT_ID_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Response.Payload
      );
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupAPISpecs.Schemas.POST.Response.Payload);
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
        // GIVEN an object with the given value
        const givenObject = {
          parent: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "parent",
          givenObject,
          OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
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
              OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
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
              OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages
            );
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
            assertCaseForProperty(
              "/parent/code",
              givenObject,
              OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
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
              OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
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
          [CaseType.Success, "a valid objectType", OccupationGroupEnums.ENUMS.ObjectTypes.ISCOGroup, undefined],
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
            OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
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
            objectType: OccupationGroupEnums.ENUMS.ObjectTypes.ESCOOccupation,
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
              objectType: OccupationGroupEnums.ENUMS.ObjectTypes.ESCOOccupation,
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
          OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
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
              OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
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
              OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
              caseType,
              failureMessages
            );
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
            assertCaseForProperty(
              "/children/0/code",
              givenObject,
              OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
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
              OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
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
          [CaseType.Success, "a valid objectType", OccupationGroupEnums.ENUMS.ObjectTypes.ISCOGroup, undefined],
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
            OccupationGroupAPISpecs.Schemas.POST.Response.Payload,
            caseType,
            failureMessage
          );
        });
      });
    });
  });
});
