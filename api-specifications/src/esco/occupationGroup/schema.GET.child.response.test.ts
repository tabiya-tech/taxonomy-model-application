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
import OccupationGroupAPISpecs from "./index";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import OccupationGroupEnums from "./enums";
import OccupationGroupRegexes from "./regex";
import {
  getTestESCOOccupationCode,
  getTestISCOGroupCode,
  getTestLocalGroupCode,
  getTestLocalOccupationCode,
} from "../_test_utilities/testUtils";

describe("Test OccupationGroup child Validity", () => {
  // WHEN the OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload schema", () => {
  // GIVEN a valid response payload object
  const givenValidOccupationGroupGETChildResponsePayload = {
    id: getMockId(1),
    parentId: getMockId(2),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    UUIDHistory: [],
    originUri: "https://foo/bar",
    code: getTestLocalGroupCode(),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(15), getTestString(25)],
    objectType: OccupationGroupEnums.Relations.Children.ObjectTypes.LocalGroup,
    modelId: getMockId(1),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // WHEN the object is valid
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload with valid object",
    OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload,
    givenValidOccupationGroupGETChildResponsePayload
  );

  // AND WHEN the object has additional properties
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload with additional properties",
    OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload,
    { ...givenValidOccupationGroupGETChildResponsePayload, extraProperty: "foo" }
  );

  describe("validate OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload fields", () => {
    describe("Test validate of 'id'", () => {
      testObjectIdField("id", OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload);
    });
    describe("Test validate of 'parentId'", () => {
      testObjectIdField("parentId", OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload);
    });
    describe("Test validate of 'UUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.Types.GET.Response.Child.Payload>(
        "UUID",
        OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload
      );
    });
    describe("Test validate of 'originUUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.Types.GET.Response.Child.Payload>(
        "originUUID",
        OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload
      );
    });
    describe("Test validate of 'UUIDHistory'", () => {
      testUUIDArray<OccupationGroupAPISpecs.Types.GET.Response.Child.Payload>(
        "UUIDHistory",
        OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload,
        [],
        true
      );
    });
    describe("Test validation of 'path'", () => {
      testURIField<OccupationGroupAPISpecs.Types.GET.Response.Child.Payload>(
        "path",
        OccupationGroupAPISpecs.Constants.MAX_PATH_URI_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload
      );
    });
    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<OccupationGroupAPISpecs.Types.GET.Response.Child.Payload>(
        "tabiyaPath",
        OccupationGroupAPISpecs.Constants.MAX_TABIYA_PATH_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload
      );
    });
    describe("Test validate of 'originUri'", () => {
      testNonEmptyURIStringField<OccupationGroupAPISpecs.Types.GET.Response.Child.Payload>(
        "originUri",
        OccupationGroupAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload
      );
    });
    describe("Test validate of 'description'", () => {
      testStringField<OccupationGroupAPISpecs.Types.GET.Response.Child.Payload>(
        "description",
        OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload
      );
    });
    describe("Test validate of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.GET.Response.Child.Payload>(
        "preferredLabel",
        OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload
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
          OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload,
          caseType,
          failureMessage
        );
      });
    });
    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload);
    });
    describe("Test validate of 'createdAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.GET.Response.Child.Payload>(
        "createdAt",
        OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload
      );
    });
    describe("Test validate of 'updatedAt'", () => {
      testTimestampField<OccupationGroupAPISpecs.Types.GET.Response.Child.Payload>(
        "updatedAt",
        OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload
      );
    });
    describe("Test validation of 'code'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation,
          constructSchemaError("", "required", "must have required property 'code'"),
        ],
        [
          CaseType.Failure,
          "null",
          null,
          OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation,
          constructSchemaError("/code", "type", "must be string"),
        ],
        [
          CaseType.Failure,
          "empty string",
          "",
          OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.ESCO_OCCUPATION_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "a random string",
          getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
          OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.ESCO_OCCUPATION_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "an invalid code",
          "invalidCode",
          OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.ESCO_OCCUPATION_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "Too long code",
          getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH + 1),
          OccupationGroupEnums.Relations.Children.ObjectTypes.ESCOOccupation,
          constructSchemaError(
            "/code",
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
        // Wrong patterns for wrong objectTypes
        [
          CaseType.Failure,
          "ISCO code with LocalGroup objectType",
          getTestISCOGroupCode(),
          OccupationGroupEnums.Relations.Children.ObjectTypes.LocalGroup,
          constructSchemaError(
            "/code",
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
            "/code",
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
            "/code",
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
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.ESCO_LOCAL_OR_LOCAL_OCCUPATION_CODE}"`
          ),
        ],
      ])(
        "%s Validate '/code' when it is %s with %s objectType",
        (caseType, __description, givenValue, objectType, failureMessage) => {
          // GIVEN an object with given value
          const givenObject = {
            code: givenValue,
            objectType,
          };

          // THEN export the object to validate accordingly
          assertCaseForProperty(
            "/code",
            givenObject,
            OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload,
            caseType,
            failureMessage
          );
        }
      );
    });
    describe("Test validate of 'objectType'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'objectType'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/objectType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/objectType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "an invalid objectType",
          "invalidObjectType",
          constructSchemaError("/objectType", "enum", "must be equal to one of the allowed values"),
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
          objectType: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "/objectType",
          givenObject,
          OccupationGroupAPISpecs.Schemas.GET.Response.Child.Payload,
          caseType,
          failureMessage
        );
      });
    });
  });
});
