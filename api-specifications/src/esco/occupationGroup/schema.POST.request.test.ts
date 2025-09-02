import {
  testStringField,
  testNonEmptyStringField,
  testURIField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
  testUUIDArray,
} from "_test_utilities/stdSchemaTests";

import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";

import OccupationGroupAPISpecs from "./index";
import OccupationGroupConstants from "./constants";
import { getMockId } from "_test_utilities/mockMongoId";

// ----------------------------------------------
// Test POST Request schema
// ----------------------------------------------

describe("Test OccupationGroupAPISpecs.Schemas.POST.Response.Payload validity", () => {
  // WHEN the OccupationGroupAPISpecs.POST.Request.Schema.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupAPISpecs.Schemas.POST.Request.Payload",
    OccupationGroupAPISpecs.Schemas.POST.Response.Payload
  );
});

describe("Test objects against the OccupationGroupAPISpecs.Schemas.POST.Request.Payload schema", () => {
  const validRequestPayload = {
    originUri: "https://path/to/group",
    code: getTestString(OccupationGroupConstants.CODE_MAX_LENGTH),
    description: getTestString(OccupationGroupConstants.DESCRIPTION_MAX_LENGTH),
    preferredLabel: getTestString(OccupationGroupConstants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getTestString(OccupationGroupConstants.ALT_LABEL_MAX_LENGTH)],
    importId: getTestString(OccupationGroupConstants.IMPORT_ID_MAX_LENGTH),
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
    validRequestPayload
  );

  describe("Validate OccupationGroupAPISpecs.Schemas.POST.Request.Payload fields", () => {
    describe("Test validation of 'originUri'", () => {
      testURIField<OccupationGroupAPISpecs.Types.POST.Request.Payload>(
        "originUri",
        OccupationGroupAPISpecs.Constants.MAX_URI_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Request.Payload
      );
    });

    describe("Test validation of 'code'", () => {
      testNonEmptyStringField<OccupationGroupAPISpecs.Types.POST.Request.Payload>(
        "code",
        OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Request.Payload
      );
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
          CaseType.Success,
          "an array of valid altLabels strings",
          [
            getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
            getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH),
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

    describe("Test validation of 'importId'", () => {
      testStringField<OccupationGroupAPISpecs.Types.POST.Request.Payload>(
        "importId",
        OccupationGroupAPISpecs.Constants.IMPORT_ID_MAX_LENGTH,
        OccupationGroupAPISpecs.Schemas.POST.Request.Payload
      );
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
  });
});
