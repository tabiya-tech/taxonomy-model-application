import {
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

import OccupationGroupPOSTAPISpecs from "./index";
import LanguageAPISpecs from "language";
import { testTranslatedStringArrayField, testTranslatedStringField } from "_test_utilities/translatedFieldTests";
import OccupationGroupConstants from "../_shared/constants";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationGroupEnums from "../_shared/enums";
import OccupationGroupRegexes from "../_shared/regex";
import { getTestLocalGroupCode } from "../../_test_utilities/testUtils";

describe("Test OccupationGroupPOSTAPISpecs.Schemas.Request.Payload validity", () => {
  // WHEN the OccupationGroupPOSTAPISpecs.Schemas.Request.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupPOSTAPISpecs.Schemas.Request.Payload",
    OccupationGroupPOSTAPISpecs.Schemas.Request.Payload
  );
});

describe("Test objects against the OccupationGroupPOSTAPISpecs.Schemas.Request.Payload schema", () => {
  // GIVEN a valid request payload object
  const validRequestPayload = {
    originUri: "https://path/to/group",
    groupType: OccupationGroupEnums.ObjectTypes.LocalGroup,
    code: getTestLocalGroupCode(),
    description: {
      [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName]: getTestString(
        OccupationGroupConstants.DESCRIPTION_MAX_LENGTH
      ),
    },
    preferredLabel: {
      [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName]: getTestString(
        OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH
      ),
    },
    altLabels: [
      {
        [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.dbKeyName]: getTestString(
          OccupationGroupConstants.ALT_LABEL_MAX_LENGTH
        ),
      },
    ],
    modelId: getMockId(1),
    UUIDHistory: [randomUUID(), randomUUID()],
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupPOSTAPISpecs.Schemas.Request.Payload",
    OccupationGroupPOSTAPISpecs.Schemas.Request.Payload,
    validRequestPayload
  );

  // GIVEN the object has an empty UUIDHistory
  const givenOccupationGroupPOSTRequestWithEmptyUUIDHistory = { ...validRequestPayload };
  givenOccupationGroupPOSTRequestWithEmptyUUIDHistory.UUIDHistory = [];
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupPOSTAPISpecs.Schemas.Request.Payload",
    OccupationGroupPOSTAPISpecs.Schemas.Request.Payload,
    givenOccupationGroupPOSTRequestWithEmptyUUIDHistory
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupPOSTAPISpecs.Schemas.Request.Payload",
    OccupationGroupPOSTAPISpecs.Schemas.Request.Payload,
    { ...validRequestPayload, UUID: randomUUID() }
  );

  describe("Validate OccupationGroupPOSTAPISpecs.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'originUri'", () => {
      testNonEmptyURIStringField<OccupationGroupPOSTAPISpecs.Types.Request.Payload>(
        "originUri",
        OccupationGroupConstants.ORIGIN_URI_MAX_LENGTH,
        OccupationGroupPOSTAPISpecs.Schemas.Request.Payload
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
          OccupationGroupPOSTAPISpecs.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });

    describe("Test validation of 'description'", () => {
      testTranslatedStringField(
        "description",
        OccupationGroupConstants.DESCRIPTION_MAX_LENGTH,
        OccupationGroupPOSTAPISpecs.Schemas.Request.Payload,
        "full"
      );
    });

    describe("Test validation of 'preferredLabel'", () => {
      testTranslatedStringField(
        "preferredLabel",
        OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH,
        OccupationGroupPOSTAPISpecs.Schemas.Request.Payload,
        "full"
      );
    });

    describe("Test validation of 'altLabels'", () => {
      testTranslatedStringArrayField(
        "altLabels",
        OccupationGroupConstants.ALT_LABEL_MAX_LENGTH,
        OccupationGroupPOSTAPISpecs.Schemas.Request.Payload,
        "full"
      );
    });

    describe("Test validation of 'modelId'", () => {
      testObjectIdField("modelId", OccupationGroupPOSTAPISpecs.Schemas.Request.Payload);
    });

    describe("Test validation of 'UUIDHistory'", () => {
      testUUIDArray<OccupationGroupPOSTAPISpecs.Types.Request.Payload>(
        "UUIDHistory",
        OccupationGroupPOSTAPISpecs.Schemas.Request.Payload
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
          OccupationGroupPOSTAPISpecs.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });
  });
});
