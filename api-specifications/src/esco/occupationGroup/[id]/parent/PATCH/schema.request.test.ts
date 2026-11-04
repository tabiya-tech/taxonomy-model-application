import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
} from "_test_utilities/stdSchemaTests";

import { randomUUID } from "crypto";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";

import PATCHOccupationGroupParentOperation from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationGroupParentEnums from "./enums";

describe("Test PATCHOccupationGroupParentOperation.Schemas.Request.Payload validity", () => {
  // WHEN the PATCHOccupationGroupParentOperation.Schemas.Request.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "PATCHOccupationGroupParentOperation.Schemas.Request.Payload",
    PATCHOccupationGroupParentOperation.Schemas.Request.Payload
  );
});

describe("Test objects against the PATCHOccupationGroupParentOperation.Schemas.Request.Payload schema", () => {
  // GIVEN a valid request payload object
  const validRequestPayload = {
    id: getMockId(1),
    objectType: OccupationGroupParentEnums.ObjectTypes.ISCOGroup,
  };
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "PATCHOccupationGroupParentOperation.Schemas.Request.Payload",
    PATCHOccupationGroupParentOperation.Schemas.Request.Payload,
    validRequestPayload
  );

  // GIVEN the object has an invalid id
  const givenOccupationGroupPATCHParentRequestWithInvalidId = { ...validRequestPayload };
  givenOccupationGroupPATCHParentRequestWithInvalidId.id = "invalidObjectId";
  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "PATCHOccupationGroupParentOperation.Schemas.Request.Payload",
    PATCHOccupationGroupParentOperation.Schemas.Request.Payload,
    { ...validRequestPayload, UUID: randomUUID() }
  );
  describe("Validate PATCHOccupationGroupParentOperation.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'id'", () => {
      testObjectIdField("id", PATCHOccupationGroupParentOperation.Schemas.Request.Payload);
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
          PATCHOccupationGroupParentOperation.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });
  });
});
