import {
  testStringField,
  testNonEmptyStringField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
  testUUIDArray,
  testNonEmptyURIStringField,
} from "_test_utilities/stdSchemaTests";

import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";

import OccupationGroupAPISpecs from "./index";
import OccupationGroupConstants from "./constants";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationGroupEnums from "./enums";
import OccupationGroupRegexes from "./regex";
import { getTestLocalGroupCode } from "../_test_utilities/testUtils";

describe("Test OccupationGroupAPISpecs.Schemas.POST.Request.Payload validity", () => {
  // WHEN the OccupationGroupAPISpecs.POST.Request.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.POST.Request.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Request.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.POST.Request.Payload schema", () => {
  // GIVEN a valid request payload object
  const validRequestPayload = {
    originUri: "https://path/to/group",
    groupType: OccupationGroupEnums.ObjectTypes.LocalGroup,
    code: getTestLocalGroupCode(),
    description: getTestString(OccupationGroupConstants.DESCRIPTION_MAX_LENGTH),
    preferredLabel: getTestString(OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(OccupationGroupConstants.ALT_LABEL_MAX_LENGTH)],
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.POST.Request.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Request.Payload,
    validRequestPayload
  );

  // GIVEN the object has an empty UUIDHistory
  const givenOccupationGroupPOSTRequestWithEmptyUUIDHistory = { ...validRequestPayload };
  givenOccupationGroupPOSTRequestWithEmptyUUIDHistory.UUIDHistory = [];
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupAPISpecs.Schemas.POST.Request.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Request.Payload,
    givenOccupationGroupPOSTRequestWithEmptyUUIDHistory
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupAPISpecs.Schemas.POST.Request.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Request.Payload,
    { ...validRequestPayload, UUID: randomUUID() }
  );

  describe("Validate OccupationGroupAPISpecs.Schemas.POST.Request.Payload fields", () => {
    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<OccupationGroupAPISpecs.Types.POST.Response.Payload>(
        "originUri",
        OccupationGroupAPISpecs.Constants.ORIGIN_URI_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Request.Payload
      );
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
            `must match pattern "${OccupationGroupRegexes.Str.LOCAL_GROUP_CODE}"`
          ),
        ],
        [
          CaseType.Failure,
          "an invalid code",
          "1234",
          constructSchemaError(
            "/code",
            "pattern",
            `must match pattern "${OccupationGroupRegexes.Str.LOCAL_GROUP_CODE}"`
          ),
        ],
        [CaseType.Success, "a valid code", getTestLocalGroupCode(), undefined],
      ])("%s Validate 'code' when it is %s", (caseType, _description, givenValue, failureMessage) => {
        const givenObject = {
          ...validRequestPayload,
          code: givenValue,
        };

        assertCaseForProperty(
          "code",
          givenObject,
          OccupationGroupAPISpecs.Schemas.POST.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'description'", () => {
      testStringField<OccupationGroupAPISpecs.Types.POST.Request.Payload>(
        "description",
        OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Request.Payload
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.POST.Request.Payload>(
        "preferredLabel",
        OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Request.Payload
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
            getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH - 1),
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
          OccupationGroupAPISpecs.Schemas.POST.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupAPISpecs.Schemas.POST.Request.Payload);
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<OccupationGroupAPISpecs.Types.POST.Request.Payload>(
        "UUIDHistory",
        OccupationGroupAPISpecs.Schemas.POST.Request.Payload
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
        [CaseType.Success, "a valid groupType", OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup, undefined],
        [
          CaseType.Success,
          "a valid groupType:localGroup",
          OccupationGroupAPISpecs.Enums.ObjectTypes.LocalGroup,
          undefined,
        ],
      ])("%s Validate 'groupType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          groupType: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "groupType",
          givenObject,
          OccupationGroupAPISpecs.Schemas.POST.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });
  });
});
