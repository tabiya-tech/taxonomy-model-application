import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
} from "_test_utilities/stdSchemaTests";

import { randomUUID } from "crypto";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";

import PUTOccupationGroupParentOperation from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationGroupParentEnums from "./enums";

describe("Test PUTOccupationGroupParentOperation.Schemas.Request.Payload validity", () => {
  // WHEN the PUTOccupationGroupParentOperation.Schemas.Request.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "PUTOccupationGroupParentOperation.Schemas.Request.Payload",
    PUTOccupationGroupParentOperation.Schemas.Request.Payload
  );
});

describe("Test objects against the PUTOccupationGroupParentOperation.Schemas.Request.Payload schema", () => {
  // GIVEN a valid request payload object
  const validRequestPayload = {
    id: getMockId(1),
    objectType: OccupationGroupParentEnums.ObjectTypes.ISCOGroup,
  };
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "PUTOccupationGroupParentOperation.Schemas.Request.Payload",
    PUTOccupationGroupParentOperation.Schemas.Request.Payload,
    validRequestPayload
  );

  // GIVEN the object has an invalid id
  const givenOccupationGroupPUTParentRequestWithInvalidId = { ...validRequestPayload };
  givenOccupationGroupPUTParentRequestWithInvalidId.id = "invalidObjectId";
  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "PUTOccupationGroupParentOperation.Schemas.Request.Payload",
    PUTOccupationGroupParentOperation.Schemas.Request.Payload,
    { ...validRequestPayload, UUID: randomUUID() }
  );
  describe("Validate PUTOccupationGroupParentOperation.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'id'", () => {
      testObjectIdField("id", PUTOccupationGroupParentOperation.Schemas.Request.Payload);
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
        [CaseType.Success, "a valid objectType", OccupationGroupParentEnums.ObjectTypes.ISCOGroup, undefined],
        [
          CaseType.Success,
          "a valid objectType:localGroup",
          OccupationGroupParentEnums.ObjectTypes.LocalGroup,
          undefined,
        ],
      ])("%s Validate 'objectType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          objectType: givenValue,
        };

        // THEN expect the object to validate accordingly
        assertCaseForProperty(
          "objectType",
          givenObject,
          PUTOccupationGroupParentOperation.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });
  });
});
