import APIError from "./index"
import {
  testSchemaWithInvalidObject,
  testSchemaWithValidObject,
  testValidSchema
} from "../_test_utilities/stdSchemaTests";

describe('Test the Error Schema', () => {

  // GIVEN the APIError.Schemas.Payload schema

  // WHEN the schema is validated

  // THEN expect the schema to be valid
  testValidSchema("APIError.Schemas.Payload", APIError.Schemas.Payload);
});

describe('Validate JSON against the APIError Schema', () => {
  // GIVEN a valid APIError object
  const givenValidAPIError : APIError.Types.Payload = {
    details: "Foo",
    errorCode: APIError.Constants.ErrorCodes.INTERNAL_SERVER_ERROR,
    message: "Bar"
  }

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject("APIError.Schemas.Payload", APIError.Schemas.Payload, givenValidAPIError)

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithInvalidObject( "APIError.Schemas.Payload", APIError.Schemas.Payload, givenValidAPIError)
});