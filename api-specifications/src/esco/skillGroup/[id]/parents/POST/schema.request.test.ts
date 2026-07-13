import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
  testObjectIdField,
} from "_test_utilities/stdSchemaTests";

import { randomUUID } from "crypto";
import { CaseType, assertCaseForProperty, constructSchemaError } from "_test_utilities/assertCaseForProperty";

import SkillGroupPOSTParentsAPISpecs from "./index";
import { getMockId } from "_test_utilities/mockMongoId";
import SkillGroupParentEnums from "./enums";

describe("Test SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload validity", () => {
  // WHEN the SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload schema
  // THEN expect the givenSchema to be valid
  testValidSchema(
    "SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload",
    SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload
  );
});

describe("Test objects against the SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload schema", () => {
  // GIVEN a valid request payload object
  const validRequestPayload = {
    parentId: getMockId(1),
    parentType: SkillGroupParentEnums.ObjectTypes.SkillGroup,
  };
  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload",
    SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload,
    validRequestPayload
  );

  // GIVEN the object has an invalid parentId
  const givenSkillGroupPOSTParentsRequestWithInvalidId = { ...validRequestPayload };
  givenSkillGroupPOSTParentsRequestWithInvalidId.parentId = "invalidObjectId";
  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload",
    SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload,
    { ...validRequestPayload, UUID: randomUUID() }
  );
  describe("Validate SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload fields", () => {
    describe("Test validation of 'parentId'", () => {
      testObjectIdField("parentId", SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload);
    });
    describe("Test validate of 'parentType'", () => {
      test.each([
        [
          CaseType.Failure,
          "undefined",
          undefined,
          constructSchemaError("", "required", "must have required property 'parentType'"),
        ],
        [CaseType.Failure, "null", null, constructSchemaError("/parentType", "type", "must be string")],
        [
          CaseType.Failure,
          "empty string",
          "",
          constructSchemaError("/parentType", "enum", "must be equal to one of the allowed values"),
        ],
        [
          CaseType.Failure,
          "an invalid parentType",
          "invalidParentType",
          constructSchemaError("/parentType", "enum", "must be equal to one of the allowed values"),
        ],
        [CaseType.Success, "a valid parentType", SkillGroupParentEnums.ObjectTypes.SkillGroup, undefined],
      ])("%s Validate 'parentType' when it is %s", (caseType, __description, givenValue, failureMessage) => {
        // GIVEN an object with given value
        const givenObject = {
          parentType: givenValue,
        };

        // THEN export the object to validate accordingly
        assertCaseForProperty(
          "parentType",
          givenObject,
          SkillGroupPOSTParentsAPISpecs.Schemas.Request.Payload,
          caseType,
          failureMessage
        );
      });
    });
  });
});
