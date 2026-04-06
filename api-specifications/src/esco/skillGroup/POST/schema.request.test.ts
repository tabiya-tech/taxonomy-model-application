import { randomUUID } from "crypto";
import {
  testNonEmptyStringField,
  testNonEmptyURIStringField,
  testObjectIdField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testStringField,
  testUUIDArray,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import SkillGroupPOSTAPISpecs from "./index";
import SkillGroupRegexes from "../_shared/regex";

import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { assertCaseForProperty, CaseType, constructSchemaError } from "_test_utilities/assertCaseForProperty";
import { getTestSkillGroupCode } from "../../_test_utilities/testUtils";
import SkillGroupPOSTConstants from "./constants";

describe("Test SkillGroupPOSTAPISpecs.Schemas.Request.Payload validity", () => {
  // WHEN the SkillGroupPOSTAPISpecs.POST.Request.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema("SkillGroupPOSTAPISpecs.Schemas.Request.Payload", SkillGroupPOSTAPISpecs.Schemas.Request.Payload);
});
describe("Test objects against the SkillGroupPOSTAPISpecs.Schemas.Request.Payload schema", () => {
  // GIVEN a valid request payload object
  const validRequestPayload = {
    originUri: "https://path/to/group",
    code: getTestSkillGroupCode(),
    scopeNote: getTestString(SkillGroupPOSTConstants.MAX_SCOPE_NOTE_LENGTH),
    description: getTestString(SkillGroupPOSTConstants.DESCRIPTION_MAX_LENGTH),
    preferredLabel: getTestString(SkillGroupPOSTConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(SkillGroupPOSTConstants.ALT_LABEL_MAX_LENGTH)],
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupPOSTAPISpecs.Schemas.Request.Payload",
    SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
    validRequestPayload
  );

  // GIVEN the object has an empty UUIDHistory
  const givenSkillGroupPOSTRequestWithEmptyUUIDHistory = { ...validRequestPayload };
  givenSkillGroupPOSTRequestWithEmptyUUIDHistory.UUIDHistory = [];
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupPOSTAPISpecs.Schemas.Request.Payload",
    SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
    givenSkillGroupPOSTRequestWithEmptyUUIDHistory
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupPOSTAPISpecs.Schemas.Request.Payload",
    SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
    { ...validRequestPayload, UUID: randomUUID() }
  );

  describe("Validate SkillGroupPOSTAPISpecs.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<SkillGroupPOSTAPISpecs.Types.Request.Payload>(
        "originUri",
        SkillGroupPOSTAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        SkillGroupPOSTAPISpecs.Schemas.Request.Payload
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
          getTestString(SkillGroupPOSTAPISpecs.Constants.CODE_MAX_LENGTH + 1),
          constructSchemaError(
            "/code",
            "maxLength",
            `must NOT have more than ${SkillGroupPOSTAPISpecs.Constants.CODE_MAX_LENGTH} characters`
          ),
        ],
        [CaseType.Success, "a valid code", getTestSkillGroupCode(), undefined],
      ])("%s Validate 'code' when it is %s with", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          code: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "code",
          givenObject,
          SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });
    describe("Test validation of 'description'", () => {
      testStringField<SkillGroupPOSTAPISpecs.Types.Request.Payload>(
        "description",
        SkillGroupPOSTAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        SkillGroupPOSTAPISpecs.Schemas.Request.Payload
      );
    });
    describe("Test validation of 'scopeNote'", () => {
      testStringField<SkillGroupPOSTAPISpecs.Types.Request.Payload>(
        "scopeNote",
        SkillGroupPOSTAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH,
        SkillGroupPOSTAPISpecs.Schemas.Request.Payload
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
      testNonEmptyStringField<SkillGroupPOSTAPISpecs.Types.Request.Payload>(
        "preferredLabel",
        SkillGroupPOSTAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        SkillGroupPOSTAPISpecs.Schemas.Request.Payload
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
            getTestString(SkillGroupPOSTAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(SkillGroupPOSTAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1),
          ],
          undefined,
        ],
      ])("(%s) Validate 'altLabels' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          altLabels: givenValue,
        };

        assertCaseForProperty(
          "altLabels",
          givenObject,
          SkillGroupPOSTAPISpecs.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", SkillGroupPOSTAPISpecs.Schemas.Request.Payload);
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<SkillGroupPOSTAPISpecs.Types.Request.Payload>(
        "UUIDHistory",
        SkillGroupPOSTAPISpecs.Schemas.Request.Payload
      );
    });
  });
});
