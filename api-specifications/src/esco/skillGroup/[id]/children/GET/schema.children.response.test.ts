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

import SkillGroupGETChildrenAPISpecs from "./index";
import SkillGroupEnums from "../../../_shared/enums";
import SkillGroupRegexes from "../../../_shared/regex";

import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";

import { getTestSkillGroupCode } from "../../../../_test_utilities/testUtils";
import SkillGroupConstants from "../../../_shared/constants";
describe("Test SkillGroupGETChildrenAPISpecs children schema validity", () => {
  // WHEN the SkillGroupGETChildrenAPISpecs.GET.Response.Children.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillGroupGETChildrenAPISpecs.Schemas.Response.Children.Payload",
    SkillGroupGETChildrenAPISpecs.Schemas.Response.Children.Payload
  );
});
describe("Test Object against the SkillGroupGETChildrenAPISpecs.Schemas.Response.Children.Payload schema", () => {
  // GIVEN a valid response payload object
  const givenValidChild = {
    id: getMockId(3),
    parentId: getMockId(2),
    UUID: randomUUID(),
    originUUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    UUIDHistory: [randomUUID(), randomUUID()],
    description: getTestString(SkillGroupConstants.DESCRIPTION_MAX_LENGTH),
    preferredLabel: getTestString(SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(SkillGroupConstants.ALT_LABEL_MAX_LENGTH)],
    createdAt: new Date().toISOString(),
    modelId: getMockId(1),
    objectType: SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
    isLocalized: true,
    updatedAt: new Date().toISOString(),
  };

  const givenValidSkillGroupChildrenResponsePayload = {
    data: [givenValidChild],
    limit: 1,
    nextCursor: null,
  };

  // WHEN the object is tested against the schema
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupGETChildrenAPISpecs.Schemas.Response.Children.Payload",
    SkillGroupGETChildrenAPISpecs.Schemas.Response.Children.Payload,
    givenValidSkillGroupChildrenResponsePayload
  );

  // AND when the object has additional properties
  // THEN expect the validation to fail
  testSchemaWithAdditionalProperties(
    "SkillGroupGETChildrenAPISpecs.Schemas.Response.Children.Payload",
    SkillGroupGETChildrenAPISpecs.Schemas.Response.Children.Payload,
    { ...givenValidSkillGroupChildrenResponsePayload, additionalProp: "foo" }
  );

  describe("Validate SkillGroupGETChildrenAPISpecs.Schemas.Response.Children.Payload properties", () => {
    // spread the items of the schema into the schema itself
    // we do this because we want to test the fields, not the fact that they are in an array
    // and in cases where we use reusable test functions we do not have control over the givenObject
    const { properties, ...rest } = SkillGroupGETChildrenAPISpecs.Schemas.Response.Children.Payload;
    const givenSchema = { ...rest, ...properties.data.items };
    describe("Test validate of 'id' ", () => {
      testObjectIdField("id", givenSchema);
    });
    describe("Test validate of 'UUID'", () => {
      testUUIDField<SkillGroupGETChildrenAPISpecs.Types.Response.Children.Payload>("UUID", givenSchema);
    });
    describe("Test validate of 'originUUID'", () => {
      testUUIDField<SkillGroupGETChildrenAPISpecs.Types.Response.Children.Payload>("originUUID", givenSchema);
    });

    describe("Test validate of 'UUIDHistory'", () => {
      testUUIDArray<SkillGroupGETChildrenAPISpecs.Types.Response.Children.Payload>(
        "UUIDHistory",
        givenSchema,
        [],
        true
      );
    });
    describe("Test validation of 'path'", () => {
      testURIField<SkillGroupGETChildrenAPISpecs.Types.Response.Children.Payload>(
        "path",
        SkillGroupConstants.MAX_PATH_URI_LENGTH,
        givenSchema
      );
    });

    describe("Test validation of 'tabiyaPath'", () => {
      testURIField<SkillGroupGETChildrenAPISpecs.Types.Response.Children.Payload>(
        "tabiyaPath",
        SkillGroupConstants.MAX_TABIYA_PATH_LENGTH,
        givenSchema
      );
    });
    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<SkillGroupGETChildrenAPISpecs.Types.Response.Children.Payload>(
        "originUri",
        SkillGroupConstants.ORIGIN_URI_MAX_LENGTH,
        givenSchema
      );
    });
    describe("Test validate of 'description'", () => {
      testStringField<SkillGroupGETChildrenAPISpecs.Types.Response.Children.Payload>(
        "description",
        SkillGroupConstants.DESCRIPTION_MAX_LENGTH,
        givenSchema
      );
    });
    describe("Test validate of 'preferredLabel'", () => {
      testNonEmptyStringField<SkillGroupGETChildrenAPISpecs.Types.Response.Children.Payload>(
        "preferredLabel",
        SkillGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
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
            getTestString(SkillGroupConstants.ALT_LABEL_MAX_LENGTH),
            getTestString(SkillGroupConstants.ALT_LABEL_MAX_LENGTH - 1),
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
        [CaseType.Success, "a valid objectType", SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup, undefined],
        [CaseType.Success, "a valid objectType", SkillGroupEnums.Relations.Children.ObjectTypes.Skill, undefined],
      ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          objectType: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty("/objectType", givenObject, givenSchema, caseType, failureMessage);
      });
    });
    describe("Test validation of 'code'", () => {
      test.each([
        [CaseType.Success, "undefined", undefined, SkillGroupEnums.Relations.Children.ObjectTypes.Skill, undefined],
        [
          CaseType.Failure,
          "null",
          null,
          SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
          constructSchemaError("/code", "type", "must be string"),
        ],
        [
          CaseType.Failure,
          "empty string",
          "",
          SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
          constructSchemaError("/code", "pattern", `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`),
        ],
        [
          CaseType.Failure,
          "a random string",
          getTestString(SkillGroupConstants.CODE_MAX_LENGTH),
          SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
          constructSchemaError("/code", "pattern", `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`),
        ],
        [
          CaseType.Failure,
          "an invalid code",
          "invalidCode",
          SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
          constructSchemaError("/code", "pattern", `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`),
        ],
        [
          CaseType.Failure,
          "Too long code",
          getTestString(SkillGroupConstants.CODE_MAX_LENGTH + 1),
          SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
          constructSchemaError(
            "/code",
            "maxLength",
            `must NOT have more than ${SkillGroupConstants.CODE_MAX_LENGTH} characters`
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
          getTestString(SkillGroupConstants.CODE_MAX_LENGTH - 2, "9"),
          SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup,
          constructSchemaError("/code", "pattern", `must match pattern "${SkillGroupRegexes.Str.SKILL_GROUP_CODE}"`),
        ],
      ])(
        "%s Validate '/code' when it is %s with ",
        (caseType, __description, givenValue, objectType, failureMessage) => {
          // GIVEN an object with given value
          const givenObject = {
            objectType,
            code: givenValue,
          };

          // THEN export the object to validate accordingly
          assertCaseForProperty("/code", givenObject, givenSchema, caseType, failureMessage);
        }
      );
    });
    describe("Test validation of 'isLocalized'", () => {
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
          constructSchemaError("/isLocalized", "type", "must be boolean"),
        ],
        [
          CaseType.Failure,
          "empty string",
          "",
          SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
          constructSchemaError("/isLocalized", "type", "must be boolean"),
        ],
        [
          CaseType.Failure,
          "a random string",
          getTestString(20),
          SkillGroupEnums.Relations.Children.ObjectTypes.Skill,
          constructSchemaError("/isLocalized", "type", "must be boolean"),
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
        "%s Validate '/isLocalized' when it is %s with ",
        (caseType, __description, givenValue, objectType, failureMessage) => {
          // GIVEN an object with given value
          const givenObject = {
            objectType,
            isLocalized: givenValue,
          };

          // THEN export the object to validate accordingly
          assertCaseForProperty("/isLocalized", givenObject, givenSchema, caseType, failureMessage);
        }
      );
    });
    describe("Test validate of 'createdAt'", () => {
      testTimestampField<SkillGroupGETChildrenAPISpecs.Types.Response.Children.Payload>("createdAt", givenSchema);
    });
    describe("Test validate of 'updatedAt'", () => {
      testTimestampField<SkillGroupGETChildrenAPISpecs.Types.Response.Children.Payload>("updatedAt", givenSchema);
    });
  });
});
