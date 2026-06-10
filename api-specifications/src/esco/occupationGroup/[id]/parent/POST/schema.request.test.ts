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

import OccupationGroupPOSTParentAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationGroupParentEnums from "./enums";
import OccupationGroupRegexes from "../../../_shared/regex";

describe("Test OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload validity", () => {
  // WHEN the OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload",
    OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload
  );
});

describe("Test objects against the OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload schema", () => {
  // GIVEN a valid request payload object
  const validRequestPayload = {
    id: getMockId(1),
    objectType: OccupationGroupParentEnums.ObjectTypes.ISCOGroup,
  };
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload",
    OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload,
    validRequestPayload
  );

  // GIVEN the object has an invalid id
  const givenOccupationGroupPOSTParentRequestWithInvalidId = { ...validRequestPayload };
  givenOccupationGroupPOSTParentRequestWithInvalidId.id = "invalidObjectId";
  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "OccupationGroupPOSTParentsAPISpecs.Schemas.Request.Payload",
    OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload,
    { ...validRequestPayload, UUID: randomUUID() }
  );
  describe("Validate OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'id'", () => {
      testObjectIdField("id", OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload);
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

        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "objectType",
          givenObject,
          OccupationGroupPOSTParentAPISpecs.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });
  });
});
