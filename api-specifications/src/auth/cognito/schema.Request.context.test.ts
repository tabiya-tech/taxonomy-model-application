import Constants from "../constants";
import CognitoTypes from "./types";
import CognitoEnums from "./enums";

import { testSchemaWithValidObject, testStringField, testValidSchema } from "_test_utilities/stdSchemaTests";
import {
  _Machine2MachineSchema,
  _HumanInTheLoopSchema,
  SchemaAuthCognitoRequestContext,
} from "./schema.Request.context";

describe("Test Schema.Request.Context", () => {
  describe("Test HumanInTheLoopSchema", () => {
    // GIVEN the HumanInTheLoopSchema schema
    // WHEN the schema is validated
    // THEN expect the schema to be valid
    testValidSchema("HumanInTheLoopSchema", _HumanInTheLoopSchema);

    // GIVEN a valid HumanInTheLoopSchema object
    const givenValidObject: CognitoTypes.Context = {
      authType: CognitoEnums.TokenType.HUMAN_IN_THE_LOOP,
      groups: "group-1",
    };

    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject("HumanInTheLoopSchema", _HumanInTheLoopSchema, givenValidObject);
  });

  describe("Test Machine2MachineSchema", () => {
    // GIVEN the Machine2MachineSchema schema
    // WHEN the schema is validated
    // THEN expect the schema to be valid
    testValidSchema("Machine2MachineSchema", _Machine2MachineSchema);

    // GIVEN a valid Machine2MachineSchema object
    const givenValidObject: CognitoTypes.Context = {
      authType: CognitoEnums.TokenType.MACHINE_TO_MACHINE,
      clientId: "some client id",
    };

    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject("Machine2MachineSchema", _Machine2MachineSchema, givenValidObject);

    describe("Test validation of 'clientId'", () => {
      testStringField<CognitoTypes.Context>("clientId", Constants.CLIENT_ID_MAX_LENGTH, _Machine2MachineSchema);
    });
  });

  describe("Test SchemaAuthCognitoRequestContext", () => {
    // GIVEN the ESchema.Request.Context.Payload schema
    // WHEN the schema is validated
    // THEN expect the schema to be valid
    testValidSchema("Schema.Request.Context.Payload", SchemaAuthCognitoRequestContext);

    // GIVEN a valid SchemaAuthCognitoRequestContext object
    const givenValidObject: CognitoTypes.Context = {
      authType: CognitoEnums.TokenType.HUMAN_IN_THE_LOOP,
      groups: "group 1",
    };

    // WHEN the object is validated
    // THEN expect the object to validate successfully
    testSchemaWithValidObject("SchemaAuthCognitoRequestContext", SchemaAuthCognitoRequestContext, givenValidObject);
  });
});
