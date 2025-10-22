import {
  testNonEmptyStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testUUIDField,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import OccupationGroupAPISpecs from ".";
import { getMockId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/specialCharacters";
import { randomUUID } from "crypto";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import OccupationGroupEnums from "./enums";
import {
  getStdNonEmptyStringTestCases,
  getStdObjectIdTestCases,
  getStdUUIDTestCases,
} from "_test_utilities/stdSchemaTestCases";
import OccupationGroupRegexes from "./regex";
import {
  getTestESCOOccupationCode,
  getTestISCOGroupCode,
  getTestLocalGroupCode,
  getTestLocalOccupationCode,
} from "../_test_utilities/testUtils";

describe("Test OccupationGroupAPISpecs.Schemas.GET.Response.Children.Payload Schema validity", () => {
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Children.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Children.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.GET.Response.Children.Payload schema", () => {
  // GIVEN a valid children response payload object
  const givenChild = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestESCOOccupationCode(),
    preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupEnums.ObjectTypes.ESCOOccupation,
  };
  const givenValidOccupationGroupGETResponseChildrenResponse = [givenChild];

  // WHEN the object is valid
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Children.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Children.Payload,
    givenValidOccupationGroupGETResponseChildrenResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.GET.Response.Children.Payload",
    OccupationGroupAPISpecs.Schemas.GET.Response.Children.Payload,
    [{ ...givenChild, extraProperty: "foo" }]
  );

  describe("Validate OccupationGroupAPISpecs.Schemas.GET.Response.Children.Payload properties", () => {
    // spread the items of the schema into the schema itself
    // we do this because we want to test the fields, not the fact that tye are in an array
    // and in ca ses where we use reusable test functions we do not have control over the givenObject
    const { items, ...rest } = OccupationGroupAPISpecs.Schemas.GET.Response.Children.Payload;
    const givenSchema = { ...rest, ...items };

    describe("Test validation of 'id'", () => {
      testObjectIdField("id", givenSchema);
    });

    describe("Test validation of 'UUID'", () => {
      testUUIDField<OccupationGroupAPISpecs.Types.GET.Response.Children>("UUID", givenSchema);
    });
    describe("Test validate of 'code'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          OccupationGroupEnums.ObjectTypes.ISCOGroup,
          constructSchemaError("", "required", "must have required property 'code'"),
        ],
        [
          CaseType.Failure,
          "null",
          null,
          OccupationGroupEnums.ObjectTypes.ISCOGroup,
          constructSchemaError("/code", "type", "must be string"),
        ],
        [
          CaseType.Failure,
          "empty string",
          "",
          OccupationGroupEnums.ObjectTypes.ISCOGroup,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.ISCO_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "an invalid code",
          "invalidCode",
          OccupationGroupEnums.ObjectTypes.ISCOGroup,
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.ISCO_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "Too long code",
          getTestString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH + 1),
          OccupationGroupEnums.ObjectTypes.ISCOGroup,
          constructSchemaError(
            "/code",
            "maxLength",
            `must NOT have more than ${OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH} characters`
          ),
        ],
        [
          CaseType.Success,
          "a valid ISCO code",
          getTestISCOGroupCode(),
          OccupationGroupEnums.ObjectTypes.ISCOGroup,
          undefined,
        ],
        [
          CaseType.Success,
          "a valid Local code",
          getTestLocalGroupCode(),
          OccupationGroupEnums.ObjectTypes.LocalGroup,
          undefined,
        ],
        // Wrong pattern for wrong objectType
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
        "%s Validate 'code' when it is %s with %s objectType",
        (caseType, __description, givenValue, objectType, failureMessage) => {
          // GIVEN an object with given value
          const givenObject = {
            code: givenValue,
            objectType,
          };

          // THEN export the object to validate accordingly
          assertCaseForProperty("code", givenObject, givenSchema, caseType, failureMessage);
        }
      );
    });

    describe("Test validate of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.GET.Response.Children>(
        "preferredLabel",
        OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        givenSchema
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
        [CaseType.Success, "a valid objectType", OccupationGroupEnums.ObjectTypes.ISCOGroup, undefined],
        [CaseType.Success, "a valid objectType", OccupationGroupEnums.ObjectTypes.ESCOOccupation, undefined],
        [CaseType.Success, "a valid objectType", OccupationGroupEnums.ObjectTypes.LocalGroup, undefined],
        [CaseType.Success, "a valid objectType", OccupationGroupEnums.ObjectTypes.LocalOccupation, undefined],
      ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          objectType: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty("objectType", givenObject, givenSchema, caseType, failureMessage);
      });
    });
  });
});
