import AuthAPISpecs from "./index";
import {
  testNonEmptyStringField,
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import AuthConstants from "./constants";
import { getStdStringTestCases } from "_test_utilities/stdSchemaTestCases";
import { assertCaseForProperty, CaseType } from "_test_utilities/assertCaseForProperty";

describe("Test the AuthSchema", () => {
  // GIVEN the AuthAPISpecs.Schemas.Request.Context schema

  // WHEN the schema is validated
  // THEN expect the schema to be valid
  testValidSchema("Auth.Schemas.GET.Response.Payload", AuthAPISpecs.Schemas.Request.Context);
});

describe("Validate JSON against the Auth Schema", () => {
  // GIVEN a valid ModelAuthResponse object
  const givenValidAuthResponse: AuthAPISpecs.Types.Request.Context = {
    username: "username",
    roles: "role1, role2",
  };

  // WHEN the object is validated
  // THEN expect the object to validate successfully
  testSchemaWithValidObject(
    "Auth.Schemas.GET.Response.Payload",
    AuthAPISpecs.Schemas.Request.Context,
    givenValidAuthResponse
  );

  // AND WHEN the object has additional properties
  // THEN expect the object to not validate
  testSchemaWithAdditionalProperties(
    "Auth.Schemas.GET.Response.Payload",
    AuthAPISpecs.Schemas.Request.Context,
    givenValidAuthResponse
  );

  describe("Validate Auth.Schemas.GET.Response.Payload fields", () => {
    describe("Test validation of 'username'", () => {
      testNonEmptyStringField<AuthAPISpecs.Types.Request.Context>(
        "username",
        AuthConstants.USERNAME_MAX_LENGTH,
        AuthAPISpecs.Schemas.Request.Context
      );
    });

    describe("Test validation of 'roles'", () => {
      test.each([
        // we are using the standard stdTimestampFieldTestCases but we are filtering out the cases that are not applicable
        // in this case, since the createdAt field can be undefined, we filter out the "undefined" case
        // and override it with our own case
        ...getStdStringTestCases("roles", AuthConstants.ROLES_MAX_LENGTH).filter(
          (testCase) => testCase[1] !== "undefined"
        ),
        [CaseType.Success, "undefined", undefined, undefined],
      ])(`(%s) Validate createdAt when it is %s`, (caseType, _description, givenValue, failureMessages) => {
        // GIVEN an object with the given value
        //@ts-ignore
        const givenObject: T = {
          roles: givenValue,
        };
        // THEN expect the object to validate accordingly
        assertCaseForProperty("roles", givenObject, AuthAPISpecs.Schemas.Request.Context, caseType, failureMessages);
      });
    });
  });
});
